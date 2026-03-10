import { useState, useRef } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
};

const ImageUpload = ({ value, onChange, folder = 'products' }: Props) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, folder);
      onChange(url);
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        id="image-upload"
      />

      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Preview" className="w-32 h-40 object-cover border border-border" />
          <button
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="w-32 h-40 border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-foreground/50 transition-colors"
        >
          <ImageIcon size={20} className="text-muted-foreground mb-1" />
          <span className="text-[10px] text-muted-foreground">No image</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="luxury-button-outline text-[10px] py-2 px-3 inline-flex items-center gap-1"
        >
          <Upload size={12} />
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </div>
    </div>
  );
};

export default ImageUpload;
