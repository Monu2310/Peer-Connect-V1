const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

// Load environment variables from .env when running locally (development)
// This does nothing on Render where env vars are already provided.
if (process.env.NODE_ENV !== 'production') {
  // Lazy require to avoid duplicate dotenv in other files
  try {
    // eslint-disable-next-line global-require
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  } catch (e) {
    // If dotenv isn't available for some reason, just continue
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !rawPrivateKey) {
  console.warn('Firebase Admin not fully configured. Check FIREBASE_* env vars.');
}

if (!admin.apps.length && projectId && clientEmail && rawPrivateKey) {
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log('Firebase Admin initialized for project:', projectId);
}

module.exports = admin;
