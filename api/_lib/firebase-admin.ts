// Firebase REST API based auth - NO firebase-admin needed
// Uses the public Firebase API key to verify tokens and check roles

const FIREBASE_API_KEY = 'AIzaSyCI7G9NeylLhmuXDQlbOJWlYt5gOcApvaE';
const FIREBASE_PROJECT_ID = 'my-web-highlights-5e3c3';

/**
 * Verify Firebase ID token using Google Identity Toolkit REST API
 * and check admin role from Firestore
 */
export async function verifyFirebaseAuth(authHeader: string | null): Promise<{ authorized: boolean; uid?: string; error?: string }> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing authorization header' };
  }

  try {
    const idToken = authHeader.replace('Bearer ', '');

    // Step 1: Verify the ID token via Google Identity Toolkit
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.users || verifyData.users.length === 0) {
      return { authorized: false, error: verifyData.error?.message || 'Invalid token' };
    }

    const uid = verifyData.users[0].localId;

    // Step 2: Check admin role from Firestore REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/user_roles/${uid}`;
    const roleRes = await fetch(firestoreUrl);

    if (!roleRes.ok) {
      return { authorized: false, error: 'Admin access required' };
    }

    const roleDoc = await roleRes.json();
    const roleField = roleDoc.fields?.role?.stringValue;

    if (roleField !== 'admin') {
      return { authorized: false, error: 'Admin access required' };
    }

    return { authorized: true, uid };
  } catch (err: any) {
    return { authorized: false, error: err.message || 'Authentication failed' };
  }
}

/**
 * Read a Firestore collection using REST API (no admin SDK)
 */
export async function firestoreGet(collection: string): Promise<any[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}`;
  const res = await fetch(url);

  if (!res.ok) return [];

  const data = await res.json();
  if (!data.documents) return [];

  return data.documents.map((doc: any) => {
    const fields: Record<string, any> = {};
    for (const [key, val] of Object.entries(doc.fields || {})) {
      const v = val as any;
      if (v.stringValue !== undefined) fields[key] = v.stringValue;
      else if (v.integerValue !== undefined) fields[key] = Number(v.integerValue);
      else if (v.doubleValue !== undefined) fields[key] = v.doubleValue;
      else if (v.booleanValue !== undefined) fields[key] = v.booleanValue;
      else if (v.timestampValue !== undefined) fields[key] = v.timestampValue;
      else if (v.arrayValue !== undefined) fields[key] = v.arrayValue;
      else if (v.mapValue !== undefined) fields[key] = v.mapValue;
      else fields[key] = v;
    }
    const docId = doc.name.split('/').pop();
    return { id: docId, ...fields };
  });
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}
