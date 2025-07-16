const fs = require('fs');
const path = require('path');

console.log('🔧 Firebase Private Key Format Fixer\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('📝 Create a .env.local file in your project root first.');
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

const privateKey = envVars['FIREBASE_PRIVATE_KEY'];

if (!privateKey) {
  console.error('❌ FIREBASE_PRIVATE_KEY not found in .env.local');
  console.log('📝 Please add your Firebase service account private key to .env.local');
  process.exit(1);
}

console.log('🔍 Analyzing private key format...\n');

// Check current format
let issues = [];
let formattedKey = privateKey;

// Remove quotes if present
if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
  formattedKey = formattedKey.slice(1, -1);
  issues.push('Removed surrounding quotes');
}

// Replace literal \n with actual newlines
if (formattedKey.includes('\\n')) {
  formattedKey = formattedKey.replace(/\\n/g, '\n');
  issues.push('Converted \\n to actual newlines');
}

// Check if it's base64 encoded
if (!formattedKey.includes('-----BEGIN')) {
  try {
    const decoded = Buffer.from(formattedKey, 'base64').toString('utf-8');
    if (decoded.includes('-----BEGIN')) {
      formattedKey = decoded;
      issues.push('Decoded base64 encoded private key');
    }
  } catch (e) {
    issues.push('Could not decode as base64');
  }
}

// Check format
if (formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
  console.log('✅ Private key format: Standard (PEM)');
} else if (formattedKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
  console.log('✅ Private key format: RSA (will be converted)');
  formattedKey = formattedKey.replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----');
  formattedKey = formattedKey.replace('-----END RSA PRIVATE KEY-----', '-----END PRIVATE KEY-----');
  issues.push('Converted RSA format to standard PEM');
} else {
  console.log('❌ Private key format: Unknown/Invalid');
  console.log('   Should start with -----BEGIN PRIVATE KEY----- or -----BEGIN RSA PRIVATE KEY-----');
  process.exit(1);
}

// Validate structure
if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----') || !formattedKey.includes('-----END PRIVATE KEY-----')) {
  console.log('❌ Private key is missing BEGIN or END markers');
  process.exit(1);
}

// Check for proper line breaks
const lines2 = formattedKey.split('\n');
if (lines2.length < 3) {
  console.log('❌ Private key appears to be missing proper line breaks');
  process.exit(1);
}

console.log(`✅ Private key structure: Valid (${lines2.length} lines)`);

if (issues.length > 0) {
  console.log('\n🔧 Issues found and fixed:');
  issues.forEach(issue => console.log(`   - ${issue}`));
  
  // Create backup
  const backupPath = envPath + '.backup';
  fs.writeFileSync(backupPath, envContent);
  console.log(`\n💾 Backup created: ${backupPath}`);
  
  // Update .env.local with fixed private key
  const newLines = lines.map(line => {
    if (line.startsWith('FIREBASE_PRIVATE_KEY=')) {
      // Escape the key properly for .env format
      const escapedKey = formattedKey.replace(/\n/g, '\\n');
      return `FIREBASE_PRIVATE_KEY="${escapedKey}"`;
    }
    return line;
  });
  
  const newContent = newLines.join('\n');
  fs.writeFileSync(envPath, newContent);
  
  console.log('✅ .env.local updated with properly formatted private key');
  console.log('\n🔄 Please restart your development server to apply changes');
} else {
  console.log('\n✅ Private key format is already correct!');
}

console.log('\n📝 Next steps:');
console.log('1. Restart your development server');
console.log('2. Test Firebase authentication');
console.log('3. If issues persist, check your Firebase project ID matches');

console.log('\n✨ Fix complete!'); 