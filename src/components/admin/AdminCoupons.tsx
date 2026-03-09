import { useState } from 'react';
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, CouponRow } from '@/hooks/useSupabase';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';

const empty = { name: '', code: '', discount_type: 'fixed' as const, discount_value: 0, min_order_amount: 0, max_uses: null as number | null, is_active: true };

const AdminCoupons = () => {
  const { data: coupons = [], isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const [editing, setEditing] = useState<CouponRow | null>(null);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error('Coupon code is required'); return; }
    if (form.discount_value <= 0) { toast.error('Discount value must be greater than 0'); return; }
    try {
      const payload = { ...form, code: form.code.toUpperCase().trim() };
      if (editing) {
        await updateCoupon.mutateAsync({ id: editing.id, ...payload });
        toast.success('Coupon updated');
      } else {
        await createCoupon.mutateAsync(payload);
        toast.success('Coupon created');
      }
      setForm(empty); setEditing(null); setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save coupon');
    }
  };

  const handleEdit = (c: CouponRow) => {
    setEditing(c);
    setForm({ name: c.name, code: c.code, discount_type: c.discount_type, discount_value: c.discount_value, min_order_amount: c.min_order_amount, max_uses: c.max_uses, is_active: c.is_active });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try { await deleteCoupon.mutateAsync(id); toast.success('Coupon deleted'); } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium flex items-center gap-2"><Tag className="h-5 w-5" /> Coupons</h2>
        <button onClick={() => { setForm(empty); setEditing(null); setShowForm(!showForm); }} className="luxury-button-primary text-xs flex items-center gap-1">
          <Plus className="h-3 w-3" /> Add Coupon
        </button>
      </div>

      {showForm && (
        <div className="border border-border p-4 space-y-3 bg-secondary/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Coupon Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer Sale" className="luxury-input" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Code *</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE20" className="luxury-input uppercase" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Discount Type</label>
              <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value as any })} className="luxury-input">
                <option value="fixed">Fixed (৳)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Discount Value *</label>
              <input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })} className="luxury-input" min={0} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Min Order Amount (৳)</label>
              <input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: Number(e.target.value) })} className="luxury-input" min={0} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Max Uses (empty = unlimited)</label>
              <input type="number" value={form.max_uses ?? ''} onChange={e => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })} className="luxury-input" min={0} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="accent-foreground" />
            Active
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} className="luxury-button-primary text-xs">{editing ? 'Update' : 'Create'}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="luxury-button-outline text-xs">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-2">Name</th>
                <th className="py-2 px-2">Code</th>
                <th className="py-2 px-2">Discount</th>
                <th className="py-2 px-2">Min Order</th>
                <th className="py-2 px-2">Uses</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2 px-2">{c.name || '-'}</td>
                  <td className="py-2 px-2 font-mono font-semibold">{c.code}</td>
                  <td className="py-2 px-2">{c.discount_type === 'fixed' ? `৳${c.discount_value}` : `${c.discount_value}%`}</td>
                  <td className="py-2 px-2">৳{c.min_order_amount}</td>
                  <td className="py-2 px-2">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                  <td className="py-2 px-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-2 flex gap-1">
                    <button onClick={() => handleEdit(c)} className="p-1 hover:text-foreground text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1 hover:text-destructive text-muted-foreground"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={7} className="py-4 text-center text-muted-foreground">No coupons yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
