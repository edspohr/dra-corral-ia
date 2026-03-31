import * as admin from 'firebase-admin';

// Initialize Firebase Admin once here — all functions share this instance
if (!admin.apps.length) {
  admin.initializeApp();
}

export { generateImage } from './generateImage';
export { saveLead } from './saveLead';
