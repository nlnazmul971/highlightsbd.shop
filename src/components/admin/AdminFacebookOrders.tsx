import { useState, useMemo, useEffect } from 'react';
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
  
  // আপনার ছবি অনুযায়ী ৩টি ডিফল্ট জোন (যদি ডাটাবেসে না থাকে তবে এগুলো কাজ করবে)
  const defaultZones = [
    { id: 'inside-dhaka', name: 'Inside Dhaka', fee: 70, description: 'Dhaka city area' },
    { id: 'sub-urban-dhaka', name: 'Sub - Urban Dhaka', fee: 90, description: 'Ashulia, Keraniganj, Savar, etc.' },
    { id: 'outside-dhaka', name: 'Outside Dhaka', fee: 110, description: 'All districts outside Dhaka' }
  ];

  // ডাটাবেস থেকে জোন থাকলে সেগুলো নেবে, না থাকলে ডিফল্টগুলো
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
  const [selectedCoupon, setSelectedCoupon] = useState('');
  const [selectedZone, setSelectedZone] = useState('');

  // সাব-টোটাল ক্যালকুলেশন
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (i.price * i.quantity), 0), [items]);

  // কুপন অ্যাপ্লাই লজিক (অটোমেটিক)
  useEffect(() => {
    if (selectedCoupon) {
      const coupon = activeCoupons.find((c: any) => c.id === selectedCoupon || c.code === selectedCoupon);
      if (coupon) {
        let disc = 0;
        if (subtotal >= coupon.min_order_amount) {
          disc = coupon.discount_type === 'percentage' 
            ? Math.round(subtotal * coupon.discount_value / 100) 
            : coupon.discount_value;
          setForm(prev => ({ ...prev, discount: disc }));
        } else {
          setForm(prev => ({ ...prev, discount: 0 }));
        }
      }
    }
  }, [subtotal, selectedCoupon, activeCoupons]);

  // জোন অ্যাপ্লাই লজিক (অটোমেটিক)
  const applyZone = (zoneId: string) => {
    setSelectedZone(zoneId);
    const zone = activeZones.find((z: any) => z.id === zoneId);
    if (zone) {
      setForm(prev => ({ 
        ...prev, 
        delivery_charge: zone.fee, 
        customer_city: zone.name 
      }));
    } else {
      setForm(prev => ({ ...prev, delivery_charge: 0 }));
    }
  };

  const total = Math.max(0, subtotal - form.discount + form.delivery_charge);

  // প্রোডাক্ট সার্চিং
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
      toast.error('Please fill in Name, Phone, Address and Select a Delivery Zone (City)');
      return;
    }
    if (items.some(i => !i.name.trim() || i.price <= 0)) {
      toast.error('Please select products and set valid prices');
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
      // Reset form
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
      toast.error('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Facebook className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-light">Facebook Order System</h2>
      </div>

      <form onSubmit={handleSubmit} className="border border-border p-6 space-y-6 bg-card">
        {/* Customer Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="Customer Name *" className="luxury-input" required />
          <input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} placeholder="Phone Number *" className="luxury-input" required />
          <input value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} placeholder="Full Address *" className="luxury-input md:col-span-2" required />
          
          {/* City Field - জোন থেকে অটো আসবে বা নিজে লিখবে */}
          <input value={form.customer_city} onChange={e => setForm({ ...form, customer_city: e.target.value })} placeholder="City / District *" className="luxury-input" required />
          
          <textarea value={form.customer_note} onChange={e => setForm({ ...form, customer_note: e.target.value })} placeholder="Special Instructions (Optional)" className="luxury-input md:col-span-2" rows={2} />
        </div>

        {/* Product Selection - Simplified Search */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-muted-foreground">Order Items</span>
            <button type="button" onClick={addItem} className="text-xs bg-primary/10 px-3 py-1 rounded">+ Add More</button>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="p-3 border border-dashed rounded relative space-y-3">
              <div className="relative">
                <input
                  value={searchQueries[idx] ?? ''}
                  onChange={e => {
                    setSearchQueries(prev => ({ ...prev, [idx]: e.target.value }));
                    setActiveSearchIdx(idx);
                  }}
                  onFocus={() => setActiveSearchIdx(idx)}
                  placeholder={item.name ? `Selected: ${item.name}` : "Type product name to search..."}
                  className="luxury-input w-full"
                />
                {activeSearchIdx === idx && searchQueries[idx] && (
                  <div className="absolute z-10 w-full bg-white border shadow-xl max-h-40 overflow-auto mt-1">
                    {getFilteredProducts(searchQueries[idx] || '').map((p: any) => (
                      <div key={p.id} onClick={() => selectProduct(idx, p)} className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between">
                        <span className="text-sm">{p.name}</span>
                        <span className="text-sm font-bold">৳{p.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input value={item.size} onChange={e => updateItem(idx, 'size', e.target.value)} placeholder="Size" className="luxury-input text-xs" />
                <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="luxury-input text-xs" />
                <input type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseInt(e.target.value) || 0)} className="luxury-input text-xs" />
              </div>
              {items.length > 1 && <button onClick={() => removeItem(idx)} className="absolute top-1 right-1 text-red-500"><Trash2 size={14}/></button>}
            </div>
          ))}
        </div>

        {/* Delivery & Coupon Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
          {/* Delivery Zone Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase flex items-center gap-2"><MapPin size={14}/> Select Delivery Zone</label>
            <div className="space-y-2">
              {activeZones.map((zone: any) => (
                <div 
                  key={zone.id} 
                  onClick={() => applyZone(zone.id)}
                  className={`p-3 border cursor-pointer flex justify-between items-center transition-all ${selectedZone === zone.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-gray-400'}`}
                >
                  <div>
                    <p className="text-sm font-medium">{zone.name}</p>
                    <p className="text-[10px] text-muted-foreground">{zone.description}</p>
                  </div>
                  <span className="font-bold">৳{zone.fee}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon / Discount Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase flex items-center gap-2"><Tag size={14}/> Coupon Code / Discount</label>
            <div className="flex gap-2">
              <input 
                placeholder="Enter coupon code..." 
                className="luxury-input flex-1"
                value={selectedCoupon}
                onChange={(e) => setSelectedCoupon(e.target.value.toUpperCase())}
              />
            </div>
            <p className="text-[10px] text-muted-foreground italic">If you type a valid coupon code, the discount will apply automatically.</p>
            
            {/* Summary Box */}
            <div className="mt-6 p-4 bg-gray-50 rounded space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal:</span><span>৳{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm text-green-600"><span>Discount:</span><span>-৳{form.discount.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span>Delivery:</span><span>৳{form.delivery_charge.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t pt-2 text-lg"><span>Total:</span><span>৳{total.toLocaleString()}</span></div>
            </div>
            
            <button type="submit" disabled={submitting} className="w-full luxury-button-primary h-12 mt-4">
              {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'CONFIRM FACEBOOK ORDER'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminFacebookOrders;