import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  initializeApp({ credential: cert(serviceAccount) });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

export async function verifyFirebaseAdmin(authHeader: string | null): Promise<{ authorized: boolean; uid?: string; error?: string }> {
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

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}
