const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY FIREBASE FIX - CREDENTIAL DECODING ERROR\n');

// Emergency file replacement
function emergencyReplace() {
  try {
    console.log('🔧 Step 1: Creating emergency backup...');
    
    // Backup current admin file
    if (fs.existsSync('firebase/admin.ts')) {
      fs.copyFileSync('firebase/admin.ts', 'firebase/admin.ts.emergency-backup');
      console.log('✅ Backup created: firebase/admin.ts.emergency-backup');
    }
    
    console.log('\n🔧 Step 2: Replacing with emergency admin...');
    
    // Replace with emergency version
    if (fs.existsSync('firebase/admin-emergency.ts')) {
      fs.copyFileSync('firebase/admin-emergency.ts', 'firebase/admin.ts');
      console.log('✅ Emergency admin installed');
    } else {
      console.log('❌ Emergency admin file not found!');
      return false;
    }
    
    console.log('\n🔧 Step 3: Checking environment variables...');
    
    // Check if .env.local exists
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env.local file not found!');
      console.log('📝 Please create a .env.local file with your Firebase configuration.');
      return false;
    }
    
    // Read and display environment variables (safely)
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
    
    console.log('📋 Environment variables found:');
    const requiredVars = [
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'FIREBASE_PROJECT_ID', 
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_SERVICE_ACCOUNT_KEY'
    ];
    
    requiredVars.forEach(varName => {
      const value = envVars[varName];
      if (value) {
        if (varName === 'FIREBASE_PRIVATE_KEY') {
          console.log(`   ✅ ${varName}: ${value.substring(0, 50)}... (${value.length} chars)`);
        } else {
          console.log(`   ✅ ${varName}: ${value.substring(0, 100)}...`);
        }
      } else {
        console.log(`   ❌ ${varName}: NOT SET`);
      }
    });
    
    // Check project ID consistency
    const clientProjectId = envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
    const adminProjectId = envVars['FIREBASE_PROJECT_ID'];
    
    if (clientProjectId && adminProjectId) {
      if (clientProjectId === adminProjectId) {
        console.log(`\n✅ Project IDs match: ${clientProjectId}`);
      } else {
        console.log(`\n❌ Project ID MISMATCH!`);
        console.log(`   Client: ${clientProjectId}`);
        console.log(`   Admin:  ${adminProjectId}`);
        console.log('\n🔧 Fixing project ID mismatch...');
        
        // Update admin project ID to match client
        const newLines = lines.map(line => {
          if (line.startsWith('FIREBASE_PROJECT_ID=')) {
            return `FIREBASE_PROJECT_ID=${clientProjectId}`;
          }
          return line;
        });
        
        const newContent = newLines.join('\n');
        fs.writeFileSync(envPath, newContent);
        
        console.log(`✅ Updated FIREBASE_PROJECT_ID to: ${clientProjectId}`);
      }
    }
    
    console.log('\n🎉 EMERGENCY FIX COMPLETED!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Check the console for detailed debugging information');
    console.log('3. Test the authentication flow');
    console.log('\n🔄 If you need to restore the original:');
    console.log('   cp firebase/admin.ts.emergency-backup firebase/admin.ts');
    
    return true;
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error.message);
    return false;
  }
}

// Run emergency fix
const success = emergencyReplace();

if (success) {
  console.log('\n✨ Emergency fix applied successfully!');
  console.log('🚀 Your app should now work without credential decoding errors.');
} else {
  console.log('\n⚠️ Emergency fix failed. Please check the errors above.');
} 