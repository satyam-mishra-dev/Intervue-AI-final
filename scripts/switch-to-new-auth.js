const fs = require('fs');
const path = require('path');

console.log('🔄 Switching to New Authentication System\n');

// Files to backup and replace
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

// Function to safely backup and replace files
function switchFile(config) {
  try {
    console.log(`📁 Processing: ${config.old}`);
    
    // Check if old file exists
    if (!fs.existsSync(config.old)) {
      console.log(`   ⚠️  Old file not found: ${config.old}`);
      return false;
    }
    
    // Check if new file exists
    if (!fs.existsSync(config.new)) {
      console.log(`   ❌ New file not found: ${config.new}`);
      return false;
    }
    
    // Create backup
    fs.copyFileSync(config.old, config.backup);
    console.log(`   💾 Backup created: ${config.backup}`);
    
    // Replace old file with new file
    fs.copyFileSync(config.new, config.old);
    console.log(`   ✅ File replaced: ${config.old}`);
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error processing ${config.old}:`, error.message);
    return false;
  }
}

// Function to restore from backup
function restoreFromBackup(config) {
  try {
    if (fs.existsSync(config.backup)) {
      fs.copyFileSync(config.backup, config.old);
      console.log(`   🔄 Restored from backup: ${config.old}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`   ❌ Error restoring ${config.old}:`, error.message);
    return false;
  }
}

// Main execution
let successCount = 0;
let totalFiles = filesToSwitch.length;

console.log('🔄 Starting file switch process...\n');

for (const fileConfig of filesToSwitch) {
  if (switchFile(fileConfig)) {
    successCount++;
  }
  console.log('');
}

console.log('📊 Switch Results:');
console.log('==================');
console.log(`✅ Successfully switched: ${successCount}/${totalFiles} files`);

if (successCount === totalFiles) {
  console.log('\n🎉 All files switched successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your development server');
  console.log('2. Test the authentication flow');
  console.log('3. Check the console for any errors');
  console.log('\n🔄 If you need to rollback, run: node scripts/rollback-auth.js');
} else {
  console.log('\n⚠️  Some files failed to switch. Rolling back...');
  
  for (const fileConfig of filesToSwitch) {
    restoreFromBackup(fileConfig);
  }
  
  console.log('\n🔄 Rollback completed. Please check the errors above.');
}

console.log('\n✨ Switch process complete!'); 