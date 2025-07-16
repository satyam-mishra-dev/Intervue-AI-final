const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Firebase Environment Variables...\n');

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
    const value = valueParts.join('=').trim();
    if (value && !key.startsWith('#')) {
      envVars[key.trim()] = value;
    }
  }
});

console.log('📋 Current Firebase Configuration:');
console.log('=====================================');

// Client variables
console.log('\n🔧 Client Variables:');
const clientVars = [
  'NEXT_PUBLIC_FIREBASE_CLIENT_ID',
  'NEXT_PUBLIC_FIREBASE_CLIENT_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

clientVars.forEach(varName => {
  const value = envVars[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

// Admin variables
console.log('\n🔐 Admin Variables:');
const adminVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_SERVICE_ACCOUNT_KEY'
];

adminVars.forEach(varName => {
  const value = envVars[varName];
  if (value) {
    if (varName === 'FIREBASE_PRIVATE_KEY') {
      const preview = value.substring(0, 50) + '...';
      console.log(`✅ ${varName}: ${preview}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

// Check for project ID mismatch
const clientProjectId = envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
const adminProjectId = envVars['FIREBASE_PROJECT_ID'];

console.log('\n🔍 Project ID Analysis:');
console.log('=======================');

if (clientProjectId && adminProjectId) {
  if (clientProjectId === adminProjectId) {
    console.log(`✅ Project IDs match: ${clientProjectId}`);
  } else {
    console.log(`❌ Project ID MISMATCH!`);
    console.log(`   Client: ${clientProjectId}`);
    console.log(`   Admin:  ${adminProjectId}`);
    console.log('\n⚠️  This will cause authentication errors!');
  }
} else if (clientProjectId) {
  console.log(`⚠️  Only client project ID set: ${clientProjectId}`);
  console.log('   Admin will use client project ID as fallback');
} else if (adminProjectId) {
  console.log(`⚠️  Only admin project ID set: ${adminProjectId}`);
  console.log('   Client project ID is missing!');
} else {
  console.log('❌ No project IDs found!');
}

// Check private key format
const privateKey = envVars['FIREBASE_PRIVATE_KEY'];
if (privateKey) {
  console.log('\n🔑 Private Key Analysis:');
  console.log('========================');
  
  if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('✅ Private key format: Standard (PEM)');
  } else if (privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    console.log('✅ Private key format: RSA (will be converted)');
  } else {
    console.log('❌ Private key format: Unknown/Invalid');
    console.log('   Should start with -----BEGIN PRIVATE KEY----- or -----BEGIN RSA PRIVATE KEY-----');
  }
  
  if (privateKey.includes('\\n')) {
    console.log('⚠️  Private key contains literal \\n - will be converted to newlines');
  }
  
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    console.log('⚠️  Private key is wrapped in quotes - will be removed');
  }
}

console.log('\n📝 Recommendations:');
console.log('===================');

if (!clientProjectId || !adminProjectId || clientProjectId !== adminProjectId) {
  console.log('1. Ensure both NEXT_PUBLIC_FIREBASE_PROJECT_ID and FIREBASE_PROJECT_ID are set to the same value');
}

if (!privateKey) {
  console.log('2. Set FIREBASE_PRIVATE_KEY with your Firebase service account private key');
}

if (privateKey && !privateKey.includes('-----BEGIN')) {
  console.log('3. Check your FIREBASE_PRIVATE_KEY format - it should start with -----BEGIN PRIVATE KEY-----');
}

console.log('\n✨ Debug complete!'); 