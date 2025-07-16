import cv2
import numpy as np
import json
import asyncio
import websockets
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get host and port from environment variables (for cloud hosting)
HOST = os.getenv('HOST', 'localhost')
PORT = int(os.getenv('PORT', 5000))

class EyeTracker:
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        self.connected_clients = set()
        self.is_running = False
        
    async def start_server(self):
        """Start the WebSocket server"""
        try:
            server = await websockets.serve(
                self.handle_client, 
                HOST, 
                PORT,
                ping_interval=20,
                ping_timeout=20
            )
            logger.info(f"🚀 Eye tracking server started on {HOST}:{PORT}")
            logger.info(f"📡 WebSocket endpoint: ws://{HOST}:{PORT}")
            
            # Keep the server running
            await server.wait_closed()
        except Exception as e:
            logger.error(f"❌ Failed to start server: {e}")
            raise

    async def handle_client(self, websocket, path):
        """Handle WebSocket client connections"""
        try:
            self.connected_clients.add(websocket)
            logger.info(f"✅ Client connected. Total clients: {len(self.connected_clients)}")
            
            # Send welcome message
            await websocket.send(json.dumps({
                "type": "connection",
                "message": "Eye tracking connected",
                "timestamp": datetime.now().isoformat()
            }))
            
            # Keep connection alive and handle messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.process_message(websocket, data)
                except json.JSONDecodeError:
                    logger.warning("❌ Invalid JSON received")
                except Exception as e:
                    logger.error(f"❌ Error processing message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info("🔌 Client disconnected normally")
        except Exception as e:
            logger.error(f"❌ Client error: {e}")
        finally:
            self.connected_clients.discard(websocket)
            logger.info(f"👋 Client disconnected. Total clients: {len(self.connected_clients)}")

    async def process_message(self, websocket, data):
        """Process incoming WebSocket messages"""
        message_type = data.get('type')
        
        if message_type == 'start_tracking':
            logger.info("🎯 Starting eye tracking...")
            await self.start_eye_tracking(websocket)
        elif message_type == 'stop_tracking':
            logger.info("⏹️ Stopping eye tracking...")
            self.is_running = False
        elif message_type == 'ping':
            await websocket.send(json.dumps({
                "type": "pong",
                "timestamp": datetime.now().isoformat()
            }))
        else:
            logger.warning(f"❓ Unknown message type: {message_type}")

    async def start_eye_tracking(self, websocket):
        """Start eye tracking and send results via WebSocket"""
        self.is_running = True
        
        # Initialize camera
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            logger.error("❌ Could not open camera")
            await websocket.send(json.dumps({
                "type": "error",
                "message": "Could not open camera",
                "timestamp": datetime.now().isoformat()
            }))
            return

        logger.info("📹 Camera initialized successfully")
        
        try:
            while self.is_running:
                ret, frame = cap.read()
                if not ret:
                    logger.warning("❌ Failed to read frame")
                    continue

                # Convert to grayscale for detection
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                # Detect faces
                faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
                
                eye_data = {
                    "type": "eye_data",
                    "timestamp": datetime.now().isoformat(),
                    "face_detected": len(faces) > 0,
                    "eye_count": 0,
                    "looking_away": False
                }
                
                for (x, y, w, h) in faces:
                    roi_gray = gray[y:y+h, x:x+w]
                    roi_color = frame[y:y+h, x:x+w]
                    
                    # Detect eyes within the face region
                    eyes = self.eye_cascade.detectMultiScale(roi_gray)
                    eye_data["eye_count"] = len(eyes)
                    
                    # Draw rectangles around detected eyes
                    for (ex, ey, ew, eh) in eyes:
                        cv2.rectangle(roi_color, (ex, ey), (ex+ew, ey+eh), (0, 255, 0), 2)
                
                # Determine if user is looking away
                if len(faces) == 0 or eye_data["eye_count"] < 2:
                    eye_data["looking_away"] = True
                
                # Send data to client
                try:
                    await websocket.send(json.dumps(eye_data))
                except websockets.exceptions.ConnectionClosed:
                    logger.info("🔌 Client disconnected during tracking")
                    break
                except Exception as e:
                    logger.error(f"❌ Error sending data: {e}")
                    break
                
                # Add small delay to prevent overwhelming the client
                await asyncio.sleep(0.1)
                
        except Exception as e:
            logger.error(f"❌ Eye tracking error: {e}")
        finally:
            cap.release()
            logger.info("📹 Camera released")

async def main():
    """Main function to start the server"""
    tracker = EyeTracker()
    await tracker.start_server()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")
