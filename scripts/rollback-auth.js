const fs = require('fs');
const path = require('path');

console.log('🔄 Rolling Back to Old Authentication System\n');

// Files to restore from backup
const filesToRestore = [
  {
    old: 'firebase/admin.ts',
    backup: 'firebase/admin.ts.backup'
  },
  {
    old: 'lib/actions/auth.action.ts',
    backup: 'lib/actions/auth.action.ts.backup'
  },
  {
    old: 'middleware.ts',
    backup: 'middleware.ts.backup'
  }
];

// Function to restore file from backup
function restoreFile(config) {
  try {
    console.log(`📁 Restoring: ${config.old}`);
    
    // Check if backup exists
    if (!fs.existsSync(config.backup)) {
      console.log(`   ❌ Backup not found: ${config.backup}`);
      return false;
    }
    
    // Restore from backup
    fs.copyFileSync(config.backup, config.old);
    console.log(`   ✅ File restored: ${config.old}`);
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error restoring ${config.old}:`, error.message);
    return false;
  }
}

// Main execution
let successCount = 0;
let totalFiles = filesToRestore.length;

console.log('🔄 Starting rollback process...\n');

for (const fileConfig of filesToRestore) {
  if (restoreFile(fileConfig)) {
    successCount++;
  }
  console.log('');
}

console.log('📊 Rollback Results:');
console.log('===================');
console.log(`✅ Successfully restored: ${successCount}/${totalFiles} files`);

if (successCount === totalFiles) {
  console.log('\n🎉 All files restored successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your development server');
  console.log('2. Test the authentication flow');
  console.log('3. Check the console for any errors');
} else {
  console.log('\n⚠️  Some files failed to restore. Please check the errors above.');
}

console.log('\n✨ Rollback process complete!'); 