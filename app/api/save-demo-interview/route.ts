import { NextResponse } from "next/server";
import { db } from "@/firebase/admin";

export async function POST(request: Request) {
  try {
    const interviewData = await request.json();
    
    // Remove the id field if it exists, let Firebase generate it
    const { id, ...interviewWithoutId } = interviewData;
    
    // Add the interview to Firebase
    const docRef = await db.collection("interviews").add(interviewWithoutId);
    
    return NextResponse.json({ 
      success: true, 
      interviewId: docRef.id,
      message: "Demo interview saved successfully" 
    });
    
  } catch (error: any) {
    console.error("Error saving demo interview:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 