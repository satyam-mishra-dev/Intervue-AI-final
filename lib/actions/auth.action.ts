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

// Simple authentication check that doesn't modify cookies
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return false;
    }

    // Just verify the session cookie without clearing it
    await adminAuth.verifySessionCookie(sessionCookie, true);
    return true;
  } catch (error: any) {
    // Don't clear cookies here - just return false
    console.log('Authentication check failed:', error.message);
    return false;
  }
}

// Get current user data (for server components)
export async function getCurrentUser(): Promise<any> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return null;
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      id: decodedClaims.uid,
      email: decodedClaims.email,
      name: decodedClaims.name || decodedClaims.display_name
    };
  } catch (error: any) {
    console.log('Get current user failed:', error.message);
    return null;
  }
}

// Sign in function
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
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
      expiresIn: SESSION_COOKIE_OPTIONS.maxAge * 1000,
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

// Sign up function
export async function signUp(email: string, password: string, displayName?: string): Promise<AuthResponse> {
  try {
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

// Sign out function
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

// Clear all sessions (for fixing project ID mismatches)
export async function clearAllSessions(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    console.log('All sessions cleared');
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
}
