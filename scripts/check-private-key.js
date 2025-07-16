#!/usr/bin/env node

// Check and fix Firebase private key format
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Firebase Private Key Format...\n');

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

const privateKey = envVars['FIREBASE_PRIVATE_KEY'];

if (!privateKey) {
  console.error('❌ FIREBASE_PRIVATE_KEY not found in .env.local');
  process.exit(1);
}

console.log('📝 Current private key format:');
console.log('Length:', privateKey.length);
console.log('Contains newlines:', privateKey.includes('\\n'));
console.log('Contains quotes:', privateKey.includes('"') || privateKey.includes("'"));
console.log('Starts with:', privateKey.substring(0, 50) + '...');

// Check for common issues
let issues = [];

if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
  issues.push('❌ Missing "-----BEGIN PRIVATE KEY-----" header');
}

if (!privateKey.includes('-----END PRIVATE KEY-----')) {
  issues.push('❌ Missing "-----END PRIVATE KEY-----" footer');
}

if (!privateKey.includes('\\n')) {
  issues.push('❌ Missing newline characters (\\n)');
}

if (privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
  issues.push('⚠️  Using RSA format - this should work but standard format is preferred');
}

if (issues.length === 0) {
  console.log('\n✅ Private key format looks correct!');
} else {
  console.log('\n❌ Issues found:');
  issues.forEach(issue => console.log(issue));
  
  console.log('\n🔧 To fix the format, ensure your FIREBASE_PRIVATE_KEY looks like this:');
  console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n');
  console.log('MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCkw55QjhHcKxUGJ\\n');
  console.log('... (your actual key content) ...\\n');
  console.log('-----END PRIVATE KEY-----\\n"');
  
  console.log('\n💡 Key points:');
  console.log('- Use double quotes around the entire key');
  console.log('- Replace actual newlines with \\n');
  console.log('- Include the BEGIN and END markers');
  console.log('- Make sure there are no extra spaces or characters');
} 