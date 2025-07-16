import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Function to safely parse service account credentials
function getServiceAccount() {
  // Try multiple environment variable formats for flexibility
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 
                              process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  const projectId = process.env.FIREBASE_PROJECT_ID || 
                   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // If we have individual credentials, use them
  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: formatPrivateKey(privateKey)
    };
  }

  // If we have service account JSON string
  if (serviceAccountString) {
    try {
      let serviceAccount;
      
      // Check if it's base64 encoded
      if (serviceAccountString.startsWith('{')) {
        // Direct JSON string
        serviceAccount = JSON.parse(serviceAccountString);
      } else {
        // Base64 encoded JSON
        const decoded = Buffer.from(serviceAccountString, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decoded);
      }

      // Validate required fields
      const requiredFields = ['project_id', 'private_key', 'client_email'];
      for (const field of requiredFields) {
        if (!serviceAccount[field]) {
          throw new Error(`Service account is missing required field: ${field}`);
        }
      }

      // Format private key
      serviceAccount.private_key = formatPrivateKey(serviceAccount.private_key);
      
      return serviceAccount;
    } catch (error) {
      console.error('Error parsing service account:', error);
      throw new Error('Invalid service account format');
    }
  }

  throw new Error('No Firebase service account credentials found. Please set FIREBASE_SERVICE_ACCOUNT_KEY or individual credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
}

// Format private key properly
function formatPrivateKey(privateKey: string): string {
  if (!privateKey) {
    throw new Error('Private key is required');
  }
  
  // Remove quotes if present
  let formatted = privateKey.replace(/^["']|["']$/g, '');
  
  // Replace literal \n with actual newlines
  formatted = formatted.replace(/\\n/g, '\n');
  
  // Handle different private key formats
  if (formatted.includes('-----BEGIN PRIVATE KEY-----')) {
    // Standard format - ensure proper line breaks
    if (!formatted.includes('\n-----BEGIN PRIVATE KEY-----')) {
      formatted = formatted.replace('-----BEGIN PRIVATE KEY-----', '\n-----BEGIN PRIVATE KEY-----');
    }
    if (!formatted.includes('-----END PRIVATE KEY-----\n')) {
      formatted = formatted.replace('-----END PRIVATE KEY-----', '-----END PRIVATE KEY-----\n');
    }
  } else if (formatted.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    // RSA format - convert to standard format
    formatted = formatted.replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----');
    formatted = formatted.replace('-----END RSA PRIVATE KEY-----', '-----END PRIVATE KEY-----');
  } else {
    throw new Error('Invalid Firebase private key format - must start with -----BEGIN PRIVATE KEY----- or -----BEGIN RSA PRIVATE KEY-----');
  }
  
  return formatted;
}

// Initialize Firebase Admin
let adminApp;
try {
  if (!getApps().length) {
    const serviceAccount = getServiceAccount();
    
    // Validate service account before initializing
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('Invalid service account: missing required fields');
    }
    
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    
    console.log('Firebase Admin initialized successfully with project:', serviceAccount.project_id);
  } else {
    adminApp = getApps()[0];
    console.log('Firebase Admin already initialized');
  }
} catch (error: any) {
  console.error('Firebase Admin initialization error:', error);
  
  // Provide more helpful error messages
  if (error.message?.includes('DECODER routines')) {
    console.error('Private key format error. Please check your FIREBASE_PRIVATE_KEY format.');
    console.error('The private key should be properly formatted with newlines and quotes.');
  }
  
  throw error;
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export { adminApp };

// For backward compatibility
export const db = adminDb;
