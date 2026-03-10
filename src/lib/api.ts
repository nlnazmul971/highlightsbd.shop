import { auth } from '@/lib/firebase';

const API_BASE = import.meta.env.PROD ? '/api' : '/api';

export async function callApi(endpoint: string, body: any, options?: { formData?: boolean }) {
  const user = auth.currentUser;
  const headers: Record<string, string> = {};

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  let fetchBody: any;
  if (options?.formData) {
    fetchBody = body; // FormData
  } else {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}/${endpoint}`, {
    method: 'POST',
    headers,
    body: fetchBody,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}`);
  }
  if (!res.ok && !data.success) {
    throw new Error(data.error || `API call failed (${res.status})`);
  }
  return data;
}

export async function callCourier(provider: 'steadfast' | 'pathao', action: string, data?: any) {
  const endpoint = provider === 'steadfast' ? 'steadfast-courier' : 'pathao-courier';
  return callApi(endpoint, { action, data });
}

export async function sendOrderEmail(body: any) {
  return callApi('send-order-email', body);
}

export async function callMetaCapi(action: string, data?: any) {
  return callApi('meta-capi', { action, data });
}
