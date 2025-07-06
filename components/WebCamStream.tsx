"use client";
import { useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";

const WebCamStream = () => {
  const [videoFrame, setVideoFrame] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [cheatingCount, setCheatingCount] = useState<number>(0);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const socketRef = useRef<Socket | null>(null);
  const backendStartedRef = useRef<boolean>(false);

  useEffect(() => {
    // Check if we're in a browser environment and have mediaDevices support
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      setWebcamError('Webcam access not available in this environment');
      return;
    }

    // Check camera permissions
    const checkPermissions = async () => {
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionStatus(permissions.state);
        
        permissions.onchange = () => {
          setPermissionStatus(permissions.state);
        };
      } catch (error) {
        console.log('Permission API not supported, will check on access');
      }
    };

    checkPermissions();

    const startPythonBackend = async () => {
      if (backendStartedRef.current) return;
      
      try {
        setConnectionStatus('connecting');
        const response = await fetch("/api/start-python", { method: "POST" });
        if (!response.ok) {
          throw new Error(`Failed to start Python backend: ${response.statusText}`);
        }
        console.log("Python backend started successfully.");
        backendStartedRef.current = true;
        
        // Wait a bit for the backend to fully start
        setTimeout(() => {
          initializeSocket();
        }, 2000);
        
      } catch (error) {
        console.error("Error starting Python backend:", error);
        setConnectionStatus('error');
      }
    };

    const initializeSocket = () => {
      try {
        // Create socket connection
        const socket = io("http://localhost:5000", {
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("Connected to eye tracking backend");
          setConnectionStatus('connected');
        });

        socket.on("disconnect", () => {
          console.log("Disconnected from eye tracking backend");
          setConnectionStatus('disconnected');
        });

        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          setConnectionStatus('error');
        });

        socket.on("video_frame", (data: string) => {
          setVideoFrame(`data:image/jpeg;base64,${data}`);
        });

        socket.on("alert", (data: { message: string; count?: number }) => {
          setAlertMessage(data.message);
          if (data.count) {
            setCheatingCount(data.count);
          }
          setTimeout(() => setAlertMessage(null), 5000);
        });

      } catch (error) {
        console.error("Error initializing socket:", error);
        setConnectionStatus('error');
      }
    };

    startPythonBackend();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Stop the Python backend when component unmounts
      fetch("/api/stop-python", { method: "POST" }).catch(console.error);
    };
  }, []);

  const testWebcamAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setWebcamError(null);
      alert('Webcam access is working! You can now start the interview.');
    } catch (error: any) {
      setWebcamError(`Webcam access denied: ${error.message}`);
      alert('Please grant camera permissions and try again.');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  const getPermissionText = () => {
    switch (permissionStatus) {
      case 'granted': return 'Camera permissions granted';
      case 'denied': return 'Camera permissions denied';
      case 'prompt': return 'Camera permissions not set';
      default: return 'Camera permissions unknown';
    }
  };

  // If webcam is not available, show error message
  if (webcamError) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-bold mb-2">Eye Tracking</h3>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">Webcam Access Required</p>
          <p className="text-sm">{webcamError}</p>
          <p className="text-sm mt-2">
            Please ensure you're using a modern browser and have granted camera permissions.
          </p>
          <button 
            onClick={testWebcamAccess}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Webcam Access
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h3 className="text-lg font-bold mb-2">Live Eye Tracking</h3>
      
      {/* Permission Status */}
      <div className={`mb-2 text-xs ${
        permissionStatus === 'granted' ? 'text-green-500' : 
        permissionStatus === 'denied' ? 'text-red-500' : 'text-yellow-500'
      }`}>
        {getPermissionText()}
      </div>
      
      {/* Connection Status */}
      <div className={`mb-2 text-sm ${getStatusColor()}`}>
        Status: {getStatusText()}
      </div>

      {/* Cheating Count */}
      {cheatingCount > 0 && (
        <div className="mb-2 text-sm text-orange-500">
          Cheating attempts: {cheatingCount}
        </div>
      )}

      {/* Alert Message */}
      {alertMessage && (
        <div className="bg-red-500 text-white p-2 rounded mb-2 animate-pulse">
          {alertMessage}
        </div>
      )}

      {/* Video Feed */}
      <div className="border border-gray-300 p-2 rounded-md">
        {connectionStatus === 'connected' && videoFrame ? (
          <img 
            src={videoFrame} 
            alt="Eye Tracking Feed" 
            className="w-full max-w-sm mx-auto"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : connectionStatus === 'error' ? (
          <div className="text-red-500 p-4">
            <p>Failed to connect to eye tracking service</p>
            <p className="text-sm mt-2">Please check if the Python backend is running</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry Connection
            </button>
          </div>
        ) : connectionStatus === 'connecting' ? (
          <div className="text-yellow-500 p-4">
            <p>Starting eye tracking service...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mt-2"></div>
          </div>
        ) : (
          <div className="text-gray-500 p-4">
            <p>Loading video feed...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebCamStream;
