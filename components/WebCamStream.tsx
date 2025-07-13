"use client";

import { useEffect, useRef, useState } from "react";

const WebCamStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eyeData, setEyeData] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Get backend URL from environment
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:5000';

  useEffect(() => {
    const startWebcam = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user"
            }
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsConnected(true);
            setError(null);
          }
        } else {
          setError("Webcam access not supported in this browser");
        }
      } catch (err: any) {
        console.error("Error accessing webcam:", err);
        setError(err.message || "Failed to access webcam");
      }
    };

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(BACKEND_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ Connected to eye tracking backend");
          // Send start tracking command
          ws.send(JSON.stringify({ type: "start_tracking" }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "eye_data") {
              setEyeData(data);
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setError("Failed to connect to eye tracking service");
        };

        ws.onclose = () => {
          console.log("WebSocket connection closed");
          setIsConnected(false);
        };

      } catch (err) {
        console.error("Error connecting to WebSocket:", err);
        setError("Failed to connect to eye tracking service");
      }
    };

    startWebcam();
    connectWebSocket();

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [BACKEND_URL]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover rounded-lg"
        style={{ transform: 'scaleX(-1)' }} // Mirror the video
      />
      
      {/* Connection Status */}
      <div className="absolute top-2 right-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>

      {/* Eye Tracking Data */}
      {eyeData && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded text-xs">
          <div>Face: {eyeData.face_detected ? '✅' : '❌'}</div>
          <div>Eyes: {eyeData.eye_count}</div>
          <div>Looking: {eyeData.looking_away ? '❌' : '✅'}</div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
          <div className="bg-white p-2 rounded text-red-600 text-xs text-center">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebCamStream;
