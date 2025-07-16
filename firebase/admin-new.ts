import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Enhanced service account parser with multiple fallback strategies
function getServiceAccountCredentials() {
  console.log('🔍 Initializing Firebase Admin with enhanced credential detection...');
  
  // Strategy 1: Try service account JSON string (base64 or direct)
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 
                              process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  if (serviceAccountString) {
    try {
      console.log('📋 Attempting to parse service account JSON string...');
      let serviceAccount;
      
      // Check if it's base64 encoded
      if (serviceAccountString.startsWith('{')) {
        serviceAccount = JSON.parse(serviceAccountString);
      } else {
        // Try base64 decode
        const decoded = Buffer.from(serviceAccountString, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decoded);
      }
      
      // Validate and format
      if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
        serviceAccount.private_key = formatPrivateKey(serviceAccount.private_key);
        console.log(`✅ Service account loaded from JSON string for project: ${serviceAccount.project_id}`);
        return serviceAccount;
      }
    } catch (error) {
      console.log('⚠️ Service account JSON parsing failed, trying individual credentials...');
    }
  }
  
  // Strategy 2: Try individual credentials
  const projectId = process.env.FIREBASE_PROJECT_ID || 
                   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (projectId && clientEmail && privateKey) {
    console.log('🔑 Using individual credentials...');
    try {
      const formattedKey = formatPrivateKey(privateKey);
      const serviceAccount = {
        project_id: projectId,
        client_email: clientEmail,
        private_key: formattedKey
      };
      console.log(`✅ Individual credentials loaded for project: ${projectId}`);
      return serviceAccount;
    } catch (error) {
      console.log('⚠️ Individual credentials failed, trying application default...');
    }
  }
  
  // Strategy 3: Try application default credentials (for production)
  if (process.env.NODE_ENV === 'production') {
    console.log('🌐 Attempting to use application default credentials...');
    try {
      // This will work if GOOGLE_APPLICATION_CREDENTIALS is set or running on GCP
      return null; // Will use applicationDefault() instead
    } catch (error) {
      console.log('⚠️ Application default credentials not available');
    }
  }
  
  throw new Error('No valid Firebase service account credentials found. Please check your environment variables.');
}

// Enhanced private key formatter with multiple format support
function formatPrivateKey(privateKey: string): string {
  if (!privateKey) {
    throw new Error('Private key is required');
  }
  
  console.log('🔧 Formatting private key...');
  
  // Remove surrounding quotes
  let formatted = privateKey.replace(/^["']|["']$/g, '');
  
  // Handle different encoding formats
  if (!formatted.includes('-----BEGIN')) {
    // Try base64 decode
    try {
      const decoded = Buffer.from(formatted, 'base64').toString('utf-8');
      if (decoded.includes('-----BEGIN')) {
        console.log('📝 Detected base64 encoded private key, decoding...');
        formatted = decoded;
      }
    } catch (e) {
      console.log('⚠️ Could not decode as base64, treating as raw key');
    }
  }
  
  // Replace literal \n with actual newlines
  formatted = formatted.replace(/\\n/g, '\n');
  
  // Handle different key formats
  if (formatted.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('✅ Private key format: Standard PEM');
  } else if (formatted.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    console.log('✅ Private key format: RSA (converting to standard)');
    formatted = formatted.replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----');
    formatted = formatted.replace('-----END RSA PRIVATE KEY-----', '-----END PRIVATE KEY-----');
  } else {
    throw new Error('Invalid private key format. Must start with -----BEGIN PRIVATE KEY----- or -----BEGIN RSA PRIVATE KEY-----');
  }
  
  // Ensure proper line breaks
  if (!formatted.includes('\n-----BEGIN PRIVATE KEY-----')) {
    formatted = formatted.replace('-----BEGIN PRIVATE KEY-----', '\n-----BEGIN PRIVATE KEY-----');
  }
  if (!formatted.includes('-----END PRIVATE KEY-----\n')) {
    formatted = formatted.replace('-----END PRIVATE KEY-----', '-----END PRIVATE KEY-----\n');
  }
  
  // Validate structure
  if (!formatted.includes('-----BEGIN PRIVATE KEY-----') || !formatted.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Private key is missing BEGIN or END markers');
  }
  
  console.log(`✅ Private key formatted successfully (${formatted.split('\n').length} lines)`);
  return formatted;
}

// Initialize Firebase Admin with enhanced error handling
let adminApp;
try {
  if (!getApps().length) {
    const serviceAccount = getServiceAccountCredentials();
    
    if (serviceAccount) {
      // Use service account credentials
      console.log('🚀 Initializing Firebase Admin with service account...');
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log(`✅ Firebase Admin initialized successfully with project: ${serviceAccount.project_id}`);
    } else {
      // Use application default credentials
      console.log('🚀 Initializing Firebase Admin with application default credentials...');
      adminApp = initializeApp({
        credential: applicationDefault(),
      });
      console.log('✅ Firebase Admin initialized with application default credentials');
    }
  } else {
    adminApp = getApps()[0];
    console.log('✅ Firebase Admin already initialized');
  }
} catch (error: any) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  
  // Provide detailed error guidance
  if (error.message?.includes('DECODER routines')) {
    console.error('\n🔧 PRIVATE KEY FORMAT ERROR DETECTED');
    console.error('=====================================');
    console.error('Your FIREBASE_PRIVATE_KEY is not in the correct format.');
    console.error('');
    console.error('📝 Solutions:');
    console.error('1. Run: node scripts/fix-private-key.js');
    console.error('2. Check your .env.local file');
    console.error('3. Ensure private key starts with -----BEGIN PRIVATE KEY-----');
    console.error('4. Make sure newlines are properly formatted (use \\n)');
    console.error('');
    console.error('📋 Example format:');
    console.error('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSj...\\n-----END PRIVATE KEY-----"');
  }
  
  if (error.message?.includes('project_id')) {
    console.error('\n🔧 PROJECT ID ERROR DETECTED');
    console.error('===========================');
    console.error('Make sure FIREBASE_PROJECT_ID matches your Firebase project.');
    console.error('Current project ID from logs: intervue-7cf6d');
  }
  
  if (error.message?.includes('No valid Firebase service account')) {
    console.error('\n🔧 MISSING CREDENTIALS ERROR');
    console.error('============================');
    console.error('No Firebase credentials found. Please set one of:');
    console.error('- FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)');
    console.error('- FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY');
    console.error('- GOOGLE_APPLICATION_CREDENTIALS (file path)');
  }
  
  throw error;
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export { adminApp };

// For backward compatibility
export const db = adminDb; 