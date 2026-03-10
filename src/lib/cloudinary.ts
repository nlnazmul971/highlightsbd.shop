import { auth } from '@/lib/firebase';

export const uploadToCloudinary = async (file: File, folder: string = 'products'): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();

  // Convert file to base64 data URI for JSON transport
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch('/api/cloudinary-upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: base64, fileName: file.name, folder }),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Upload failed');

  return result.url;
};
