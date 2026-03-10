import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsHeaders } from './_lib/firebase-admin';

const SITE_NAME = 'HIGHLIGHTS';
const FROM_EMAIL = `${SITE_NAME} <orders@highlightsbd.shop>`;

function generateOrderConfirmationHtml(props: any): string {
  const items = (props.items || []).map((item: any) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.name}${item.size ? ` (${item.size})` : ''}${item.color ? ` / ${item.color}` : ''}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">x${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">BDT ${item.price * item.quantity}</td></tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
<div style="text-align:center;padding:20px;background:#111;color:#fff"><h1 style="margin:0;letter-spacing:3px">${SITE_NAME}</h1></div>
<div style="padding:20px">
<h2>Order Confirmation</h2>
<p>Thank you, <strong>${props.customerName}</strong>! Your order has been placed.</p>
<p><strong>Order #${(props.orderId || '').slice(0, 8).toUpperCase()}</strong></p>
<table style="width:100%;border-collapse:collapse;margin:16px 0"><thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Price</th></tr></thead><tbody>${items}</tbody></table>
<div style="text-align:right;padding:8px 0;border-top:2px solid #111">
${props.discount > 0 ? `<p>Discount: -BDT ${props.discount}</p>` : ''}
<p>Delivery (${props.deliveryMethod}): BDT ${props.deliveryFee}</p>
<p style="font-size:18px;font-weight:bold">Total: BDT ${props.total}</p>
</div>
<div style="background:#f9f9f9;padding:12px;margin:16px 0">
<p><strong>Delivery Address:</strong> ${props.address}, ${props.city}</p>
<p><strong>Phone:</strong> ${props.phone}</p>
<p><strong>Payment:</strong> ${(props.paymentMethod || '').toUpperCase()}</p>
</div>
</div>
<div style="text-align:center;padding:16px;color:#999;font-size:12px">Thank you for shopping with ${SITE_NAME}</div>
</body></html>`;
}

function generateStatusUpdateHtml(props: any): string {
  const shortId = (props.orderId || '').slice(0, 8).toUpperCase();
  const statusMessages: Record<string, string> = {
    Processing: 'Your order is now being processed and will be shipped soon.',
    Shipped: 'Your order has been shipped and is on its way to you.',
    Delivered: 'Your order has been delivered. Thank you for shopping with us!',
    Cancelled: 'Your order has been cancelled. If you have any questions, please contact our support.',
  };
  const message = statusMessages[props.status] || `Your order status has been updated to: ${props.status}.`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
<div style="text-align:center;padding:20px;background:#111;color:#fff"><h1 style="margin:0;letter-spacing:3px">${SITE_NAME}</h1></div>
<div style="padding:20px">
<h2>Order Update</h2>
<p>Hi ${props.customerName},</p>
<p>${message}</p>
<div style="background:#f9f9f9;padding:12px;margin:16px 0">
<p><strong>Order:</strong> #${shortId}</p>
<p><strong>Status:</strong> ${props.status}</p>
${props.trackingCode ? `<p><strong>Tracking:</strong> ${props.trackingCode}${props.courierProvider ? ` (${props.courierProvider})` : ''}</p>` : ''}
</div>
</div>
<div style="text-align:center;padding:16px;color:#999;font-size:12px">Thank you for shopping with ${SITE_NAME}</div>
</body></html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cors = corsHeaders();
  if (req.method === 'OPTIONS') return res.setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Headers', 'authorization, content-type').status(200).end();
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

    const body = req.body;
    const { type } = body;

    // Status update email
    if (type === 'status_update') {
      const { to, customerName, orderId, status, trackingCode, courierProvider } = body;
      if (!to || !orderId || !status) return res.status(400).json({ error: 'Missing required fields' });

      const html = generateStatusUpdateHtml({ customerName: customerName || 'Customer', orderId, status, trackingCode, courierProvider });
      const shortId = orderId.slice(0, 8).toUpperCase();

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: `Order #${shortId} - ${status}`, html }),
      });
      const data = await emailRes.json();
      if (!emailRes.ok) return res.status(500).json({ error: data });
      return res.json({ success: true, id: data.id });
    }

    // Order confirmation email
    const { to, customerName, orderId, items, subtotal, deliveryFee, discount, total, deliveryMethod, paymentMethod, address, city, phone } = body;
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

    const templateProps = {
      customerName: customerName || 'Customer', orderId, items: items || [],
      subtotal: subtotal || 0, deliveryFee: deliveryFee || 0, discount: discount || 0,
      total: total || 0, deliveryMethod: deliveryMethod || 'Standard',
      paymentMethod: paymentMethod || 'COD', address: address || '', city: city || '', phone: phone || '',
    };

    const results: any = {};
    const shortId = orderId.slice(0, 8).toUpperCase();

    // Customer email
    if (to) {
      const html = generateOrderConfirmationHtml(templateProps);
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: `Your HIGHLIGHTS order #${shortId}`, html }),
      });
      const data = await emailRes.json();
      if (emailRes.ok) results.customer = data.id;
    }

    // Admin notification
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      const adminHtml = generateOrderConfirmationHtml({ ...templateProps, customerEmail: to });
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: [adminEmail], subject: `New order #${shortId} - BDT ${total || 0}`, html: adminHtml }),
      });
      const data = await emailRes.json();
      if (emailRes.ok) results.admin = data.id;
    }

    return res.json({ success: true, ...results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
