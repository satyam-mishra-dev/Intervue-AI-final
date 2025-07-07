#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables...\n');

const envContent = `# VAPI Configuration (REQUIRED for interview generation)
# Get these from https://vapi.ai
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token_here
NEXT_PUBLIC_VAPI_WORKFLOW_ID=your_vapi_workflow_id_here

# Google AI (for question generation)
# Get from https://makersuite.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key_here

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Firebase Configuration
# Get these from your Firebase project settings
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (for server-side operations)
# Get from Firebase project settings > Service accounts
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour private key here\\n-----END PRIVATE KEY-----"
`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Backing up to .env.local.backup');
    fs.copyFileSync(envPath, envPath + '.backup');
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
  console.log('\n📝 Next steps:');
  console.log('1. Edit .env.local and replace the placeholder values with your actual credentials');
  console.log('2. Get VAPI credentials from https://vapi.ai');
  console.log('3. Get Google AI key from https://makersuite.google.com/app/apikey');
  console.log('4. Get Firebase credentials from your Firebase project settings');
  console.log('5. Run "npm run dev" to start the development server');
  console.log('\n📖 See VAPI_SETUP_GUIDE.md for detailed instructions');
  
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
  process.exit(1);
} 