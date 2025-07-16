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
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  }
};

// Validate Firebase configuration
export function validateFirebaseConfig() {
  const errors: string[] = [];
  
  // Check client config
  if (!FIREBASE_CONFIG.client.projectId) {
    errors.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing");
  }
  
  if (!FIREBASE_CONFIG.client.apiKey) {
    errors.push("NEXT_PUBLIC_FIREBASE_CLIENT_ID is missing");
  }
  
  if (!FIREBASE_CONFIG.client.authDomain) {
    errors.push("NEXT_PUBLIC_FIREBASE_CLIENT_DOMAIN is missing");
  }
  
  // Check admin config - either service account key or individual credentials
  const hasServiceAccount = !!FIREBASE_CONFIG.admin.serviceAccountKey;
  const hasIndividualCreds = !!(FIREBASE_CONFIG.admin.projectId && 
                               FIREBASE_CONFIG.admin.clientEmail && 
                               FIREBASE_CONFIG.admin.privateKey);
  
  if (!hasServiceAccount && !hasIndividualCreds) {
    errors.push("Either FIREBASE_SERVICE_ACCOUNT_KEY or individual credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are required");
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
    projectId: FIREBASE_CONFIG.client.projectId || FIREBASE_CONFIG.admin.projectId,
    hasServiceAccount,
    hasIndividualCreds
  };
}

// Format private key properly
export function formatPrivateKey(privateKey: string): string {
  if (!privateKey) {
    throw new Error('Private key is required');
  }
  
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

// Get environment setup instructions
export function getEnvironmentSetupInstructions(): string {
  return `
## Firebase Environment Setup

### Required Environment Variables:

#### Client-side (NEXT_PUBLIC_*):
- NEXT_PUBLIC_FIREBASE_CLIENT_ID
- NEXT_PUBLIC_FIREBASE_CLIENT_DOMAIN  
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

#### Server-side (Admin):
Choose ONE of these options:

**Option 1: Service Account JSON (Recommended)**
- FIREBASE_SERVICE_ACCOUNT_KEY (base64 encoded JSON)

**Option 2: Individual Credentials**
- FIREBASE_PROJECT_ID (should match NEXT_PUBLIC_FIREBASE_PROJECT_ID)
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY (with proper formatting)

### Example .env.local:
\`\`\`env
# Client Configuration
NEXT_PUBLIC_FIREBASE_CLIENT_ID=your_api_key
NEXT_PUBLIC_FIREBASE_CLIENT_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Admin Configuration (Option 1: Service Account)
FIREBASE_SERVICE_ACCOUNT_KEY=base64_encoded_service_account_json

# OR Admin Configuration (Option 2: Individual Credentials)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour private key here\\n-----END PRIVATE KEY-----"
\`\`\`
`;
} 