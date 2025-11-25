// Firebase client initialization for PeerConnect
// NOTE: Fill in the firebaseConfig values from your Firebase Console.

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Debugging: Check if config is loaded
if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase API Key is missing! Check your .env file and RESTART the server.');
  console.error('Current process.env:', process.env);
}

// Initialize Firebase app (singleton)
const app = initializeApp(firebaseConfig);

// Initialize Auth service
const auth = getAuth(app);

export {
  app,
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
};
