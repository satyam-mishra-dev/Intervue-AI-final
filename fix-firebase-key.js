#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Firebase Private Key Fixer');
console.log('================================');

// Read the current private key from the temp file
const tempKeyPath = path.join(__dirname, 'temp_private_key.txt');
const envLocalPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(tempKeyPath)) {
  console.error('❌ temp_private_key.txt not found');
  process.exit(1);
}

try {
  const tempContent = fs.readFileSync(tempKeyPath, 'utf8');
  
  // Extract the private key value - handle multiline format
  const match = tempContent.match(/FIREBASE_PRIVATE_KEY="([\s\S]+?)"/);
  
  if (!match) {
    console.error('❌ Could not extract private key from temp file');
    console.log('File content:', tempContent);
    process.exit(1);
  }
  
  let privateKey = match[1];
  
  // Remove literal \n and replace with actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');
  
  console.log('✅ Private key extracted and formatted');
  
  // Read existing .env.local file
  let envContent = '';
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
  }
  
  // Replace or add the FIREBASE_PRIVATE_KEY
  const keyRegex = /FIREBASE_PRIVATE_KEY=.*?(?=\n|$)/g;
  
  if (keyRegex.test(envContent)) {
    // Replace existing key
    envContent = envContent.replace(keyRegex, `FIREBASE_PRIVATE_KEY="${privateKey}"`);
  } else {
    // Add new key
    envContent += `\nFIREBASE_PRIVATE_KEY="${privateKey}"\n`;
  }
  
  // Write back to .env.local
  fs.writeFileSync(envLocalPath, envContent);
  
  console.log('✅ Updated .env.local with properly formatted private key');
  console.log('🎯 You can now run: npm run build');
  
  // Clean up temp file
  fs.unlinkSync(tempKeyPath);
  console.log('🗑️  Removed temp_private_key.txt');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} 