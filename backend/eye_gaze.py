import cv2
import numpy as np
import os
import time
import base64
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
import threading
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

gaze = None  # Global variable to manage the EyeGaze instance

class EyeGaze:
    running = False
    video_capture = None
    thread = None

    def get_path(self):
        return os.getcwd()

    def alert_cheating(self, count):
        logger.warning(f"⚠️ Plagiarism detected! Looking away from the screen. Attempt {count}")
        
        # Log cheating attempt
        try:
            with open(f"{self.get_path()}/cheating_log.txt", "a") as log:
                log.write(f"Cheating attempt {count} at {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        except Exception as e:
            logger.error(f"Error writing to log file: {e}")

    def process_eye_region(self, eye_region):
        try:
            eye_region = cv2.equalizeHist(eye_region)
            _, thresh = cv2.threshold(eye_region, 45, 255, cv2.THRESH_BINARY_INV)
            kernel = np.ones((3,3), np.uint8)
            thresh = cv2.erode(thresh, kernel, iterations=2)
            thresh = cv2.dilate(thresh, kernel, iterations=1)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                return None, None, thresh
            
            pupil_contour = max(contours, key=cv2.contourArea)
            M = cv2.moments(pupil_contour)
            if M['m00'] == 0:
                return None, None, thresh
            
            cx = int(M['m10']/M['m00'])
            cy = int(M['m01']/M['m00'])
            
            return (cx, cy), pupil_contour, thresh
        except Exception as e:
            logger.error(f"Error processing eye region: {e}")
            return None, None, None

    def detect(self):
        self.running = True
        try:
            eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            
            if eye_cascade.empty() or face_cascade.empty():
                logger.error("Failed to load cascade classifiers")
                return
            
            self.video_capture = cv2.VideoCapture(0)
            
            if not self.video_capture.isOpened():
                logger.error("Error: Could not open webcam.")
                return
            
            self.video_capture.set(3, 250)  # Width
            self.video_capture.set(4, 125)  # Height
            cheating_attempts = 0

            def stream_video():
                frame_counter = 0
                
                while self.running:
                    try:
                        captured, frame = self.video_capture.read()
                        if not captured:
                            logger.error("Error: Failed to capture frame.")
                            break

                        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
                        
                        roi_x_start, roi_x_end = int(frame.shape[1] * 0.2), int(frame.shape[1] * 0.8)
                        roi_y_start, roi_y_end = int(frame.shape[0] * 0.2), int(frame.shape[0] * 0.8)
                        cv2.rectangle(frame, (roi_x_start, roi_y_start), (roi_x_end, roi_y_end), (255, 0, 0), 2)
                        
                        looking_away = True
                        
                        for (fx, fy, fw, fh) in faces:
                            face_center = (fx + fw//2, fy + fh//2)
                            if roi_x_start < face_center[0] < roi_x_end and roi_y_start < face_center[1] < roi_y_end:
                                roi_gray = gray[fy:fy + fh, fx:fx + fw]
                                eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=3, minSize=(25, 25))
                                
                                for (ex, ey, ew, eh) in eyes:
                                    eye_region = roi_gray[ey:ey + eh, ex:ex + ew]
                                    pupil_pos, _, _ = self.process_eye_region(eye_region)
                                    
                                    if pupil_pos is not None:
                                        cx, _ = pupil_pos
                                        if 0.1 * ew < cx < 0.9 * ew:
                                            looking_away = False
                                    
                                    break
                            
                        _, buffer = cv2.imencode('.jpg', frame)
                        frame_data = base64.b64encode(buffer).decode('utf-8')
                        socketio.emit('video_frame', frame_data)

                        if looking_away:
                            frame_counter += 1
                            if frame_counter > 15:
                                nonlocal cheating_attempts
                                cheating_attempts += 1
                                self.alert_cheating(cheating_attempts)
                                socketio.emit('alert', {'message': 'Cheating detected!', 'count': cheating_attempts})
                                frame_counter = 0
                        else:
                            frame_counter = 0

                        # Add small delay to prevent overwhelming the system
                        time.sleep(0.1)
                        
                    except Exception as e:
                        logger.error(f"Error in video stream: {e}")
                        break
                
                if self.video_capture:
                    self.video_capture.release()
                cv2.destroyAllWindows()

            self.thread = threading.Thread(target=stream_video, daemon=True)
            self.thread.start()
            
            logger.info("Eye tracking started successfully")
            socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True, debug=False)
            
        except Exception as e:
            logger.error(f"Error starting eye tracking: {e}")
            self.running = False

    def stop(self):
        self.running = False
        logger.info("Eye tracking stopped.")
        
        if self.video_capture:
            self.video_capture.release()
        
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2)
        
        try:
            socketio.stop()
        except Exception as e:
            logger.error(f"Error stopping socketio: {e}")

@app.route("/api/stop-python", methods=["POST"])
def stop_python():
    global gaze
    if gaze and gaze.running:
        gaze.stop()
        return jsonify({"success": True, "message": "Eye tracking stopped"}), 200
    return jsonify({"success": False, "error": "No active eye tracking"}), 400

@app.route("/api/health", methods=["GET"])
def health_check():
    global gaze
    return jsonify({
        "success": True, 
        "running": gaze.running if gaze else False,
        "message": "Eye tracking service is running" if gaze and gaze.running else "Eye tracking service is not running"
    }), 200

if __name__ == "__main__":
    gaze = EyeGaze()
    gaze.detect()
