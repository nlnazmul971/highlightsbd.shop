import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsHeaders } from './_lib/firebase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cors = corsHeaders();
  if (req.method === 'OPTIONS') return res.setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Headers', 'authorization, content-type').status(200).end();
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));

  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'No token provided' });

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) return res.status(500).json({ success: false, error: 'reCAPTCHA not configured' });

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    const verifyRes = await fetch(verifyUrl, { method: 'POST' });
    const verifyData = await verifyRes.json();

    const success = verifyData.success && (verifyData.score ?? 0) >= 0.3;

    return res.json({ success, score: verifyData.score, action: verifyData.action });
  } catch {
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
}
