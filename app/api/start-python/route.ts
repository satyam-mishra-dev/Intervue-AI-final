import { NextResponse } from "next/server";

// Get the backend URL from environment variables
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST() {
  try {
    // Send start tracking command to the cloud backend
    const response = await fetch(`${BACKEND_URL}/api/start-tracking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "start_tracking"
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ 
        success: true, 
        message: "Eye tracking started successfully",
        backendUrl: BACKEND_URL
      });
    } else {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
  } catch (err: any) {
    console.error("Error starting eye tracking:", err);
    
    // If backend is not available, return success anyway (eye tracking is optional)
    return NextResponse.json({ 
      success: true, 
      message: "Eye tracking backend not available, continuing without it",
      warning: "Eye tracking features may be limited"
    });
  }
}
