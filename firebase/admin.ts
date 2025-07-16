import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
  const apps = getApps();

  if (!apps.length) {
    // Check if all required environment variables are present
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error('Missing Firebase Admin environment variables:');
      console.error('FIREBASE_PROJECT_ID:', !!projectId);
      console.error('FIREBASE_CLIENT_EMAIL:', !!clientEmail);
      console.error('FIREBASE_PRIVATE_KEY:', !!privateKey);
      throw new Error('Missing Firebase Admin environment variables');
    }

    // Format the private key properly
    if (privateKey) {
      // Remove quotes if present
      privateKey = privateKey.replace(/^["']|["']$/g, '');
      
      // Replace literal \n with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // Ensure the key starts and ends properly
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.error('Invalid Firebase private key format');
        console.error('Private key should start with: -----BEGIN PRIVATE KEY-----');
        throw new Error('Invalid Firebase private key format');
      }
    }

    // Log project IDs for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Firebase Admin Project ID:', projectId);
      console.log('Firebase Client Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    }

    // Validate that both project IDs match
    if (projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      console.error('Firebase project ID mismatch!');
      console.error('Admin Project ID:', projectId);
      console.error('Client Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
      throw new Error('Firebase project ID mismatch between client and admin configurations');
    }

    try {
      initializeApp({
        credential: cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey,
        }),
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw error;
    }
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
}

let firebaseAdmin: { auth: any; db: any } | null = null;

try {
  firebaseAdmin = initFirebaseAdmin();
} catch (error) {
  console.error('Firebase Admin initialization failed:', error);
  // In production, we might want to throw this error
  // For now, we'll allow the app to continue in guest mode
  if (process.env.NODE_ENV === 'production') {
    console.error('Firebase Admin is required in production');
  }
}

export const auth = firebaseAdmin?.auth || null;
export const db = firebaseAdmin?.db || null;
