import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST() {
  try {
    // Check if backend is already running
    try {
      const healthCheck = await fetch("http://localhost:5000/api/health", {
        method: "GET",
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });
      
      if (healthCheck.ok) {
        const data = await healthCheck.json();
        if (data.running) {
          return NextResponse.json({ 
            success: true, 
            message: "Python backend is already running" 
          });
        }
      }
    } catch (error) {
      // Backend is not running, continue to start it
      console.log("Backend not running, starting new instance...");
    }

    // Ensure correct absolute path resolution
    const scriptPath = path.join(process.cwd(), "backend", "eye_gaze.py");
    
    // Use python3 on Unix systems, python on Windows
    const isWindows = process.platform === "win32";
    const pythonCommand = isWindows ? "python" : "python3";
    
    // Wrap the script path in quotes to handle spaces in file paths
    const command = `${pythonCommand} "${scriptPath}"`;
    
    console.log(`Starting Python backend with command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error starting Python script:", error);
        return;
      }
      if (stderr) {
        console.error("Python script stderr:", stderr);
      }
      if (stdout) {
        console.log("Python script output:", stdout);
      }
    });

    // Wait a bit for the backend to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify the backend started successfully
    try {
      const healthCheck = await fetch("http://localhost:5000/api/health", {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (healthCheck.ok) {
        const data = await healthCheck.json();
        if (data.running) {
          return NextResponse.json({ 
            success: true, 
            message: "Python backend started successfully" 
          });
        }
      }
    } catch (error) {
      console.error("Backend health check failed:", error);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Python backend startup initiated (verification pending)" 
    });
    
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}
