import { supabase } from '@/integrations/supabase/client';

/**
 * Compress an image file before upload using canvas.
 * Resizes to maxWidth and compresses to target quality.
 */
const compressImage = (file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // If not an image type we can compress, return as-is
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Only resize if larger than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else resolve(file);
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original
    };
    img.src = url;
  });
};

export const uploadImage = async (file: File, folder: string = 'products'): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const maxSize = 25 * 1024 * 1024; // 25MB
  if (file.size > maxSize) throw new Error('Image must be less than 25MB');

  // Compress and convert to WebP
  const compressed = await compressImage(file);
  
  const ext = compressed.type === 'image/webp' ? 'webp' : (file.name.split('.').pop()?.toLowerCase() || 'jpg');
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(fileName, compressed, {
      cacheControl: '31536000', // 1 year cache
      upsert: false,
      contentType: compressed.type || 'image/webp',
    });

  if (error) throw new Error(error.message || 'Upload failed');

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return publicUrl;
};