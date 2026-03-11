import { supabase } from '@/integrations/supabase/client';

export const uploadImage = async (file: File, folder: string = 'products'): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const maxSize = 25 * 1024 * 1024; // 25MB
  if (file.size > maxSize) throw new Error('Image must be less than 25MB');

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(error.message || 'Upload failed');

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return publicUrl;
};
