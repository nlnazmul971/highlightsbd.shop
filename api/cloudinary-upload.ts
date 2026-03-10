import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyFirebaseAdmin, corsHeaders } from './_lib/firebase-admin';
import * as crypto from 'crypto';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req: VercelRequest): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 });
    form.parse(req as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cors = corsHeaders();
  if (req.method === 'OPTIONS') return res.setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Headers', 'authorization, content-type').status(200).end();

  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await verifyFirebaseAdmin(req.headers.authorization || null);
  if (!auth.authorized) return res.status(403).json({ error: auth.error });

  try {
    const { fields, files } = await parseForm(req);

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) return res.status(400).json({ error: 'No file provided' });

    const folder = (Array.isArray(fields.folder) ? fields.folder[0] : fields.folder) || 'products';

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;

    const timestamp = Math.round(Date.now() / 1000).toString();
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    const blob = new Blob([fileBuffer], { type: uploadedFile.mimetype || 'image/jpeg' });

    const formData = new FormData();
    formData.append('file', blob, uploadedFile.originalFilename || 'upload.jpg');
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    const result = await cloudinaryRes.json();
    if (!cloudinaryRes.ok) return res.status(400).json({ error: result.error?.message || 'Upload failed' });

    return res.status(200).json({ url: result.secure_url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
