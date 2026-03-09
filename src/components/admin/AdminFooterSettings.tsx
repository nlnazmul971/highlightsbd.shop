import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings, useUpdateStoreSetting } from '@/hooks/useSupabase';

const FOOTER_FIELDS = [
  { key: 'footer_brand_name', label: 'Brand Name', placeholder: 'HIGHLIGHTS' },
  { key: 'footer_address', label: 'Address', placeholder: 'Your store address' },
  { key: 'footer_phone', label: 'Phone', placeholder: '+880 1234 567890' },
  { key: 'footer_email', label: 'Email', placeholder: 'info@example.com' },
  { key: 'footer_facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
  { key: 'footer_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/...' },
  { key: 'footer_messenger', label: 'Messenger Link', placeholder: 'https://m.me/yourpage' },
  { key: 'footer_whatsapp', label: 'WhatsApp Link', placeholder: 'https://wa.me/8801XXXXXXXXX' },
  { key: 'footer_copyright', label: 'Copyright Text', placeholder: '© 2026 HIGHLIGHTS. All rights reserved.' },
];

const AdminFooterSettings = () => {
  const { data: settings, isLoading } = useStoreSettings();
  const updateSetting = useUpdateStoreSetting();
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      setEdits(prev => {
        const next = { ...prev };
        for (const f of FOOTER_FIELDS) {
          if (!(f.key in next)) next[f.key] = settings[f.key] || '';
        }
        return next;
      });
    }
  }, [settings]);

  const handleSave = async (key: string) => {
    try {
      await updateSetting.mutateAsync({ key, value: edits[key] || '' });
      toast.success('Footer setting updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  const handleSaveAll = async () => {
    try {
      for (const f of FOOTER_FIELDS) {
        await updateSetting.mutateAsync({ key: f.key, value: edits[f.key] || '' });
      }
      toast.success('All footer settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading footer settings...
      </div>
    );
  }

  return (
    <div className="border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            Footer Settings
          </h3>
          <p className="text-xs text-muted-foreground">Website এর Footer এ যা দেখায় সব এখান থেকে edit করুন।</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={updateSetting.isPending}
          className="luxury-button-primary inline-flex items-center gap-2 text-[10px]"
        >
          {updateSetting.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FOOTER_FIELDS.map(f => (
          <div key={f.key}>
            <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">{f.label}</label>
            <div className="flex gap-2">
              <input
                value={edits[f.key] || ''}
                onChange={e => setEdits(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="luxury-input flex-1"
                placeholder={f.placeholder}
              />
              <button
                onClick={() => handleSave(f.key)}
                disabled={updateSetting.isPending}
                className="luxury-button-primary inline-flex items-center gap-1 text-[10px] px-3"
              >
                <Save size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminFooterSettings;
