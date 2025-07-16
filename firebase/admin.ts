import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { validateFirebaseConfig, formatPrivateKey, FIREBASE_CONFIG } from "@/lib/firebase-config";

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
  const apps = getApps();

  if (!apps.length) {
    // Validate Firebase configuration
    const configValidation = validateFirebaseConfig();
    
    if (!configValidation.isValid) {
      console.error('Firebase configuration validation failed:');
      configValidation.errors.forEach(error => console.error('-', error));
      
      // In development, allow the app to continue without Firebase Admin
      if (process.env.NODE_ENV === 'development') {
        console.warn('Firebase Admin failed to initialize, but continuing in development mode');
        return {
          auth: null,
          db: null,
        };
      }
      
      throw new Error(`Firebase configuration errors: ${configValidation.errors.join(', ')}`);
    }

    const { projectId, clientEmail, privateKey } = FIREBASE_CONFIG.admin;

    try {
      // Format the private key properly
      const formattedPrivateKey = formatPrivateKey(privateKey!);
      
      // Log configuration for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('Firebase Admin Project ID:', projectId);
        console.log('Firebase Client Project ID:', FIREBASE_CONFIG.client.projectId);
        console.log('Firebase configuration is valid');
      }

      initializeApp({
        credential: cert({
          projectId: projectId!,
          clientEmail: clientEmail!,
          privateKey: formattedPrivateKey,
        }),
      });
      
      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      
      // In development, allow the app to continue without Firebase Admin
      if (process.env.NODE_ENV === 'development') {
        console.warn('Firebase Admin failed to initialize, but continuing in development mode');
        return {
          auth: null,
          db: null,
        };
      }
      
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
