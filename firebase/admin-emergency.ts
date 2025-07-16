import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Emergency credential resolver - handles ANY format
function getEmergencyCredentials() {
  console.log('🚨 EMERGENCY: Attempting to resolve Firebase credentials...');
  
  // Get all possible environment variables
  const envVars = {
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    googleAppCreds: process.env.GOOGLE_APPLICATION_CREDENTIALS
  };
  
  console.log('📋 Environment variables found:');
  Object.entries(envVars).forEach(([key, value]) => {
    if (value) {
      if (key === 'privateKey') {
        console.log(`   ${key}: ${value.substring(0, 50)}... (${value.length} chars)`);
      } else {
        console.log(`   ${key}: ${value.substring(0, 100)}...`);
      }
    } else {
      console.log(`   ${key}: NOT SET`);
    }
  });
  
  // Strategy 1: Try service account JSON
  if (envVars.serviceAccountKey || envVars.googleCredentials) {
    const jsonString = envVars.serviceAccountKey || envVars.googleCredentials;
    console.log('🔍 Strategy 1: Parsing service account JSON...');
    
    try {
      let serviceAccount;
      
      if (jsonString && jsonString.startsWith('{')) {
        serviceAccount = JSON.parse(jsonString);
      } else if (jsonString) {
        // Try base64 decode
        const decoded = Buffer.from(jsonString, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decoded);
      }
      
      if (serviceAccount && serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
        console.log(`✅ Strategy 1 SUCCESS: Service account loaded for project ${serviceAccount.project_id}`);
        return { type: 'serviceAccount', data: serviceAccount };
      }
    } catch (error: any) {
      console.log(`❌ Strategy 1 FAILED: ${error.message}`);
    }
  }
  
  // Strategy 2: Try individual credentials
  if (envVars.projectId && envVars.clientEmail && envVars.privateKey) {
    console.log('🔍 Strategy 2: Using individual credentials...');
    
    try {
      const formattedKey = emergencyFormatPrivateKey(envVars.privateKey);
      const serviceAccount = {
        project_id: envVars.projectId,
        client_email: envVars.clientEmail,
        private_key: formattedKey
      };
      
      console.log(`✅ Strategy 2 SUCCESS: Individual credentials loaded for project ${envVars.projectId}`);
      return { type: 'individual', data: serviceAccount };
    } catch (error: any) {
      console.log(`❌ Strategy 2 FAILED: ${error.message}`);
    }
  }
  
  // Strategy 3: Try application default (for production)
  if (process.env.NODE_ENV === 'production') {
    console.log('🔍 Strategy 3: Trying application default credentials...');
    try {
      return { type: 'applicationDefault', data: null };
    } catch (error: any) {
      console.log(`❌ Strategy 3 FAILED: ${error.message}`);
    }
  }
  
  throw new Error('EMERGENCY: No valid Firebase credentials found! Please check your environment variables.');
}

// Emergency private key formatter - handles ANY format
function emergencyFormatPrivateKey(privateKey: string): string {
  console.log('🔧 EMERGENCY: Formatting private key...');
  console.log(`   Original length: ${privateKey.length}`);
  console.log(`   Contains quotes: ${privateKey.includes('"')}`);
  console.log(`   Contains \\n: ${privateKey.includes('\\n')}`);
  console.log(`   Contains BEGIN: ${privateKey.includes('-----BEGIN')}`);
  
  let formatted = privateKey;
  
  // Remove ALL possible quote variations
  formatted = formatted.replace(/^["']+|["']+$/g, '');
  
  // Handle base64 encoding
  if (!formatted.includes('-----BEGIN')) {
    console.log('   🔍 Attempting base64 decode...');
    try {
      const decoded = Buffer.from(formatted, 'base64').toString('utf-8');
      if (decoded.includes('-----BEGIN')) {
        formatted = decoded;
        console.log('   ✅ Base64 decode successful');
      }
    } catch (e) {
      console.log('   ❌ Base64 decode failed');
    }
  }
  
  // Replace ALL possible newline variations
  formatted = formatted.replace(/\\n/g, '\n');
  formatted = formatted.replace(/\\r\\n/g, '\n');
  formatted = formatted.replace(/\\r/g, '\n');
  
  // Handle different key formats
  if (formatted.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('   ✅ Format: Standard PEM');
  } else if (formatted.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    console.log('   ✅ Format: RSA (converting)');
    formatted = formatted.replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----');
    formatted = formatted.replace('-----END RSA PRIVATE KEY-----', '-----END PRIVATE KEY-----');
  } else {
    console.log('   ❌ Unknown format, attempting to add headers...');
    // Try to add headers if missing
    if (!formatted.includes('-----BEGIN')) {
      formatted = '-----BEGIN PRIVATE KEY-----\n' + formatted;
    }
    if (!formatted.includes('-----END')) {
      formatted = formatted + '\n-----END PRIVATE KEY-----';
    }
  }
  
  // Ensure proper line breaks
  if (!formatted.includes('\n-----BEGIN PRIVATE KEY-----')) {
    formatted = formatted.replace('-----BEGIN PRIVATE KEY-----', '\n-----BEGIN PRIVATE KEY-----');
  }
  if (!formatted.includes('-----END PRIVATE KEY-----\n')) {
    formatted = formatted.replace('-----END PRIVATE KEY-----', '-----END PRIVATE KEY-----\n');
  }
  
  // Final validation
  if (!formatted.includes('-----BEGIN PRIVATE KEY-----') || !formatted.includes('-----END PRIVATE KEY-----')) {
    throw new Error('EMERGENCY: Private key formatting failed - missing BEGIN/END markers');
  }
  
  console.log(`   ✅ Final length: ${formatted.length} chars`);
  console.log(`   ✅ Line count: ${formatted.split('\n').length}`);
  
  return formatted;
}

// Emergency Firebase Admin initialization
let adminApp;
try {
  if (!getApps().length) {
    console.log('🚨 EMERGENCY: Initializing Firebase Admin...');
    
    const credentials = getEmergencyCredentials();
    
    if (credentials.type === 'applicationDefault') {
      console.log('🚀 Using application default credentials...');
      adminApp = initializeApp({
        credential: applicationDefault(),
      });
    } else {
      console.log(`🚀 Using ${credentials.type} credentials...`);
      adminApp = initializeApp({
        credential: cert(credentials.data),
        projectId: credentials.data.project_id,
      });
    }
    
    console.log('✅ EMERGENCY: Firebase Admin initialized successfully!');
  } else {
    adminApp = getApps()[0];
    console.log('✅ EMERGENCY: Firebase Admin already initialized');
  }
} catch (error: any) {
  console.error('🚨 EMERGENCY: Firebase Admin initialization FAILED!');
  console.error('==================================================');
  console.error('Error:', error.message);
  console.error('');
  console.error('🔧 EMERGENCY SOLUTIONS:');
  console.error('1. Check your .env.local file exists');
  console.error('2. Ensure FIREBASE_PRIVATE_KEY is set correctly');
  console.error('3. Verify project ID matches between client and admin');
  console.error('4. Try generating a new service account key from Firebase Console');
  console.error('');
  console.error('📝 EMERGENCY DEBUGGING:');
  console.error('- Run: node scripts/debug-env.js');
  console.error('- Check Firebase Console for correct project ID');
  console.error('- Verify service account has proper permissions');
  console.error('');
  
  // Don't throw - let the app continue with limited functionality
  console.error('⚠️ Continuing without Firebase Admin (some features may not work)');
}

export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export { adminApp };

// For backward compatibility
export const db = adminDb; 