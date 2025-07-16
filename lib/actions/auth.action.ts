'use server';

import { adminAuth } from '@/firebase/admin';
import { auth } from '@/firebase/client';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  UserCredential,
  updateProfile
} from 'firebase/auth';
import { cookies } from 'next/headers';

// Session cookie options
const SESSION_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 5, // 5 days
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        success: false,
        message: 'Email and password are required'
      };
    }

    // Sign in with Firebase Auth
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create session cookie
    const idToken = await user.getIdToken();
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_OPTIONS.maxAge * 1000, // Convert to milliseconds
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, SESSION_COOKIE_OPTIONS);

    console.log('User signed in successfully:', user.uid);

    return {
      success: true,
      message: 'Signed in successfully',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      }
    };

  } catch (error: any) {
    console.error('Sign in error:', error);
    
    let message = 'An error occurred during sign in';
    
    if (error.code === 'auth/user-not-found') {
      message = 'No account found with this email address';
    } else if (error.code === 'auth/wrong-password') {
      message = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Too many failed attempts. Please try again later';
    } else if (error.code === 'auth/user-disabled') {
      message = 'This account has been disabled';
    } else if (error.code === 'auth/network-request-failed') {
      message = 'Network error. Please check your connection';
    }

    return {
      success: false,
      message
    };
  }
}

export async function signUp(email: string, password: string, displayName?: string): Promise<AuthResponse> {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        success: false,
        message: 'Email and password are required'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long'
      };
    }

    // Create user with Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create session cookie
    const idToken = await user.getIdToken();
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_OPTIONS.maxAge * 1000,
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, SESSION_COOKIE_OPTIONS);

    console.log('User account created successfully:', user.uid);

    return {
      success: true,
      message: 'Account created successfully',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || displayName,
      }
    };

  } catch (error: any) {
    console.error('Sign up error:', error);
    
    let message = 'An error occurred during sign up';
    
    if (error.code === 'auth/email-already-in-use') {
      message = 'An account with this email already exists';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password is too weak';
    } else if (error.code === 'auth/operation-not-allowed') {
      message = 'Email/password accounts are not enabled';
    } else if (error.code === 'auth/network-request-failed') {
      message = 'Network error. Please check your connection';
    }

    return {
      success: false,
      message
    };
  }
}

export async function signOut(): Promise<AuthResponse> {
  try {
    // Sign out from Firebase Auth
    await firebaseSignOut(auth);

    // Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session');

    console.log('User signed out successfully');

    return {
      success: true,
      message: 'Signed out successfully'
    };

  } catch (error: any) {
    console.error('Sign out error:', error);
    
    // Still try to clear the session cookie even if Firebase sign out fails
    try {
      const cookieStore = await cookies();
      cookieStore.delete('session');
    } catch (cookieError) {
      console.error('Error clearing session cookie:', cookieError);
    }
    
    return {
      success: false,
      message: 'An error occurred during sign out'
    };
  }
}

export async function getCurrentUser(): Promise<any> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    console.log('Session verified for user:', decodedClaims.uid);
    return decodedClaims;

  } catch (error: any) {
    console.error('Get current user error:', error);
    
    // Clear invalid session cookie
    if (error.code === 'auth/session-cookie-revoked' || 
        error.code === 'auth/session-cookie-expired' ||
        error.message?.includes('audience') ||
        error.message?.includes('aud')) {
      console.log('Clearing invalid session cookie');
      const cookieStore = await cookies();
      cookieStore.delete('session');
    }
    
    return null;
  }
}

export async function refreshSession(): Promise<AuthResponse> {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        message: 'No user is currently signed in'
      };
    }

    // Force token refresh
    await user.getIdToken(true);
    
    // Create new session cookie
    const idToken = await user.getIdToken();
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_OPTIONS.maxAge * 1000,
    });

    // Set new session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, SESSION_COOKIE_OPTIONS);

    console.log('Session refreshed successfully');

    return {
      success: true,
      message: 'Session refreshed successfully'
    };

  } catch (error: any) {
    console.error('Refresh session error:', error);
    
    return {
      success: false,
      message: 'Failed to refresh session'
    };
  }
}

// Clear all session data (useful for fixing project ID mismatches)
export async function clearAllSessions(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    console.log('All sessions cleared');
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
}

// Check if user is authenticated (for layout and other components)
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    console.error('Authentication check error:', error);
    return false;
  }
}
