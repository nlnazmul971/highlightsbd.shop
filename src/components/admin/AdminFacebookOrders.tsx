import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrders, useProducts, useDeliveryZones, useCoupons } from '@/hooks/useSupabase';
import { Facebook, Plus, Trash2, Loader2, Search, Tag, MapPin } from 'lucide-react';
import { toast } from 'sonner';

type OrderItem = {
  product_id?: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image_url?: string;
};

const emptyItem: OrderItem = { name: '', size: '', color: '', quantity: 1, price: 0 };

const AdminFacebookOrders = () => {
  const { data: orders = [], refetch } = useOrders();
  const { data: products = [] } = useProducts();
  const { data: deliveryZones = [] } = useDeliveryZones(false);
  const { data: coupons = [] } = useCoupons();
  const fbOrders = orders.filter((o: any) => o.source === 'facebook');

  const activeCoupons = useMemo(() => (coupons as any[]).filter((c: any) => c.is_active), [coupons]);
  const activeZones = useMemo(() => (deliveryZones as any[]).filter((z: any) => z.is_active), [deliveryZones]);

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
  const [items, setItems] = useState<OrderItem[]>([{ ...emptyItem }]);
  const [submitting, setSubmitting] = useState(false);
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState('');
  const [selectedZone, setSelectedZone] = useState('');

  // Product search filtering
  const getFilteredProducts = (query: string) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return (products as any[]).filter((p: any) =>
      p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    ).slice(0, 8);
  };

  const selectProduct = (idx: number, product: any) => {
    setItems(prev => prev.map((item, i) => i === idx ? {
      ...item,
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      size: product.sizes?.[0] || '',
      color: product.colors?.[0]?.name || '',
    } : item));
    setSearchQueries(prev => ({ ...prev, [idx]: '' }));
    setActiveSearchIdx(null);
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems(prev => [...prev, { ...emptyItem }]);
  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    setSearchQueries(prev => { const n = { ...prev }; delete n[idx]; return n; });
  };

  // Apply coupon
  const applyCoupon = (couponId: string) => {
    setSelectedCoupon(couponId);
    if (!couponId) {
      setForm(prev => ({ ...prev, discount: 0 }));
      return;
    }
    const coupon = activeCoupons.find((c: any) => c.id === couponId);
    if (!coupon) return;

    const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    if (subtotal < (coupon as any).min_order_amount) {
      toast.error(`Minimum order ৳${(coupon as any).min_order_amount} required for this coupon`);
      setSelectedCoupon('');
      return;
    }

    let discount = 0;
    if ((coupon as any).discount_type === 'percentage') {
      discount = Math.round(subtotal * (coupon as any).discount_value / 100);
    } else {
      discount = (coupon as any).discount_value;
    }
    setForm(prev => ({ ...prev, discount }));
  };

  // Apply delivery zone
  const applyZone = (zoneId: string) => {
    setSelectedZone(zoneId);
    if (!zoneId) {
      setForm(prev => ({ ...prev, delivery_charge: 0 }));
      return;
    }
    const zone = activeZones.find((z: any) => z.id === zoneId);
    if (zone) {
      setForm(prev => ({ ...prev, delivery_charge: (zone as any).fee, customer_city: (zone as any).name }));
    }
  };

  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const total = Math.max(0, subtotal - form.discount + form.delivery_charge);

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
      setSelectedCoupon('');
      setSelectedZone('');
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
          <p className="text-xs text-muted-foreground">Manually enter orders from Facebook — select products from your store</p>
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
          <input value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} placeholder="Full Address *" className="luxury-input text-sm" required />
          <textarea value={form.customer_note} onChange={e => setForm({ ...form, customer_note: e.target.value })} placeholder="Customer Note (optional)" className="luxury-input text-sm sm:col-span-2" rows={2} />
        </div>

        {/* Items with Product Search */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-1">
              <Search size={12} /> Items — Search & Select Products
            </span>
            <button type="button" onClick={addItem} className="luxury-button-outline text-[10px] px-3 py-1.5 flex items-center gap-1">
              <Plus size={12} /> Add Item
            </button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="border border-border/50 p-3 space-y-2 relative">
              {/* Product Search */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  {item.image_url && (
                    <img src={item.image_url} alt="" className="w-10 h-10 object-cover rounded border border-border" />
                  )}
                  <div className="flex-1 relative">
                    <input
                      value={searchQueries[idx] ?? ''}
                      onChange={e => {
                        setSearchQueries(prev => ({ ...prev, [idx]: e.target.value }));
                        setActiveSearchIdx(idx);
                      }}
                      onFocus={() => setActiveSearchIdx(idx)}
                      placeholder={item.name ? `✓ ${item.name}` : 'Search product by name, SKU...'}
                      className="luxury-input text-sm w-full pl-8"
                    />
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Search Dropdown */}
                {activeSearchIdx === idx && (searchQueries[idx] ?? '').length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-background border border-border rounded shadow-lg max-h-48 overflow-y-auto">
                    {getFilteredProducts(searchQueries[idx] ?? '').length === 0 ? (
                      <p className="p-3 text-xs text-muted-foreground">No products found</p>
                    ) : (
                      getFilteredProducts(searchQueries[idx] ?? '').map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectProduct(idx, p)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-accent/50 transition text-left"
                        >
                          <img src={p.image_url} alt="" className="w-8 h-8 object-cover rounded border border-border" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">{p.sku} • {p.category} • Stock: {p.stock}</p>
                          </div>
                          <span className="text-xs font-medium text-primary">৳{p.price}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Size, Color, Qty, Price row */}
              <div className="grid grid-cols-4 gap-2">
                {item.product_id && (products as any[]).find((p: any) => p.id === item.product_id)?.sizes?.length > 0 ? (
                  <select value={item.size} onChange={e => updateItem(idx, 'size', e.target.value)} className="luxury-input text-xs">
                    <option value="">Size</option>
                    {(products as any[]).find((p: any) => p.id === item.product_id)?.sizes?.map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <input value={item.size} onChange={e => updateItem(idx, 'size', e.target.value)} placeholder="Size" className="luxury-input text-xs" />
                )}

                {item.product_id && (products as any[]).find((p: any) => p.id === item.product_id)?.colors?.length > 0 ? (
                  <select value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)} className="luxury-input text-xs">
                    <option value="">Color</option>
                    {(products as any[]).find((p: any) => p.id === item.product_id)?.colors?.map((c: any) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)} placeholder="Color" className="luxury-input text-xs" />
                )}

                <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} min={1} className="luxury-input text-xs" placeholder="Qty" />
                <input type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseInt(e.target.value) || 0)} min={0} placeholder="Price ৳" className="luxury-input text-xs" />
              </div>

              {item.name && (
                <p className="text-[10px] text-muted-foreground">
                  {item.name} — ৳{item.price} × {item.quantity} = ৳{(item.price * item.quantity).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Delivery Zone & Coupon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Delivery Zone */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-1">
              <MapPin size={10} /> Delivery Zone
            </label>
            <select
              value={selectedZone}
              onChange={e => applyZone(e.target.value)}
              className="luxury-input text-sm w-full"
            >
              <option value="">Select Delivery Zone</option>
              {activeZones.map((zone: any) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} — ৳{zone.fee}
                </option>
              ))}
            </select>
          </div>

          {/* Coupon */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-1">
              <Tag size={10} /> Coupon / Discount
            </label>
            <select
              value={selectedCoupon}
              onChange={e => applyCoupon(e.target.value)}
              className="luxury-input text-sm w-full"
            >
              <option value="">No Coupon</option>
              {activeCoupons.map((coupon: any) => (
                <option key={coupon.id} value={coupon.id}>
                  {coupon.code} — {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `৳${coupon.discount_value}`} off
                  {coupon.min_order_amount > 0 ? ` (min ৳${coupon.min_order_amount})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment & Delivery Method */}
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
            {form.discount > 0 && <p className="text-xs text-green-600">Discount: -৳{form.discount.toLocaleString()}</p>}
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
