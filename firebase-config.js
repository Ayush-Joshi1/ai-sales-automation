// Firebase Configuration
// Replace these values with your Firebase project credentials
// Get these from: Firebase Console > Project Settings > Your apps

const firebaseConfig = {
  apiKey: "AIzaSyB3fJAUHZR_qKfc9ZclWr45A2PJn73nusM",
  authDomain: "ai-sales-automation-8bef3.firebaseapp.com",
  projectId: "ai-sales-automation-8bef3",
  // Typical Firebase storage bucket uses appspot.com; verify in your Firebase console
  storageBucket: "ai-sales-automation-8bef3.appspot.com",
  messagingSenderId: "308854131979",
  appId: "1:308854131979:web:2195d06b2371e0e7e6e60e",
  measurementId: "G-GBJN2SEBWE"
};

// Initialize Firebase Auth safely: try immediate init if available, otherwise
// initialize once DOMContentLoaded fires and FirebaseAuth is present.
(function initFirebase() {
  console.log('🔍 Checking Firebase availability...');
  console.log('  - firebase:', typeof firebase !== 'undefined' ? '✓ Available' : '✗ Not available');
  console.log('  - FirebaseAuth:', typeof FirebaseAuth !== 'undefined' ? '✓ Available' : '✗ Not available');
  
  function tryInit() {
    console.log('🔍 tryInit() called');
    
    if (typeof firebase === 'undefined') {
      console.warn('❌ firebase global not available');
      return false;
    }
    console.log('✓ firebase global available');
    
    if (typeof FirebaseAuth === 'undefined') {
      console.warn('❌ FirebaseAuth module not available');
      return false;
    }
    console.log('✓ FirebaseAuth module available');
    
    if (typeof FirebaseAuth.init !== 'function') {
      console.error('❌ FirebaseAuth.init is not a function');
      console.log('FirebaseAuth methods:', Object.keys(FirebaseAuth || {}));
      return false;
    }
    console.log('✓ FirebaseAuth.init is a function');
    
    if (!firebaseConfig || typeof firebaseConfig !== 'object') {
      console.warn('❌ firebaseConfig invalid:', firebaseConfig);
      return false;
    }
    console.log('✓ firebaseConfig valid - projectId:', firebaseConfig.projectId);

    try {
      console.log('🚀 Calling FirebaseAuth.init(firebaseConfig)...');
      const result = FirebaseAuth.init(firebaseConfig);
      console.log('✅ Firebase initialization returned:', result !== undefined ? 'value' : 'undefined');
      
      // Verify app was initialized
      setTimeout(() => {
        if (firebase.apps && firebase.apps.length > 0) {
          console.log('✅ firebase.apps initialized, count:', firebase.apps.length);
        }
      }, 50);
      
      return true;
    } catch (error) {
      console.error('❌ Firebase init error:', error.message || error);
      return false;
    }
  }

  // Try immediate init
  if (tryInit()) {
    console.log('✅ Firebase initialized immediately');
    return;
  }

  // If immediate init failed, retry on DOMContentLoaded
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      console.log('📍 DOMContentLoaded fired, retrying Firebase init...');
      if (tryInit()) {
        console.log('✅ Firebase initialized on DOMContentLoaded');
      } else {
        console.error('❌ Firebase initialization failed on DOMContentLoaded');
      }
    });

    // Also retry after a short delay for async script loading
    setTimeout(() => {
      if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase SDK still not loaded after 2s');
        return;
      }
      console.log('📍 Retrying Firebase init after delay...');
      tryInit();
    }, 2000);
    
    // Expose manual init for debugging
    window.manualFirebaseInit = function() {
      console.log('🔧 Manual Firebase init triggered from console');
      const result = tryInit();
      console.log('📊 Result:', result ? 'SUCCESS' : 'FAILED');
      return result;
    };
  }
})();
