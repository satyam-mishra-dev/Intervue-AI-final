// Centralized Firebase configuration
export const FIREBASE_CONFIG = {
  // Client-side config (for browser)
  client: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_ID,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  
  // Admin-side config (for server)
  admin: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }
};

// Validate Firebase configuration
export function validateFirebaseConfig() {
  const errors: string[] = [];
  
  // Check client config
  if (!FIREBASE_CONFIG.client.projectId) {
    errors.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing");
  }
  
  // Check admin config
  if (!FIREBASE_CONFIG.admin.projectId) {
    errors.push("FIREBASE_PROJECT_ID is missing");
  }
  
  if (!FIREBASE_CONFIG.admin.clientEmail) {
    errors.push("FIREBASE_CLIENT_EMAIL is missing");
  }
  
  if (!FIREBASE_CONFIG.admin.privateKey) {
    errors.push("FIREBASE_PRIVATE_KEY is missing");
  }
  
  // Check project ID consistency
  if (FIREBASE_CONFIG.client.projectId && FIREBASE_CONFIG.admin.projectId) {
    if (FIREBASE_CONFIG.client.projectId !== FIREBASE_CONFIG.admin.projectId) {
      errors.push(`Project ID mismatch: Client=${FIREBASE_CONFIG.client.projectId}, Admin=${FIREBASE_CONFIG.admin.projectId}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    projectId: FIREBASE_CONFIG.client.projectId || FIREBASE_CONFIG.admin.projectId
  };
}

// Format private key properly
export function formatPrivateKey(privateKey: string): string {
  if (!privateKey) return "";
  
  // Remove quotes if present
  let formatted = privateKey.replace(/^["']|["']$/g, '');
  
  // Replace literal \n with actual newlines
  formatted = formatted.replace(/\\n/g, '\n');
  
  // Ensure proper formatting
  if (!formatted.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid Firebase private key format - must start with -----BEGIN PRIVATE KEY-----');
  }
  
  return formatted;
} 