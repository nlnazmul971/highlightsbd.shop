import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyFirebaseAdmin, getAdminDb, corsHeaders } from './_lib/firebase-admin';

const META_GRAPH_URL = 'https://graph.facebook.com/v18.0';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cors = corsHeaders();
  if (req.method === 'OPTIONS') return res.setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Headers', 'authorization, content-type').status(200).end();
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));

  const auth = await verifyFirebaseAdmin(req.headers.authorization || null);
  if (!auth.authorized) return res.status(403).json({ success: false, error: auth.error });

  try {
    const { action, data } = req.body;

    const db = getAdminDb();
    if (!db) {
      return res.json({ success: false, error: 'Firebase Admin not initialized - check FIREBASE_SERVICE_ACCOUNT_KEY' });
    }

    // Get tracking settings from Firestore
    const settingsSnap = await db.collection('tracking_settings').get();
    const settingsMap: Record<string, string> = {};
    settingsSnap.forEach((doc) => {
      const d = doc.data();
      settingsMap[d.key || doc.id] = d.value;
    });

    const pixelId = settingsMap['meta_pixel_id'];
    const accessToken = settingsMap['meta_capi_access_token'];

    if (action === 'check_connection') {
      if (!pixelId || !accessToken) {
        return res.json({ success: false, error: 'Meta Pixel ID or CAPI Access Token not configured' });
      }
      const response = await fetch(`${META_GRAPH_URL}/${pixelId}?access_token=${accessToken}`);
      const responseText = await response.text();
      let result;
      try { result = JSON.parse(responseText); } catch {
        return res.json({ success: false, error: 'Non-JSON response from Meta API' });
      }
      return res.json({ success: !result.error, data: result });
    }

    if (action === 'send_event') {
      if (!pixelId || !accessToken) {
        return res.json({ success: false, error: 'Meta credentials not configured' });
      }
      const response = await fetch(`${META_GRAPH_URL}/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data.events }),
      });
      const responseText = await response.text();
      let result;
      try { result = JSON.parse(responseText); } catch {
        return res.json({ success: false, error: 'Non-JSON response' });
      }
      return res.json({ success: response.ok, data: result });
    }

    return res.json({ success: false, error: 'Unknown action' });
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
}
