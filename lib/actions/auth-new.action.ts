'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '../../firebase/admin-new';
import { auth } from '../../firebase/client';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';

// Enhanced error handling and logging
function logError(context: string, error: any) {
  console.error(`❌ ${context}:`, error.message || error);
  if (error.code) {
    console.error(`   Error Code: ${error.code}`);
  }
  if (error.stack) {
    console.error(`   Stack: ${error.stack.split('\n')[1]}`);
  }
}

// Simplified cookie management
async function setCookie(name: string, value: string, options: any = {}) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5, // 5 days
      ...options
    });
    console.log(`✅ Cookie set: ${name}`);
  } catch (error) {
    logError(`Failed to set cookie ${name}`, error);
    throw new Error(`Cookie operation failed: ${error}`);
  }
}

async function deleteCookie(name: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(name);
    console.log(`✅ Cookie deleted: ${name}`);
  } catch (error) {
    logError(`Failed to delete cookie ${name}`, error);
  }
}

async function getCookie(name: string): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  } catch (error) {
    logError(`Failed to get cookie ${name}`, error);
    return undefined;
  }
}

// Enhanced sign-in function
export async function signIn(formData: FormData) {
  try {
    console.log('🔐 Starting sign-in process...');
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    console.log(`📧 Attempting sign-in for: ${email}`);
    
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (!user) {
      throw new Error('Sign-in failed - no user returned');
    }
    
    console.log(`✅ Firebase Auth sign-in successful for: ${user.email}`);
    
    // Create custom session token
    const sessionToken = await adminAuth.createSessionCookie(user.uid, {
      expiresIn: 60 * 60 * 24 * 5 * 1000, // 5 days
    });
    
    console.log(`🎫 Session token created for user: ${user.uid}`);
    
    // Set session cookie
    await setCookie('session', sessionToken);
    
    console.log('✅ Sign-in process completed successfully');
    
    // Redirect to dashboard
    redirect('/interview');
    
  } catch (error: any) {
    logError('Sign-in process failed', error);
    
    // Provide user-friendly error messages
    let userMessage = 'Sign-in failed. Please try again.';
    
    if (error.code === 'auth/user-not-found') {
      userMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/wrong-password') {
      userMessage = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-email') {
      userMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/too-many-requests') {
      userMessage = 'Too many failed attempts. Please try again later.';
    } else if (error.message?.includes('Cookie operation failed')) {
      userMessage = 'Session creation failed. Please try again.';
    }
    
    // Return error for display
    return { error: userMessage };
  }
}

// Enhanced sign-up function
export async function signUp(formData: FormData) {
  try {
    console.log('📝 Starting sign-up process...');
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (!email || !password || !confirmPassword) {
      throw new Error('All fields are required');
    }
    
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    console.log(`📧 Attempting sign-up for: ${email}`);
    
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (!user) {
      throw new Error('Sign-up failed - no user returned');
    }
    
    console.log(`✅ Firebase Auth sign-up successful for: ${user.email}`);
    
    // Create custom session token
    const sessionToken = await adminAuth.createSessionCookie(user.uid, {
      expiresIn: 60 * 60 * 24 * 5 * 1000, // 5 days
    });
    
    console.log(`🎫 Session token created for new user: ${user.uid}`);
    
    // Set session cookie
    await setCookie('session', sessionToken);
    
    console.log('✅ Sign-up process completed successfully');
    
    // Redirect to dashboard
    redirect('/interview');
    
  } catch (error: any) {
    logError('Sign-up process failed', error);
    
    // Provide user-friendly error messages
    let userMessage = 'Sign-up failed. Please try again.';
    
    if (error.code === 'auth/email-already-in-use') {
      userMessage = 'An account with this email already exists.';
    } else if (error.code === 'auth/invalid-email') {
      userMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/weak-password') {
      userMessage = 'Password is too weak. Please choose a stronger password.';
    } else if (error.message?.includes('Passwords do not match')) {
      userMessage = 'Passwords do not match.';
    } else if (error.message?.includes('Password must be at least 6 characters')) {
      userMessage = 'Password must be at least 6 characters long.';
    } else if (error.message?.includes('Cookie operation failed')) {
      userMessage = 'Account created but session creation failed. Please sign in.';
    }
    
    // Return error for display
    return { error: userMessage };
  }
}

// Enhanced sign-out function
export async function signOut() {
  try {
    console.log('🚪 Starting sign-out process...');
    
    // Clear session cookie
    await deleteCookie('session');
    
    // Sign out from Firebase Auth
    await firebaseSignOut(auth);
    
    console.log('✅ Sign-out process completed successfully');
    
    // Redirect to home page
    redirect('/');
    
  } catch (error: any) {
    logError('Sign-out process failed', error);
    
    // Even if there's an error, try to redirect
    redirect('/');
  }
}

// Enhanced session validation
export async function validateSession(): Promise<{ user: any; error?: string }> {
  try {
    console.log('🔍 Validating session...');
    
    const sessionToken = await getCookie('session');
    
    if (!sessionToken) {
      console.log('❌ No session token found');
      return { user: null, error: 'No session found' };
    }
    
    // Verify session token
    const decodedClaims = await adminAuth.verifySessionCookie(sessionToken, true);
    
    console.log(`✅ Session validated for user: ${decodedClaims.uid}`);
    
    return { user: decodedClaims };
    
  } catch (error: any) {
    logError('Session validation failed', error);
    
    // Clear invalid session
    await deleteCookie('session');
    
    return { user: null, error: 'Invalid session' };
  }
}

// Enhanced user data retrieval
export async function getUserData(uid: string) {
  try {
    console.log(`👤 Getting user data for: ${uid}`);
    
    const userRecord = await adminAuth.getUser(uid);
    
    console.log(`✅ User data retrieved for: ${userRecord.email}`);
    
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
      createdAt: userRecord.metadata.creationTime,
      lastSignIn: userRecord.metadata.lastSignInTime
    };
    
  } catch (error: any) {
    logError('User data retrieval failed', error);
    throw new Error('Failed to get user data');
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { user } = await validateSession();
    return !!user;
  } catch (error) {
    return false;
  }
}

// Clear invalid sessions (for error recovery)
export async function clearInvalidSession() {
  try {
    console.log('🧹 Clearing invalid session...');
    await deleteCookie('session');
    console.log('✅ Invalid session cleared');
  } catch (error) {
    logError('Failed to clear invalid session', error);
  }
} 