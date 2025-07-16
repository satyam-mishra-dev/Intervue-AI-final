import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: true, message: 'No session to clear' });
    }

    // Try to verify the session cookie
    try {
      await adminAuth.verifySessionCookie(sessionCookie, true);
      // If verification succeeds, don't clear the cookie
      return NextResponse.json({ success: true, message: 'Session is valid' });
    } catch (error: any) {
      // If verification fails (e.g., wrong project ID), clear the cookie
      if (error.message?.includes('audience') || error.message?.includes('aud')) {
        const response = NextResponse.json({ 
          success: true, 
          message: 'Invalid session cleared' 
        });
        
        // Clear the session cookie
        response.cookies.delete('session');
        
        return response;
      }
      
      // For other errors, don't clear the cookie
      return NextResponse.json({ success: true, message: 'Session validation failed' });
    }
  } catch (error) {
    console.error('Clear session error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error clearing session' 
    }, { status: 500 });
  }
} 