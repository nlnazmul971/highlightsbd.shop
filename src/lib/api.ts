import { supabase } from '@/integrations/supabase/client';

export async function callApi(endpoint: string, body: any) {
  const { data, error } = await supabase.functions.invoke(endpoint, {
    body,
  });

  if (error) {
    throw new Error(error.message || `API call failed`);
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
