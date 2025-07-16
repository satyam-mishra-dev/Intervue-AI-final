import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Try to stop the Python backend
    const response = await fetch("http://localhost:5000/api/stop-python", {
      method: "POST",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return NextResponse.json({ 
          success: true, 
          message: "Python backend stopped successfully" 
        });
      }
    }

    // If the stop endpoint doesn't work, try to check if it's still running
    try {
      const healthCheck = await fetch("http://localhost:5000/api/health", {
        method: "GET",
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });
      
      if (healthCheck.ok) {
        const data = await healthCheck.json();
        if (!data.running) {
          return NextResponse.json({ 
            success: true, 
            message: "Python backend is not running" 
          });
        }
      }
    } catch (error) {
      // Backend is not responding, assume it's stopped
      return NextResponse.json({ 
        success: true, 
        message: "Python backend appears to be stopped" 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: "Failed to stop Python backend" 
    }, { status: 500 });
    
  } catch (err: any) {
    console.error("Error stopping Python backend:", err);
    
    // If we can't reach the backend, assume it's already stopped
    if (err.name === "AbortError" || err.code === "ECONNREFUSED") {
      return NextResponse.json({ 
        success: true, 
        message: "Python backend appears to be stopped" 
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
} 