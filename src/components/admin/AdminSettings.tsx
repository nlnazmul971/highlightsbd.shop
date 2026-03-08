import { Settings } from 'lucide-react';

const AdminSettings = () => {
  return (
    <div className="space-y-8 max-w-2xl">
      <div className="border border-border p-6 space-y-4">
        <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Store Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Store Name</label>
            <input defaultValue="LUXE" className="luxury-input" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Currency</label>
            <input defaultValue="৳ (BDT)" className="luxury-input" disabled />
          </div>
          <div>
            <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Delivery Charge (Standard)</label>
            <input type="number" defaultValue={80} className="luxury-input" />
          </div>
        </div>
      </div>

      <div className="border border-border p-6 space-y-4">
        <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Categories</h3>
        <div className="flex flex-wrap gap-2">
          {['T-Shirt', 'Winter', 'Shirts', 'Knit Polos', 'Pant', 'Panjabi', 'Kafsu'].map(c => (
            <span key={c} className="luxury-badge">{c}</span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Category management coming soon</p>
      </div>

      <div className="border border-border p-6 space-y-3 opacity-60">
        <div className="flex items-center gap-2">
          <Settings size={16} />
          <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Advanced</h3>
        </div>
        <p className="text-xs text-muted-foreground">Advanced store configuration and integrations will be available here.</p>
      </div>
    </div>
  );
};

export default AdminSettings;
