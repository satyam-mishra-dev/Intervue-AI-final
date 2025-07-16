const fs = require('fs');
const path = require('path');

console.log('🔧 Comprehensive Firebase Authentication Fix\n');

// Step 1: Fix private key format
function fixPrivateKey() {
  console.log('🔑 Step 1: Fixing Private Key Format...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('   ❌ .env.local file not found!');
    console.log('   📝 Please create a .env.local file first.');
    return false;
  }
  
  try {
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
      console.log('   ❌ FIREBASE_PRIVATE_KEY not found');
      return false;
    }
    
    // Fix private key format
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
      console.log('   ✅ Private key format: Standard (PEM)');
    } else if (formattedKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      console.log('   ✅ Private key format: RSA (converting to standard)');
      formattedKey = formattedKey.replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----');
      formattedKey = formattedKey.replace('-----END RSA PRIVATE KEY-----', '-----END PRIVATE KEY-----');
      issues.push('Converted RSA format to standard PEM');
    } else {
      console.log('   ❌ Private key format: Unknown/Invalid');
      return false;
    }
    
    // Validate structure
    if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----') || !formattedKey.includes('-----END PRIVATE KEY-----')) {
      console.log('   ❌ Private key is missing BEGIN or END markers');
      return false;
    }
    
    if (issues.length > 0) {
      console.log(`   🔧 Issues fixed: ${issues.join(', ')}`);
      
      // Create backup
      const backupPath = envPath + '.backup';
      fs.writeFileSync(backupPath, envContent);
      console.log(`   💾 Backup created: ${backupPath}`);
      
      // Update .env.local with fixed private key
      const newLines = lines.map(line => {
        if (line.startsWith('FIREBASE_PRIVATE_KEY=')) {
          const escapedKey = formattedKey.replace(/\n/g, '\\n');
          return `FIREBASE_PRIVATE_KEY="${escapedKey}"`;
        }
        return line;
      });
      
      const newContent = newLines.join('\n');
      fs.writeFileSync(envPath, newContent);
      
      console.log('   ✅ .env.local updated with properly formatted private key');
    } else {
      console.log('   ✅ Private key format is already correct!');
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error fixing private key: ${error.message}`);
    return false;
  }
}

// Step 2: Check project ID consistency
function checkProjectIds() {
  console.log('\n🔍 Step 2: Checking Project ID Consistency...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('   ❌ .env.local file not found!');
    return false;
  }
  
  try {
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
    
    const clientProjectId = envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
    const adminProjectId = envVars['FIREBASE_PROJECT_ID'];
    
    if (clientProjectId && adminProjectId) {
      if (clientProjectId === adminProjectId) {
        console.log(`   ✅ Project IDs match: ${clientProjectId}`);
        return true;
      } else {
        console.log(`   ❌ Project ID MISMATCH!`);
        console.log(`      Client: ${clientProjectId}`);
        console.log(`      Admin:  ${adminProjectId}`);
        console.log('   🔧 Fixing project ID mismatch...');
        
        // Update admin project ID to match client
        const newLines = lines.map(line => {
          if (line.startsWith('FIREBASE_PROJECT_ID=')) {
            return `FIREBASE_PROJECT_ID=${clientProjectId}`;
          }
          return line;
        });
        
        const newContent = newLines.join('\n');
        fs.writeFileSync(envPath, newContent);
        
        console.log(`   ✅ Updated FIREBASE_PROJECT_ID to: ${clientProjectId}`);
        return true;
      }
    } else if (clientProjectId) {
      console.log(`   ⚠️  Only client project ID set: ${clientProjectId}`);
      console.log('   🔧 Adding admin project ID...');
      
      const newContent = envContent + `\nFIREBASE_PROJECT_ID=${clientProjectId}`;
      fs.writeFileSync(envPath, newContent);
      
      console.log(`   ✅ Added FIREBASE_PROJECT_ID: ${clientProjectId}`);
      return true;
    } else {
      console.log('   ❌ No project IDs found!');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error checking project IDs: ${error.message}`);
    return false;
  }
}

// Step 3: Switch to new authentication system
function switchToNewAuth() {
  console.log('\n🔄 Step 3: Switching to New Authentication System...');
  
  const filesToSwitch = [
    {
      old: 'firebase/admin.ts',
      new: 'firebase/admin-new.ts',
      backup: 'firebase/admin.ts.backup'
    },
    {
      old: 'lib/actions/auth.action.ts',
      new: 'lib/actions/auth-new.action.ts',
      backup: 'lib/actions/auth.action.ts.backup'
    },
    {
      old: 'middleware.ts',
      new: 'middleware-new.ts',
      backup: 'middleware.ts.backup'
    }
  ];
  
  let successCount = 0;
  
  for (const fileConfig of filesToSwitch) {
    try {
      console.log(`   📁 Processing: ${fileConfig.old}`);
      
      if (!fs.existsSync(fileConfig.old)) {
        console.log(`      ⚠️  Old file not found: ${fileConfig.old}`);
        continue;
      }
      
      if (!fs.existsSync(fileConfig.new)) {
        console.log(`      ❌ New file not found: ${fileConfig.new}`);
        continue;
      }
      
      // Create backup
      fs.copyFileSync(fileConfig.old, fileConfig.backup);
      console.log(`      💾 Backup created: ${fileConfig.backup}`);
      
      // Replace old file with new file
      fs.copyFileSync(fileConfig.new, fileConfig.old);
      console.log(`      ✅ File replaced: ${fileConfig.old}`);
      
      successCount++;
    } catch (error) {
      console.log(`      ❌ Error processing ${fileConfig.old}: ${error.message}`);
    }
  }
  
  console.log(`   📊 Successfully switched: ${successCount}/${filesToSwitch.length} files`);
  return successCount === filesToSwitch.length;
}

// Main execution
console.log('🚀 Starting comprehensive authentication fix...\n');

const step1Success = fixPrivateKey();
const step2Success = checkProjectIds();
const step3Success = switchToNewAuth();

console.log('\n📊 Fix Results:');
console.log('===============');
console.log(`🔑 Private Key Fix: ${step1Success ? '✅' : '❌'}`);
console.log(`🔍 Project ID Check: ${step2Success ? '✅' : '❌'}`);
console.log(`🔄 Auth System Switch: ${step3Success ? '✅' : '❌'}`);

if (step1Success && step2Success && step3Success) {
  console.log('\n🎉 All fixes applied successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Test the authentication flow');
  console.log('3. Check the console for any errors');
  console.log('\n🔄 If you need to rollback, run: node scripts/rollback-auth.js');
} else {
  console.log('\n⚠️  Some fixes failed. Please check the errors above.');
  console.log('\n🔄 You can still try the individual fix scripts:');
  console.log('- node scripts/fix-private-key.js');
  console.log('- node scripts/debug-env.js');
  console.log('- node scripts/switch-to-new-auth.js');
}

console.log('\n✨ Comprehensive fix process complete!'); 