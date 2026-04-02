import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrders, useProducts, useDeliveryZones, useCoupons } from '@/hooks/useSupabase';
import { Facebook, Plus, Trash2, Loader2, Search, Tag, MapPin, Package, CheckCircle, XCircle } from 'lucide-react';
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

  const defaultZones = [
    { id: 'inside-dhaka', name: 'Inside Dhaka', fee: 70, description: 'Dhaka city area' },
    { id: 'sub-urban-dhaka', name: 'Sub - Urban Dhaka', fee: 90, description: 'Ashulia, Keraniganj, Savar, etc.' },
    { id: 'outside-dhaka', name: 'Outside Dhaka', fee: 110, description: 'All districts outside Dhaka' }
  ];

  const activeZones = deliveryZones.length > 0 ? (deliveryZones as any[]).filter((z: any) => z.is_active) : defaultZones;

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
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState('');

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (i.price * i.quantity), 0), [items]);

  // Re-calculate coupon discount when subtotal changes
  useEffect(() => {
    if (couponApplied) {
      let disc = 0;
      if (subtotal >= couponApplied.min_order_amount) {
        disc = couponApplied.discount_type === 'percentage'
          ? Math.round(subtotal * couponApplied.discount_value / 100)
          : couponApplied.discount_value;
      }
      setForm(prev => ({ ...prev, discount: disc }));
    }
  }, [subtotal, couponApplied]);

  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    const found = activeCoupons.find((c: any) => c.code === couponCode.trim().toUpperCase());
    if (!found) {
      toast.error('Invalid or inactive coupon code');
      return;
    }
    if (found.max_uses && found.used_count >= found.max_uses) {
      toast.error('This coupon has reached maximum usage');
      return;
    }
    if (subtotal < found.min_order_amount) {
      toast.error(`Minimum order ৳${found.min_order_amount} required for this coupon`);
      return;
    }
    setCouponApplied(found);
    let disc = found.discount_type === 'percentage'
      ? Math.round(subtotal * found.discount_value / 100)
      : found.discount_value;
    setForm(prev => ({ ...prev, discount: disc }));
    toast.success(`Coupon "${found.code}" applied! Discount: ৳${disc}`);
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    setForm(prev => ({ ...prev, discount: 0 }));
  };

  const applyZone = (zoneId: string) => {
    setSelectedZone(zoneId);
    const zone = activeZones.find((z: any) => z.id === zoneId);
    if (zone) {
      setForm(prev => ({ ...prev, delivery_charge: zone.fee, customer_city: zone.name }));
    } else {
      setForm(prev => ({ ...prev, delivery_charge: 0 }));
    }
  };

  const total = Math.max(0, subtotal - form.discount + form.delivery_charge);

  const getFilteredProducts = (query: string) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return (products as any[]).filter((p: any) =>
      p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
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
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.customer_address.trim() || !form.customer_city.trim()) {
      toast.error('Please fill in Name, Phone, Address and Select a Delivery Zone');
      return;
    }
    if (items.some(i => !i.name.trim() || i.price <= 0)) {
      toast.error('Please select products with valid prices');
      return;
    }

    setSubmitting(true);
    try {
      const { data: orderData, error } = await supabase.from('orders').insert({
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
      }).select().single();

      if (error) throw error;

      // Deduct stock for each item
      for (const item of items) {
        if (item.product_id && item.size) {
          const { data: existing } = await supabase.from('product_size_stock')
            .select('*').eq('product_id', item.product_id).eq('size', item.size).maybeSingle();
          if (existing) {
            await supabase.from('product_size_stock').update({
              sold_count: (existing as any).sold_count + item.quantity
            } as any).eq('id', (existing as any).id);
          }
          await supabase.from('stock_logs').insert({
            product_id: item.product_id, size: item.size,
            change_type: 'sold', quantity: item.quantity,
            order_id: orderData?.id, notes: 'Facebook order',
          });
        }
      }

      toast.success('Facebook order created successfully!');
      setForm({
        customer_name: '', customer_phone: '', customer_email: '',
        customer_address: '', customer_city: '', customer_note: '',
        delivery_method: 'standard', payment_method: 'cod',
        delivery_charge: 0, discount: 0,
      });
      setItems([{ ...emptyItem }]);
      setCouponCode('');
      setCouponApplied(null);
      setSelectedZone('');
      refetch();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Facebook className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-light tracking-wide">Facebook Order Entry</h2>
      </div>

      <form onSubmit={handleSubmit} className="border border-border p-6 space-y-6 bg-card">
        {/* Customer Section */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Customer Information</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="Customer Name *" className="luxury-input" required />
            <input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} placeholder="Phone Number *" className="luxury-input" required />
            <input value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} placeholder="Email (Optional)" className="luxury-input" />
            <input value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} placeholder="Full Address *" className="luxury-input" required />
            <textarea value={form.customer_note} onChange={e => setForm({ ...form, customer_note: e.target.value })} placeholder="Special Instructions (Optional)" className="luxury-input md:col-span-2" rows={2} />
          </div>
        </div>

        {/* Order Items - Enhanced UI */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
              <Package size={13} /> Order Items
            </p>
            <button type="button" onClick={addItem} className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-3 py-1.5 hover:bg-primary/90 transition-colors">
              <Plus size={12} /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border border-border bg-background p-4 relative group">
                {/* Product search */}
                <div className="relative mb-3">
                  <div className="flex items-center gap-2">
                    <Search size={14} className="text-muted-foreground" />
                    <input
                      value={searchQueries[idx] ?? ''}
                      onChange={e => {
                        setSearchQueries(prev => ({ ...prev, [idx]: e.target.value }));
                        setActiveSearchIdx(idx);
                      }}
                      onFocus={() => setActiveSearchIdx(idx)}
                      placeholder="Search product by name or SKU..."
                      className="luxury-input flex-1 text-sm"
                    />
                  </div>
                  {activeSearchIdx === idx && searchQueries[idx] && (
                    <div className="absolute z-20 left-0 right-0 bg-background border border-border shadow-lg max-h-48 overflow-auto mt-1">
                      {getFilteredProducts(searchQueries[idx] || '').map((p: any) => (
                        <div key={p.id} onClick={() => selectProduct(idx, p)} className="p-2.5 hover:bg-accent cursor-pointer flex items-center gap-3 border-b border-border last:border-0">
                          {p.image_url && <img src={p.image_url} alt="" className="w-10 h-10 object-cover rounded" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">SKU: {p.sku || '—'} | Stock: {p.stock}</p>
                          </div>
                          <span className="text-sm font-bold whitespace-nowrap">৳{p.price}</span>
                        </div>
                      ))}
                      {getFilteredProducts(searchQueries[idx] || '').length === 0 && (
                        <p className="p-3 text-xs text-muted-foreground text-center">No products found</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected product display */}
                {item.name && (
                  <div className="flex items-center gap-3 mb-3 p-2 bg-accent/30 rounded">
                    {item.image_url && <img src={item.image_url} alt="" className="w-12 h-12 object-cover rounded" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">৳{item.price} each</p>
                    </div>
                  </div>
                )}

                {/* Item details grid */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] uppercase text-muted-foreground tracking-wider block mb-1">Size</label>
                    <input value={item.size} onChange={e => updateItem(idx, 'size', e.target.value)} placeholder="S/M/L/XL" className="luxury-input text-xs w-full" />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase text-muted-foreground tracking-wider block mb-1">Color</label>
                    <input value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)} placeholder="Color" className="luxury-input text-xs w-full" />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase text-muted-foreground tracking-wider block mb-1">Qty</label>
                    <input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="luxury-input text-xs w-full" />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase text-muted-foreground tracking-wider block mb-1">Price</label>
                    <input type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseInt(e.target.value) || 0)} className="luxury-input text-xs w-full" />
                  </div>
                </div>

                {/* Item subtotal */}
                <div className="text-right mt-2">
                  <span className="text-xs text-muted-foreground">Subtotal: </span>
                  <span className="text-sm font-bold">৳{(item.price * item.quantity).toLocaleString()}</span>
                </div>

                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="absolute top-2 right-2 p-1 text-destructive hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Zone & Coupon Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
          {/* Delivery Zone */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
              <MapPin size={13} /> Delivery Zone
            </p>
            <div className="space-y-2">
              {activeZones.map((zone: any) => (
                <div
                  key={zone.id}
                  onClick={() => applyZone(zone.id)}
                  className={`p-3 border cursor-pointer flex justify-between items-center transition-all ${selectedZone === zone.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-muted-foreground/40'}`}
                >
                  <div>
                    <p className="text-sm font-medium">{zone.name}</p>
                    <p className="text-[10px] text-muted-foreground">{zone.description}</p>
                  </div>
                  <span className="font-bold text-sm">৳{zone.fee}</span>
                </div>
              ))}
            </div>
            <input value={form.customer_city} onChange={e => setForm({ ...form, customer_city: e.target.value })} placeholder="City (auto-set by zone)" className="luxury-input text-xs mt-2" />
          </div>

          {/* Coupon & Summary */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
              <Tag size={13} /> Coupon & Discount
            </p>

            {couponApplied ? (
              <div className="flex items-center justify-between p-3 border border-green-500/30 bg-green-50 dark:bg-green-900/10 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{couponApplied.code}</p>
                    <p className="text-[10px] text-green-600/70">
                      {couponApplied.discount_type === 'percentage' ? `${couponApplied.discount_value}% off` : `৳${couponApplied.discount_value} off`}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={removeCoupon} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                  <XCircle size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  placeholder="Enter coupon code..."
                  className="luxury-input flex-1 text-sm"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                />
                <button type="button" onClick={applyCoupon} className="luxury-button-outline text-xs px-4">Apply</button>
              </div>
            )}

            {/* Manual discount override */}
            <div>
              <label className="text-[9px] uppercase text-muted-foreground tracking-wider block mb-1">Manual Discount (৳)</label>
              <input type="number" value={form.discount} onChange={e => { setForm(prev => ({ ...prev, discount: parseInt(e.target.value) || 0 })); setCouponApplied(null); setCouponCode(''); }} className="luxury-input text-sm w-full" />
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-[9px] uppercase text-muted-foreground tracking-wider block mb-1">Payment Method</label>
              <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className="luxury-input text-sm w-full">
                <option value="cod">Cash on Delivery</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
              </select>
            </div>

            {/* Order Summary */}
            <div className="mt-4 p-4 bg-muted/30 border border-border space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Order Summary</p>
              <div className="flex justify-between text-sm"><span>Subtotal ({items.length} items)</span><span>৳{subtotal.toLocaleString()}</span></div>
              {form.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-৳{form.discount.toLocaleString()}</span></div>}
              <div className="flex justify-between text-sm"><span>Delivery Charge</span><span>৳{form.delivery_charge.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t border-border pt-2 text-lg"><span>Total</span><span>৳{total.toLocaleString()}</span></div>
            </div>

            <button type="submit" disabled={submitting} className="w-full luxury-button-primary h-12 mt-2 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <><Facebook size={16} /> CONFIRM FACEBOOK ORDER</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminFacebookOrders;
