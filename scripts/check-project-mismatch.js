#!/usr/bin/env node

// Check for Firebase project ID mismatches
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for Firebase Project ID Mismatches...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  process.exit(1);
}

// Read and parse .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Get project IDs
const clientProjectId = envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
const adminProjectId = envVars['FIREBASE_PROJECT_ID'];

console.log('📱 Client Project ID:', clientProjectId || '❌ NOT SET');
console.log('🔐 Admin Project ID:', adminProjectId || '❌ NOT SET');

if (!clientProjectId || !adminProjectId) {
  console.log('\n❌ One or both project IDs are missing!');
  console.log('Please ensure both are set in your .env.local file.');
  process.exit(1);
}

if (clientProjectId === adminProjectId) {
  console.log('\n✅ Project IDs match!');
  console.log('This should resolve the audience claim errors.');
} else {
  console.log('\n❌ PROJECT ID MISMATCH DETECTED!');
  console.log(`Client: ${clientProjectId}`);
  console.log(`Admin:  ${adminProjectId}`);
  console.log('\n🔧 To fix this:');
  console.log('1. Go to Firebase Console');
  console.log('2. Make sure you\'re using the same project for both client and admin');
  console.log('3. Update your .env.local file to use the same project ID for both');
  console.log('\nExample:');
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id');
  console.log('FIREBASE_PROJECT_ID=your-project-id');
  
  process.exit(1);
}

// Check if service account is from the same project
const serviceAccountKey = envVars['FIREBASE_SERVICE_ACCOUNT_KEY'];
if (serviceAccountKey) {
  try {
    const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(decoded);
    
    if (serviceAccount.project_id && serviceAccount.project_id !== clientProjectId) {
      console.log('\n⚠️  Service Account Project ID Mismatch!');
      console.log(`Service Account: ${serviceAccount.project_id}`);
      console.log(`Client: ${clientProjectId}`);
      console.log('\nYou need to generate a new service account key from the correct project.');
    } else {
      console.log('\n✅ Service Account Project ID matches!');
    }
  } catch (error) {
    console.log('\n⚠️  Could not decode service account key. Make sure it\'s base64 encoded.');
  }
} 