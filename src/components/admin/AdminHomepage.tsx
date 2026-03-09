import { useState, useRef, useEffect } from 'react';
import { useStoreSettings, useUpdateStoreSetting } from '@/hooks/useSupabase';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminHomepage = () => {
  const { data: settings = {} } = useStoreSettings();
  const updateSetting = useUpdateStoreSetting();

  // Slider slides (stored as JSON in store_settings key "hero_slides")
  const rawSlides = settings['hero_slides'];
  const slides: { image: string; title: string; topText: string; bottomText: string }[] = rawSlides
    ? JSON.parse(rawSlides)
    : [];

  // Posters (stored as JSON in store_settings key "homepage_posters")  
  const rawPosters = settings['homepage_posters'];
  const posters: { image: string; link: string; subtitle: string; title: string }[] = rawPosters
    ? JSON.parse(rawPosters)
    : [];

  return (
    <div className="space-y-8">
      <SliderManager slides={slides} onSave={async (newSlides) => {
        await updateSetting.mutateAsync({ key: 'hero_slides', value: JSON.stringify(newSlides) });
        toast.success('Slider updated');
      }} />

      <PosterManager posters={posters} onSave={async (newPosters) => {
        await updateSetting.mutateAsync({ key: 'homepage_posters', value: JSON.stringify(newPosters) });
        toast.success('Posters updated');
      }} />
    </div>
  );
};

const SliderManager = ({ slides, onSave }: {
  slides: { image: string; title: string; topText: string; bottomText: string }[];
  onSave: (slides: any[]) => Promise<void>;
}) => {
  const [items, setItems] = useState(slides);

  // Sync when settings load
  useEffect(() => {
    if (slides.length > 0 && items.length === 0) setItems(slides);
  }, [slides]);
  const [saving, setSaving] = useState(false);

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
        <h3 className="text-sm font-medium tracking-wider uppercase">Hero Slider</h3>
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
          <button onClick={() => removeSlide(i)} className="absolute top-2 right-2 p-1 hover:bg-destructive/10 text-destructive transition-colors">
            <X size={14} />
          </button>
          <p className="text-xs text-muted-foreground">Slide {i + 1}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Image</label>
              <SlideImageUpload value={slide.image} onChange={(url) => updateSlide(i, 'image', url)} />
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Title</label>
                <input value={slide.title} onChange={e => updateSlide(i, 'title', e.target.value)} className="luxury-input text-xs" placeholder="e.g. Elegance" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Text</label>
                <textarea value={slide.topText} onChange={e => updateSlide(i, 'topText', e.target.value)} className="luxury-input text-xs min-h-[50px]" placeholder="Poetic top text..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Bottom Text</label>
                <textarea value={slide.bottomText} onChange={e => updateSlide(i, 'bottomText', e.target.value)} className="luxury-input text-xs min-h-[50px]" placeholder="Poetic bottom text..." />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const PosterManager = ({ posters, onSave }: {
  posters: { image: string; link: string; subtitle: string; title: string }[];
  onSave: (posters: any[]) => Promise<void>;
}) => {
  const [items, setItems] = useState(posters.length > 0 ? posters : [
    { image: '', link: '/?category=New+Dropped', subtitle: 'New Season', title: 'The Art of Dressing' },
    { image: '', link: '/?category=Shirts', subtitle: 'Campaign 2026', title: 'Walk Together' },
  ]);

  // Sync when settings load
  useEffect(() => {
    if (posters.length > 0 && items.length === 0) setItems(posters);
  }, [posters]);

  const [saving, setSaving] = useState(false);

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
        <h3 className="text-sm font-medium tracking-wider uppercase">Homepage Posters</h3>
        <button onClick={handleSave} disabled={saving} className="luxury-button-primary text-[10px] py-2 px-3 inline-flex items-center gap-1.5">
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
          Save
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((poster, i) => (
          <div key={i} className="border border-border p-4 space-y-3">
            <p className="text-xs text-muted-foreground">Poster {i + 1}</p>
            <SlideImageUpload value={poster.image} onChange={(url) => updatePoster(i, 'image', url)} />
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

const SlideImageUpload = ({ value, onChange }: { value: string; onChange: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `homepage/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      onChange(publicUrl);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="w-full max-w-[200px] h-28 object-cover border border-border" />
          <button onClick={() => onChange('')} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
            <X size={10} />
          </button>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} className="w-full max-w-[200px] h-28 border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-foreground/50 transition-colors">
          <Upload size={16} className="text-muted-foreground mb-1" />
          <span className="text-[10px] text-muted-foreground">{uploading ? 'Uploading...' : 'Upload'}</span>
        </div>
      )}
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Or paste URL" className="luxury-input text-[10px] mt-1.5" />
    </div>
  );
};

export default AdminHomepage;
