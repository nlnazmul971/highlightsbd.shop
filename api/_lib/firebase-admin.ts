import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;
let initError: string | null = null;

function ensureInitialized() {
  if (adminApp) return;
  if (initError) return;

  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      initError = 'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set';
      return;
    }

    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(raw);
    } catch {
      initError = 'FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Make sure the entire JSON is pasted correctly.';
      return;
    }

    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      initError = 'FIREBASE_SERVICE_ACCOUNT_KEY is missing required fields (project_id, private_key, client_email)';
      return;
    }

    if (!getApps().length) {
      adminApp = initializeApp({ credential: cert(serviceAccount) });
    } else {
      adminApp = getApps()[0];
    }

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  } catch (err: any) {
    initError = `Firebase Admin initialization failed: ${err.message}`;
  }
}

export { adminDb };

export async function verifyFirebaseAdmin(authHeader: string | null): Promise<{ authorized: boolean; uid?: string; error?: string }> {
  ensureInitialized();

  if (initError) {
    return { authorized: false, error: initError };
  }

  if (!adminAuth || !adminDb) {
    return { authorized: false, error: 'Firebase Admin not initialized' };
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing authorization header' };
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const roleDoc = await adminDb.collection('user_roles').doc(uid).get();
    if (!roleDoc.exists || roleDoc.data()?.role !== 'admin') {
      return { authorized: false, error: 'Admin access required' };
    }

    return { authorized: true, uid };
  } catch (err: any) {
    return { authorized: false, error: err.message || 'Invalid token' };
  }
}

export function getAdminDb(): Firestore | null {
  ensureInitialized();
  return adminDb;
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}
