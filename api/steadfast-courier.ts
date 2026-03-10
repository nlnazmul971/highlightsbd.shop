import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyFirebaseAdmin, corsHeaders } from './_lib/firebase-admin';

const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cors = corsHeaders();
  if (req.method === 'OPTIONS') return res.setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Headers', 'authorization, content-type').status(200).end();
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));

  const auth = await verifyFirebaseAdmin(req.headers.authorization || null);
  if (!auth.authorized) return res.status(403).json({ success: false, error: auth.error });

  const STEADFAST_API_KEY = process.env.STEADFAST_API_KEY;
  const STEADFAST_SECRET_KEY = process.env.STEADFAST_SECRET_KEY;

  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
    return res.json({ success: false, error: 'Steadfast API keys not configured' });
  }

  const steadfastHeaders: Record<string, string> = {
    'Api-Key': STEADFAST_API_KEY,
    'Secret-Key': STEADFAST_SECRET_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const { action, data } = req.body;
    let url = '';
    let method = 'GET';
    let fetchBody: string | undefined;

    switch (action) {
      case 'check_connection':
      case 'check_balance':
        url = `${STEADFAST_BASE_URL}/get_balance`; break;
      case 'create_order':
        url = `${STEADFAST_BASE_URL}/create_order`; method = 'POST';
        fetchBody = JSON.stringify({
          invoice: data.invoice, recipient_name: data.recipient_name,
          recipient_phone: data.recipient_phone, recipient_address: data.recipient_address,
          cod_amount: data.cod_amount, note: data.note || '',
          item_description: data.item_description || '', delivery_type: data.delivery_type ?? 0,
        }); break;
      case 'bulk_create_order':
        url = `${STEADFAST_BASE_URL}/create_order/bulk-order`; method = 'POST';
        fetchBody = JSON.stringify({ data: data.orders }); break;
      case 'check_status':
        url = `${STEADFAST_BASE_URL}/status_by_cid/${data.consignment_id}`; break;
      case 'status_by_invoice':
        url = `${STEADFAST_BASE_URL}/status_by_invoice/${data.invoice}`; break;
      case 'status_by_tracking':
        url = `${STEADFAST_BASE_URL}/status_by_trackingcode/${data.tracking_code}`; break;
      case 'create_return_request':
        url = `${STEADFAST_BASE_URL}/create_return_request`; method = 'POST';
        fetchBody = JSON.stringify({ consignment_id: data.consignment_id, reason: data.reason || '' }); break;
      case 'get_return_request':
        url = `${STEADFAST_BASE_URL}/get_return_request/${data.id}`; break;
      case 'get_return_requests':
        url = `${STEADFAST_BASE_URL}/get_return_requests`; break;
      case 'get_payments':
        url = `${STEADFAST_BASE_URL}/payments`; break;
      case 'get_payment':
        url = `${STEADFAST_BASE_URL}/payments/${data.payment_id}`; break;
      case 'get_police_stations':
        url = `${STEADFAST_BASE_URL}/police_stations`; break;
      default:
        return res.json({ success: false, error: 'Unknown action' });
    }

    const fetchOptions: RequestInit = { method, headers: steadfastHeaders };
    if (fetchBody) fetchOptions.body = fetchBody;

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();
    let result;
    try { result = JSON.parse(responseText); } catch {
      return res.json({ success: false, error: response.ok ? 'Unexpected response format' : `Steadfast API returned ${response.status}`, status: response.status });
    }

    return res.json({ success: response.ok, data: result, status: response.status });
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
}
