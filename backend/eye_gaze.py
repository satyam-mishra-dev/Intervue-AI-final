import cv2
import numpy as np
import os
import time
import base64
from playsound import playsound
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
import threading

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

gaze = None  # Global variable to manage the EyeGaze instance

class EyeGaze:
    alert_sound = "alert.mp3"
    running = False

    def get_path(self):
        return os.getcwd()

    def alert_cheating(self, count):
        print("⚠️ Plagiarism detected! Looking away from the screen.")
        
        try:
            playsound(self.alert_sound)
        except Exception as e:
            print(f"Error playing sound: {e}")

        with open(f"{self.get_path()}/cheating_log.txt", "a") as log:
            log.write(f"Cheating attempt {count} at {time.strftime('%Y-%m-%d %H:%M:%S')}\n")

    def process_eye_region(self, eye_region):
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

    def detect(self):
        self.running = True
        eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        video_capture = cv2.VideoCapture(0)
        
        if not video_capture.isOpened():
            print("Error: Could not open webcam.")
            return
        
        video_capture.set(3, 250)  # Width
        video_capture.set(4, 125)  # Height
        cheating_attempts = 0

        def stream_video():
            frame_counter = 0
            
            while self.running:
                captured, frame = video_capture.read()
                if not captured:
                    print("Error: Failed to capture frame.")
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
                        socketio.emit('alert', {'message': 'Cheating detected!'})
                        frame_counter = 0
                else:
                    frame_counter = 0

                if not self.running:
                    break
            
            video_capture.release()
            cv2.destroyAllWindows()

        threading.Thread(target=stream_video, daemon=True).start()
        socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)

    def stop(self):
        self.running = False
        print("Eye tracking stopped.")
        socketio.stop()

@app.route("/api/stop-python", methods=["POST"])
def stop_python():
    global gaze
    if gaze and gaze.running:
        gaze.stop()
        return jsonify({"success": True, "message": "Eye tracking stopped"}), 200
    return jsonify({"success": False, "error": "No active eye tracking"}), 400

if __name__ == "__main__":
    gaze = EyeGaze()
    gaze.detect()
