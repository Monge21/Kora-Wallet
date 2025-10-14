import { initializeApp, getApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let serviceAccount: object | undefined;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    // Check if the key is a stringified JSON and parse it.
    if (typeof process.env.FIREBASE_SERVICE_ACCOUNT_KEY === 'string') {
       serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else {
        // If it's already an object (can happen in some environments), use it directly.
        serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY as object;
    }
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Please ensure it is a valid JSON string.', e);
    // If parsing fails, it's a configuration error.
    serviceAccount = undefined;
  }
}

function getFirebaseAdminApp(): App {
    if (getApps().length > 0) {
        return getApp();
    }

    if (!serviceAccount) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or is invalid.');
    }
    
    return initializeApp({
        credential: cert(serviceAccount),
    });
}

export function initializeFirebase() {
  const app = getFirebaseAdminApp();
  return {
    firestore: getFirestore(app),
    auth: getAuth(app),
  };
}


