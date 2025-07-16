#!/usr/bin/env node

// Firebase Configuration Validator
// Run with: node scripts/validate-firebase.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Firebase Configuration...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('📝 Create a .env.local file in your project root with your Firebase configuration.');
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

// Required client variables
const requiredClientVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

// Check client variables
console.log('📱 Client Configuration:');
let clientErrors = 0;
requiredClientVars.forEach(varName => {
  const value = envVars[varName];
  if (!value || value === 'your_actual_api_key' || value.includes('your_')) {
    console.error(`❌ ${varName}: Missing or placeholder value`);
    clientErrors++;
  } else {
    console.log(`✅ ${varName}: Set`);
  }
});

// Check admin configuration
console.log('\n🔐 Admin Configuration:');
const hasServiceAccount = envVars['FIREBASE_SERVICE_ACCOUNT_KEY'];
const hasIndividualCreds = envVars['FIREBASE_PROJECT_ID'] && 
                          envVars['FIREBASE_CLIENT_EMAIL'] && 
                          envVars['FIREBASE_PRIVATE_KEY'];

if (hasServiceAccount) {
  console.log('✅ FIREBASE_SERVICE_ACCOUNT_KEY: Set (Service Account JSON)');
} else if (hasIndividualCreds) {
  console.log('✅ Individual credentials: Set');
  
  // Check project ID consistency
  const clientProjectId = envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
  const adminProjectId = envVars['FIREBASE_PROJECT_ID'];
  
  if (clientProjectId && adminProjectId && clientProjectId !== adminProjectId) {
    console.error(`❌ Project ID mismatch: Client=${clientProjectId}, Admin=${adminProjectId}`);
    clientErrors++;
  } else {
    console.log('✅ Project IDs match');
  }
} else {
  console.error('❌ No admin configuration found');
  console.log('   Either set FIREBASE_SERVICE_ACCOUNT_KEY or individual credentials');
  clientErrors++;
}

// Summary
console.log('\n📊 Summary:');
if (clientErrors === 0) {
  console.log('✅ Firebase configuration looks good!');
  console.log('🚀 You can now start your development server with: npm run dev');
} else {
  console.log(`❌ Found ${clientErrors} configuration issue(s)`);
  console.log('📖 See FIREBASE_AUTH_FIX.md for detailed setup instructions');
  process.exit(1);
}

console.log('\n💡 Tips:');
console.log('- Make sure your Firebase project has Authentication enabled');
console.log('- Ensure Email/Password sign-in method is enabled');
console.log('- Check that your service account has the necessary permissions'); 