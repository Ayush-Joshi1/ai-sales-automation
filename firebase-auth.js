// Firebase Authentication Module
// This module handles all Firebase auth operations

const FirebaseAuth = (() => {
  let initialized = false;
  let currentUser = null;

  // Initialize Firebase (called after Firebase SDK is loaded)
  const init = (firebaseConfig) => {
    try {
      console.log('🔍 FirebaseAuth.init() called with config:', firebaseConfig ? 'object' : 'undefined');
      
      if (typeof firebase === 'undefined') {
        console.error('❌ firebase global not available in init');
        return false;
      }
      console.log('✓ firebase global available');
      
      if (!firebaseConfig || typeof firebaseConfig !== 'object') {
        console.error('❌ Invalid firebaseConfig:', firebaseConfig);
        return false;
      }
      console.log('✓ firebaseConfig valid, projectId:', firebaseConfig.projectId);
      
      // Check if already initialized
      if (firebase.apps && firebase.apps.length > 0) {
        console.log('⚠️ Firebase already initialized, skipping reinit');
        initialized = true;
        return true;
      }
      
      // Initialize Firebase
      console.log('🚀 Calling firebase.initializeApp()...');
      const app = firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase app created:', app.name);
      
      initialized = true;
      console.log('✅ initialized flag set to true');
      
      // Get auth instance
      const auth = firebase.auth();
      console.log('✅ Firebase auth instance obtained');
      
      // Listen for auth state changes
      auth.onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
          console.log('✅ User logged in:', user.email);
          window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));
        } else {
          console.log('❌ User logged out');
          window.dispatchEvent(new CustomEvent('userLoggedOut'));
        }
      });
      console.log('✅ Auth state listener attached');
      
      console.log('✅ Firebase initialization complete');
      return true;
    } catch (error) {
      console.error('❌ Firebase init error:', error.message || error);
      console.error('Error stack:', error.stack);
      initialized = false;
      return false;
    }
  };

  // Register with email and password
  const register = async (email, password, name) => {
    try {
      if (!initialized || typeof firebase === 'undefined') {
        return { success: false, error: 'Firebase not initialized yet. Please try again.' };
      }
      const auth = firebase.auth();
      
      // Create user account
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Update user profile with display name
      await user.updateProfile({
        displayName: name
      });
      
      console.log('✅ User registered:', user.email);
      return { success: true, user, message: 'Account created successfully' };
    } catch (error) {
      console.error('❌ Registration error:', error.message);
      
      let errorMsg = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'Email is already registered';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'Password is too weak (minimum 6 characters)';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address';
      }
      
      return { success: false, error: errorMsg };
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      if (!initialized || typeof firebase === 'undefined') {
        return { success: false, error: 'Firebase not initialized yet. Please try again.' };
      }
      const auth = firebase.auth();
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log('✅ User logged in:', user.email);
      return { success: true, user, message: 'Logged in successfully' };
    } catch (error) {
      console.error('❌ Login error:', error.message);
      
      let errorMsg = error.message;
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'Email not found. Please register first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address';
      }
      
      return { success: false, error: errorMsg };
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (!initialized || typeof firebase === 'undefined') {
        currentUser = null;
        return { success: true };
      }
      const auth = firebase.auth();
      await auth.signOut();
      currentUser = null;
      console.log('✅ User logged out');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Google Sign-In
  const signInWithGoogle = async () => {
    try {
      if (!initialized || typeof firebase === 'undefined') {
        return { success: false, error: 'Firebase not initialized yet. Please try again.' };
      }
      
      const auth = firebase.auth();
      const provider = new firebase.auth.GoogleAuthProvider();
      
      console.log('🔵 Initiating Google Sign-In...');
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      
      console.log('✅ Google Sign-In successful:', user.email);
      return { success: true, user, message: 'Signed in with Google' };
    } catch (error) {
      console.error('❌ Google Sign-In error:', error.message);
      
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in cancelled' };
      }

      if (error.code === 'auth/unauthorized-domain') {
        const friendly = 'This domain is not authorized for OAuth operations for the Firebase project. Add your domain (for example, "localhost" during local development) under Firebase Console → Authentication → Sign-in method → Authorized domains.';
        return { success: false, error: friendly };
      }

      return { success: false, error: error.message };
    }
  };

  // Get current user
  const getCurrentUser = () => {
    if (currentUser) return currentUser;
    if (typeof firebase === 'undefined') return null;
    try {
      return firebase.auth().currentUser;
    } catch (e) {
      return currentUser || null;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return currentUser !== null;
  };

  // Send password reset email
  const sendPasswordReset = async (email) => {
    try {
      if (!initialized || typeof firebase === 'undefined') {
        return { success: false, error: 'Firebase not initialized yet. Please try again.' };
      }
      const auth = firebase.auth();
      await auth.sendPasswordResetEmail(email);
      console.log('✅ Password reset email sent');
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('❌ Password reset error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    init,
    register,
    login,
    logout,
    signInWithGoogle,
    getCurrentUser,
    isAuthenticated,
    sendPasswordReset
  };
})();
