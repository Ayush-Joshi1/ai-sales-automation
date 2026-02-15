// Script to delete all users from Firebase
// WARNING: This will permanently delete all registered user accounts!

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_ADMIN_KEY || './firebase-admin-key.json';

try {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
  });
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed');
  console.error('Please ensure you have firebase-admin-key.json in the project root');
  console.error('Get it from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key');
  process.exit(1);
}

const auth = admin.auth();

async function deleteAllUsers() {
  try {
    console.log('🗑️  Starting user deletion process...');
    
    let deletedCount = 0;
    let totalCount = 0;
    
    // Get all users in batches
    let pageToken = undefined;
    
    while (true) {
      try {
        const listUsersResult = await auth.listUsers(1000, pageToken);
        
        totalCount += listUsersResult.users.length;
        
        // Delete each user
        for (const user of listUsersResult.users) {
          try {
            await auth.deleteUser(user.uid);
            console.log(`✓ Deleted user: ${user.email || user.uid}`);
            deletedCount++;
          } catch (error) {
            console.error(`❌ Failed to delete user ${user.email || user.uid}:`, error.message);
          }
        }
        
        // Check if there are more users
        if (!listUsersResult.pageToken) {
          break;
        }
        pageToken = listUsersResult.pageToken;
        
      } catch (error) {
        console.error('Error retrieving users:', error.message);
        break;
      }
    }
    
    console.log(`\n✅ Deletion complete!`);
    console.log(`📊 Total users found: ${totalCount}`);
    console.log(`🗑️  Successfully deleted: ${deletedCount}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during deletion:', error);
    process.exit(1);
  }
}

// Confirm before deletion
console.log('⚠️  WARNING: This will PERMANENTLY delete ALL registered users!');
console.log('Once deleted, users cannot be recovered.\n');

const args = process.argv.slice(2);
if (args.includes('--confirm')) {
  deleteAllUsers();
} else {
  console.log('To proceed, run: node delete-users.js --confirm');
  process.exit(0);
}
