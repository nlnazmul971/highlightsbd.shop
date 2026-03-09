import { useState, useRef, useEffect } from 'react';
import { useStoreSettings, useUpdateStoreSetting } from '@/hooks/useSupabase';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Save, Loader2, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';

const AdminHomepage = () => {
  const { data: settings = {}, isLoading } = useStoreSettings();
  const updateSetting = useUpdateStoreSetting();

  const rawSlides = settings['hero_slides'];
  const slides: SlideType[] = rawSlides ? JSON.parse(rawSlides) : [];

  const rawPosters = settings['homepage_posters'];
  const posters: PosterType[] = rawPosters ? JSON.parse(rawPosters) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border border-border p-4 bg-secondary/20 flex items-start gap-3">
        <Info size={16} className="text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Image Guidelines:</strong></p>
          <p>• Hero Slider: <strong>1920×1080px</strong> recommended (16:9 ratio), Max <strong>10MB</strong></p>
          <p>• Posters: <strong>800×1000px</strong> recommended (4:5 ratio), Max <strong>10MB</strong></p>
          <p>• Supported formats: JPG, PNG, WebP</p>
        </div>
      </div>

      <SliderManager slides={slides} onSave={async (newSlides) => {
        await updateSetting.mutateAsync({ key: 'hero_slides', value: JSON.stringify(newSlides) });
        toast.success('Slider updated!');
      }} />

      <PosterManager posters={posters} onSave={async (newPosters) => {
        await updateSetting.mutateAsync({ key: 'homepage_posters', value: JSON.stringify(newPosters) });
        toast.success('Posters updated!');
      }} />
    </div>
  );
};

type SlideType = { image: string; mobileImage?: string; title: string; topText: string; bottomText: string };
type PosterType = { image: string; link: string; subtitle: string; title: string };

const SliderManager = ({ slides, onSave }: {
  slides: SlideType[];
  onSave: (slides: SlideType[]) => Promise<void>;
}) => {
  const [items, setItems] = useState<SlideType[]>(slides);
  const [saving, setSaving] = useState(false);

  // Always sync from DB when slides change
  useEffect(() => {
    setItems(slides);
  }, [JSON.stringify(slides)]);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(items); } finally { setSaving(false); }
  };

  const addSlide = () => {
    setItems([...items, { image: '', title: '', topText: '', bottomText: '' }]);
  };

  const removeSlide = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateSlide = (index: number, field: string, value: string) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  return (
    <div className="border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium tracking-wider uppercase">Hero Slider</h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            {items.length} slide configured • Slide মুছে দিয়ে নতুন upload করুন
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={addSlide} className="luxury-button-outline text-[10px] py-2 px-3">+ Add Slide</button>
          <button onClick={handleSave} disabled={saving} className="luxury-button-primary text-[10px] py-2 px-3 inline-flex items-center gap-1.5">
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
            Save
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">No slides configured. Default slides will be used.</p>
      )}

      {items.map((slide, i) => (
        <div key={i} className="border border-border p-4 space-y-3 relative">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Slide {i + 1}</p>
            <button onClick={() => removeSlide(i)} className="inline-flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-2 py-1 transition-colors">
              <Trash2 size={12} /> Delete
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Image (1920×1080, max 10MB)</label>
              <HomepageImageUpload value={slide.image} onChange={(url) => updateSlide(i, 'image', url)} folder="hero" />
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Title</label>
                <input value={slide.title} onChange={e => updateSlide(i, 'title', e.target.value)} className="luxury-input text-xs" placeholder="e.g. Elegance" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Text</label>
                <textarea value={slide.topText} onChange={e => updateSlide(i, 'topText', e.target.value)} className="luxury-input text-xs min-h-[50px]" placeholder="Top text..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Bottom Text</label>
                <textarea value={slide.bottomText} onChange={e => updateSlide(i, 'bottomText', e.target.value)} className="luxury-input text-xs min-h-[50px]" placeholder="Bottom text..." />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const PosterManager = ({ posters, onSave }: {
  posters: PosterType[];
  onSave: (posters: PosterType[]) => Promise<void>;
}) => {
  const [items, setItems] = useState<PosterType[]>(posters);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (posters.length > 0) setItems(posters);
  }, [JSON.stringify(posters)]);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(items); } finally { setSaving(false); }
  };

  const updatePoster = (index: number, field: string, value: string) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  return (
    <div className="border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium tracking-wider uppercase">Homepage Posters</h3>
          <p className="text-[10px] text-muted-foreground mt-1">পুরানো ছবি মুছে নতুন upload করুন</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="luxury-button-primary text-[10px] py-2 px-3 inline-flex items-center gap-1.5">
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
          Save
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((poster, i) => (
          <div key={i} className="border border-border p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Poster {i + 1}</p>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Image (800×1000, max 10MB)</label>
              <HomepageImageUpload value={poster.image} onChange={(url) => updatePoster(i, 'image', url)} folder="poster" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Subtitle</label>
              <input value={poster.subtitle} onChange={e => updatePoster(i, 'subtitle', e.target.value)} className="luxury-input text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Title</label>
              <input value={poster.title} onChange={e => updatePoster(i, 'title', e.target.value)} className="luxury-input text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Link</label>
              <input value={poster.link} onChange={e => updatePoster(i, 'link', e.target.value)} className="luxury-input text-xs" placeholder="e.g. /?category=Shirts" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HomepageImageUpload = ({ value, onChange, folder }: { value: string; onChange: (url: string) => void; folder: string }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('শুধুমাত্র image file দিন (JPG, PNG, WebP)'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB! আপনার ছবি ' + (file.size / (1024 * 1024)).toFixed(1) + 'MB'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `homepage/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      onChange(publicUrl);
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = () => {
    onChange('');
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
      {value ? (
        <div className="space-y-2">
          <div className="relative inline-block">
            <img src={value} alt="" className="w-full max-w-[280px] h-36 object-cover border border-border" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleDelete} className="inline-flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-2 py-1 border border-destructive/30 transition-colors">
              <Trash2 size={11} /> Delete Image
            </button>
            <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 border border-border transition-colors">
              <Upload size={11} /> Replace
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="w-full max-w-[280px] h-36 border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-foreground/50 transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="text-muted-foreground mb-1.5 animate-spin" />
              <span className="text-[10px] text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={20} className="text-muted-foreground mb-1.5" />
              <span className="text-[10px] text-muted-foreground">Click to upload</span>
              <span className="text-[9px] text-muted-foreground/60 mt-0.5">JPG, PNG, WebP • Max 10MB</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminHomepage;
