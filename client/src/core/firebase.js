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
} from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAWV8utdk-d9ssH7MvoeJgcZeUyyWl506s',
  authDomain: 'peerconnect-f6a5c.firebaseapp.com',
  projectId: 'peerconnect-f6a5c',
  storageBucket: 'peerconnect-f6a5c.firebasestorage.app',
  messagingSenderId: '839970664424',
  appId: '1:839970664424:web:f4d32de0cb06f64f65be5d',
  measurementId: 'G-Z9NHPCDQ0F',
};

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
};
