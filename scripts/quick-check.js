const fs = require('fs');
const path = require('path');

console.log('🔍 Quick Firebase Environment Check\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('📝 Please create a .env.local file in your project root.');
  process.exit(1);
}

// Read and parse .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
const envVars = {};

lines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').trim();
    if (value && !key.startsWith('#')) {
      envVars[key.trim()] = value;
    }
  }
});

console.log('📋 Current Configuration:');
console.log('========================');

// Check client variables
console.log('\n🔧 Client Variables:');
const clientVars = [
  'NEXT_PUBLIC_FIREBASE_CLIENT_ID',
  'NEXT_PUBLIC_FIREBASE_CLIENT_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

let clientIssues = 0;
clientVars.forEach(varName => {
  const value = envVars[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${value.substring(0, 50)}...`);
  } else {
    console.log(`   ❌ ${varName}: NOT SET`);
    clientIssues++;
  }
});

// Check admin variables
console.log('\n🔐 Admin Variables:');
const adminVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_SERVICE_ACCOUNT_KEY'
];

let adminIssues = 0;
adminVars.forEach(varName => {
  const value = envVars[varName];
  if (value) {
    if (varName === 'FIREBASE_PRIVATE_KEY') {
      console.log(`   ✅ ${varName}: ${value.substring(0, 50)}... (${value.length} chars)`);
      
      // Quick private key format check
      if (!value.includes('-----BEGIN')) {
        console.log(`   ⚠️  ${varName}: May need formatting (missing BEGIN marker)`);
        adminIssues++;
      }
    } else {
      console.log(`   ✅ ${varName}: ${value.substring(0, 100)}...`);
    }
  } else {
    console.log(`   ❌ ${varName}: NOT SET`);
    adminIssues++;
  }
});

// Check project ID consistency
console.log('\n🔍 Project ID Analysis:');
const clientProjectId = envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
const adminProjectId = envVars['FIREBASE_PROJECT_ID'];

if (clientProjectId && adminProjectId) {
  if (clientProjectId === adminProjectId) {
    console.log(`   ✅ Project IDs match: ${clientProjectId}`);
  } else {
    console.log(`   ❌ Project ID MISMATCH!`);
    console.log(`      Client: ${clientProjectId}`);
    console.log(`      Admin:  ${adminProjectId}`);
    console.log('   ⚠️  This will cause authentication errors!');
  }
} else if (clientProjectId) {
  console.log(`   ⚠️  Only client project ID set: ${clientProjectId}`);
  console.log('   🔧 Admin will use client project ID as fallback');
} else if (adminProjectId) {
  console.log(`   ⚠️  Only admin project ID set: ${adminProjectId}`);
  console.log('   ❌ Client project ID is missing!');
} else {
  console.log('   ❌ No project IDs found!');
}

// Summary
console.log('\n📊 Summary:');
console.log('============');
console.log(`Client issues: ${clientIssues}`);
console.log(`Admin issues: ${adminIssues}`);

if (clientIssues === 0 && adminIssues === 0) {
  console.log('\n🎉 Configuration looks good!');
  console.log('🚀 Try restarting your server and testing authentication.');
} else {
  console.log('\n⚠️  Issues found. Please fix them before testing.');
  console.log('\n🔧 Quick fixes:');
  if (adminIssues > 0) {
    console.log('- Check your FIREBASE_PRIVATE_KEY format');
    console.log('- Ensure FIREBASE_PROJECT_ID matches your client project');
  }
  if (clientIssues > 0) {
    console.log('- Add missing NEXT_PUBLIC_* variables');
  }
}

console.log('\n✨ Quick check complete!'); 