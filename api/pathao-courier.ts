import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyFirebaseAdmin, corsHeaders } from './_lib/firebase-admin';

const PATHAO_BASE_URL = 'https://api-hermes.pathao.com';

async function getAccessToken(): Promise<string> {
  const response = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/issue-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
      grant_type: 'password',
    }),
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch {
    throw new Error(`Pathao auth returned non-JSON (status ${response.status})`);
  }
  if (!response.ok || !data.access_token) {
    throw new Error(data.message || `Authentication failed (status ${response.status})`);
  }
  return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cors = corsHeaders();
  if (req.method === 'OPTIONS') return res.setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Headers', 'authorization, content-type').status(200).end();
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));

  const auth = await verifyFirebaseAdmin(req.headers.authorization || null);
  if (!auth.authorized) return res.status(403).json({ success: false, error: auth.error });

  const { PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_USERNAME, PATHAO_PASSWORD } = process.env;
  if (!PATHAO_CLIENT_ID || !PATHAO_CLIENT_SECRET || !PATHAO_USERNAME || !PATHAO_PASSWORD) {
    return res.json({ success: false, error: 'Pathao API credentials not configured' });
  }

  try {
    const { action, data } = req.body;

    if (action === 'check_connection') {
      try {
        const token = await getAccessToken();
        return res.json({ success: true, data: { message: 'Connected successfully', has_token: !!token } });
      } catch (err: any) {
        return res.json({ success: false, error: err.message });
      }
    }

    const token = await getAccessToken();
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };

    let url = '', method = 'GET';
    let fetchBody: string | undefined;

    switch (action) {
      case 'get_cities': url = `${PATHAO_BASE_URL}/aladdin/api/v1/countries/1/city-list`; break;
      case 'get_zones': url = `${PATHAO_BASE_URL}/aladdin/api/v1/cities/${data.city_id}/zone-list`; break;
      case 'get_areas': url = `${PATHAO_BASE_URL}/aladdin/api/v1/zones/${data.zone_id}/area-list`; break;
      case 'create_order': url = `${PATHAO_BASE_URL}/aladdin/api/v1/orders`; method = 'POST'; fetchBody = JSON.stringify(data); break;
      case 'view_order': url = `${PATHAO_BASE_URL}/aladdin/api/v1/orders/${data.consignment_id}`; break;
      default: return res.json({ success: false, error: 'Unknown action' });
    }

    const fetchOptions: RequestInit = { method, headers: authHeaders };
    if (fetchBody) fetchOptions.body = fetchBody;

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();
    let result;
    try { result = JSON.parse(responseText); } catch {
      return res.json({ success: false, error: `Pathao API returned non-JSON (status ${response.status})` });
    }

    return res.json({ success: response.ok, data: result, status: response.status });
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
}
