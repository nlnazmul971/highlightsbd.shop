import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrders } from '@/hooks/useSupabase';
import { Facebook, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyItem = { name: '', size: '', color: '', quantity: 1, price: 0 };

const AdminFacebookOrders = () => {
  const { data: orders = [], refetch } = useOrders();
  const fbOrders = orders.filter((o: any) => o.source === 'facebook');

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    customer_city: '',
    customer_note: '',
    delivery_method: 'standard',
    payment_method: 'cod',
    delivery_charge: 0,
    discount: 0,
  });
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [submitting, setSubmitting] = useState(false);

  const updateItem = (idx: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems(prev => [...prev, { ...emptyItem }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const total = subtotal - form.discount + form.delivery_charge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.customer_address.trim() || !form.customer_city.trim()) {
      toast.error('Please fill in all required customer fields');
      return;
    }
    if (items.length === 0 || items.some(i => !i.name.trim() || i.price <= 0)) {
      toast.error('Please add at least one item with name and price');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('orders').insert({
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || null,
        customer_address: form.customer_address,
        customer_city: form.customer_city,
        customer_note: form.customer_note || null,
        delivery_method: form.delivery_method,
        payment_method: form.payment_method,
        delivery_charge: form.delivery_charge,
        discount: form.discount,
        total,
        items: items as any,
        source: 'facebook',
        status: 'Pending',
      });

      if (error) throw error;

      toast.success('Facebook order created successfully!');
      setForm({
        customer_name: '', customer_phone: '', customer_email: '',
        customer_address: '', customer_city: '', customer_note: '',
        delivery_method: 'standard', payment_method: 'cod',
        delivery_charge: 0, discount: 0,
      });
      setItems([{ ...emptyItem }]);
      refetch();
    } catch (err: any) {
      toast.error('Failed to create order: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded bg-primary/10">
          <Facebook className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Facebook Orders</h2>
          <p className="text-xs text-muted-foreground">Manually enter orders from Facebook</p>
        </div>
      </div>

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="border border-border p-5 space-y-5">
        <h3 className="text-sm font-medium tracking-wider uppercase text-muted-foreground">New Facebook Order</h3>

        {/* Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="Customer Name *" className="luxury-input text-sm" required />
          <input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} placeholder="Phone *" className="luxury-input text-sm" required />
          <input value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} placeholder="Email (optional)" className="luxury-input text-sm" type="email" />
          <input value={form.customer_city} onChange={e => setForm({ ...form, customer_city: e.target.value })} placeholder="City *" className="luxury-input text-sm" required />
          <input value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} placeholder="Full Address *" className="luxury-input text-sm sm:col-span-2" required />
          <textarea value={form.customer_note} onChange={e => setForm({ ...form, customer_note: e.target.value })} placeholder="Customer Note (optional)" className="luxury-input text-sm sm:col-span-2" rows={2} />
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Items</span>
            <button type="button" onClick={addItem} className="luxury-button-outline text-[10px] px-3 py-1.5 flex items-center gap-1">
              <Plus size={12} /> Add Item
            </button>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_80px_80px_80px_80px_32px] gap-2 items-center">
              <input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="Product Name" className="luxury-input text-sm" required />
              <input value={item.size} onChange={e => updateItem(idx, 'size', e.target.value)} placeholder="Size" className="luxury-input text-sm" />
              <input value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)} placeholder="Color" className="luxury-input text-sm" />
              <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} min={1} className="luxury-input text-sm" />
              <input type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseInt(e.target.value) || 0)} min={0} placeholder="Price" className="luxury-input text-sm" required />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(idx)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Payment & Delivery */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className="luxury-input text-sm">
            <option value="cod">Cash on Delivery</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
          </select>
          <select value={form.delivery_method} onChange={e => setForm({ ...form, delivery_method: e.target.value })} className="luxury-input text-sm">
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
          <input type="number" value={form.delivery_charge} onChange={e => setForm({ ...form, delivery_charge: parseInt(e.target.value) || 0 })} min={0} placeholder="Delivery ৳" className="luxury-input text-sm" />
          <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: parseInt(e.target.value) || 0 })} min={0} placeholder="Discount ৳" className="luxury-input text-sm" />
        </div>

        {/* Total & Submit */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Subtotal: ৳{subtotal.toLocaleString()}</p>
            {form.discount > 0 && <p className="text-xs text-muted-foreground">Discount: -৳{form.discount.toLocaleString()}</p>}
            {form.delivery_charge > 0 && <p className="text-xs text-muted-foreground">Delivery: ৳{form.delivery_charge.toLocaleString()}</p>}
            <p className="text-sm font-medium">Total: ৳{total.toLocaleString()}</p>
          </div>
          <button type="submit" disabled={submitting} className="luxury-button-primary flex items-center gap-2">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Facebook size={14} />}
            {submitting ? 'Creating...' : 'Create FB Order'}
          </button>
        </div>
      </form>

      {/* Recent FB Orders */}
      <div>
        <h3 className="text-sm font-medium tracking-wider uppercase text-muted-foreground mb-3">Recent Facebook Orders ({fbOrders.length})</h3>
        {fbOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Facebook orders yet</p>
        ) : (
          <div className="space-y-2">
            {fbOrders.slice(0, 20).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between border border-border p-3">
                <div>
                  <p className="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{order.customer_name} • {order.customer_phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">৳{order.total.toLocaleString()}</p>
                  <span className={`luxury-badge text-[8px] ${order.status === 'Cancelled' || order.status === 'Returned' ? 'bg-destructive/10 text-destructive' : ''}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFacebookOrders;
