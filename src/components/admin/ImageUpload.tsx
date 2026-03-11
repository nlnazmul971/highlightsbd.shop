import { useState, useRef } from 'react';
import { uploadImage } from '@/lib/upload';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  value: string;
  onChange: (url: string) => void;
  onMultiUpload?: (urls: string[]) => void;
  folder?: string;
  multiple?: boolean;
};

const ImageUpload = ({ value, onChange, onMultiUpload, folder = 'products', multiple = false }: Props) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    const maxSize = 25 * 1024 * 1024; // 25MB

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        const isValidType = file.type.startsWith('image/') || validExtensions.includes(ext);
        if (!isValidType) {
          toast.error(`${file.name}: Invalid image format`);
          continue;
        }
        if (file.size > maxSize) {
          toast.error(`${file.name}: Image must be less than 25MB`);
          continue;
        }

        const url = await uploadImage(file, folder);
        uploadedUrls.push(url);
      }

      if (uploadedUrls.length > 0) {
        if (multiple && onMultiUpload) {
          onMultiUpload(uploadedUrls);
        } else {
          onChange(uploadedUrls[0]);
        }
        toast.success(`${uploadedUrls.length} image(s) uploaded`);
      }
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
        multiple={multiple}
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
          {uploading ? 'Uploading...' : multiple ? 'Upload Images' : 'Upload Image'}
        </button>
      </div>
    </div>
  );
};

export default ImageUpload;
