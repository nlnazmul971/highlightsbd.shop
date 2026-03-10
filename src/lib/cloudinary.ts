import { supabase } from '@/integrations/supabase/client';

export const uploadToCloudinary = async (file: File, folder: string = 'products'): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
    body: formData,
  });

  if (error) throw new Error(error.message || 'Upload failed');
  if (!data?.url) throw new Error('No URL returned from upload');

  return data.url;
};
