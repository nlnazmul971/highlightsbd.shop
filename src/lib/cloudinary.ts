import { supabase } from '@/integrations/supabase/client';

export const uploadToCloudinary = async (file: File, folder: string = 'products'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(`https://${projectId}.supabase.co/functions/v1/cloudinary-upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Upload failed');
  
  return result.url;
};
