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
  console.warn('⚠️  Firebase Admin not fully configured. Check FIREBASE_* env vars.');
  console.warn('   FIREBASE_PROJECT_ID:', projectId ? '✓ Set' : '✗ Missing');
  console.warn('   FIREBASE_CLIENT_EMAIL:', clientEmail ? '✓ Set' : '✗ Missing');
  console.warn('   FIREBASE_PRIVATE_KEY:', rawPrivateKey ? `✓ Set (${rawPrivateKey.length} chars)` : '✗ Missing');
}

if (!admin.apps.length && projectId && clientEmail && rawPrivateKey) {
  try {
    // Handle both literal \n and actual newlines
    let privateKey = rawPrivateKey;
    
    // If it contains literal \n, replace with actual newlines
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Also handle if key is on one line without proper formatting
    if (!privateKey.includes('\n') && privateKey.includes('-----BEGIN')) {
      // Try to add newlines after headers and before footers
      privateKey = privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
        .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    console.log('✅ Firebase Admin initialized for project:', projectId);
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    console.error('   This usually means FIREBASE_PRIVATE_KEY format is incorrect');
    console.error('   Key should start with: -----BEGIN PRIVATE KEY-----');
    console.error('   Key preview:', rawPrivateKey.substring(0, 50) + '...');
  }
}

module.exports = admin;
