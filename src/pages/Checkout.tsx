import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateOrder } from '@/hooks/useSupabase';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', transactionId: '' });
  const [delivery, setDelivery] = useState('standard');
  const [payment, setPayment] = useState('cod');

  const deliveryFee = delivery === 'express' ? 150 : 80;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Cart is empty'); return; }
    if (!form.name || !form.phone || !form.address || !form.city) { toast.error('Please fill all fields'); return; }
    if (payment === 'manual' && !form.transactionId) { toast.error('Please enter transaction ID'); return; }

    if (!user) {
      toast.error('Please sign in to place an order');
      navigate('/auth');
      return;
    }

    try {
      await createOrder.mutateAsync({
        user_id: user.id,
        items: items.map(i => ({ product_id: i.product.id, name: i.product.name, quantity: i.quantity, price: i.product.price, size: i.size, color: i.color })) as unknown as Json,
        total: total + deliveryFee,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        customer_city: form.city,
        delivery_method: delivery,
        payment_method: payment,
        transaction_id: form.transactionId || null,
      });
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
        <h1 className="luxury-heading text-3xl tracking-[0.15em] text-center mb-12">Checkout</h1>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground">Your cart is empty.</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h2 className="luxury-body text-[11px] text-foreground mb-4">Delivery Information</h2>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" className="luxury-input" />
              <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone Number" className="luxury-input" />
              <input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address" className="luxury-input" />
              <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" className="luxury-input" />

              <div>
                <h2 className="luxury-body text-[11px] text-foreground mb-3 mt-8">Delivery Method</h2>
                <div className="space-y-2">
                  {[{ id: 'standard', label: 'Standard Delivery', price: 80, time: '3-5 days' }, { id: 'express', label: 'Express Delivery', price: 150, time: '1-2 days' }].map(d => (
                    <label key={d.id} className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${delivery === d.id ? 'border-foreground' : 'border-border hover:border-muted-foreground'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${delivery === d.id ? 'border-foreground' : 'border-muted-foreground'}`}>
                          {delivery === d.id && <div className="w-2 h-2 rounded-full bg-foreground" />}
                        </div>
                        <div><p className="text-sm">{d.label}</p><p className="text-xs text-muted-foreground">{d.time}</p></div>
                      </div>
                      <span className="text-sm">৳{d.price}</span>
                      <input type="radio" name="delivery" value={d.id} checked={delivery === d.id} onChange={() => setDelivery(d.id)} className="hidden" />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="luxury-body text-[11px] text-foreground mb-3 mt-8">Payment Method</h2>
                <div className="space-y-2">
                  {[
                    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', number: null },
                    { id: 'bkash', label: 'bKash', desc: 'Send to: 01712-345678', number: '01712-345678' },
                    { id: 'nagad', label: 'Nagad', desc: 'Send to: 01812-345678', number: '01812-345678' },
                    { id: 'rocket', label: 'Rocket', desc: 'Send to: 01912-345678', number: '01912-345678' }
                  ].map(p => (
                    <label key={p.id} className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${payment === p.id ? 'border-foreground' : 'border-border hover:border-muted-foreground'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${payment === p.id ? 'border-foreground' : 'border-muted-foreground'}`}>
                          {payment === p.id && <div className="w-2 h-2 rounded-full bg-foreground" />}
                        </div>
                        <div><p className="text-sm">{p.label}</p><p className="text-xs text-muted-foreground">{p.desc}</p></div>
                      </div>
                      <input type="radio" name="payment" value={p.id} checked={payment === p.id} onChange={() => setPayment(p.id)} className="hidden" />
                    </label>
                  ))}
                </div>
                {['bkash', 'nagad', 'rocket'].includes(payment) && (
                  <div className="mt-4 p-4 bg-secondary/30 border border-border">
                    <p className="text-sm mb-3">
                      Send <span className="font-semibold">৳{(total + deliveryFee).toLocaleString()}</span> to{' '}
                      <span className="font-semibold">
                        {payment === 'bkash' && '01712-345678'}
                        {payment === 'nagad' && '01812-345678'}
                        {payment === 'rocket' && '01912-345678'}
                      </span>
                    </p>
                    <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-2">Transaction ID</label>
                    <input 
                      required 
                      value={form.transactionId} 
                      onChange={e => setForm({ ...form, transactionId: e.target.value })} 
                      placeholder={`Enter your ${payment.charAt(0).toUpperCase() + payment.slice(1)} transaction ID`}
                      className="luxury-input" 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="lg:sticky lg:top-40 h-fit">
              <div className="bg-secondary/50 p-6 sm:p-8">
                <h2 className="luxury-body text-[11px] text-foreground mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <div><p>{item.product.name}</p><p className="text-xs text-muted-foreground">{item.size} / {item.color} × {item.quantity}</p></div>
                      <span>৳{(item.product.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="luxury-divider mb-4" />
                <div className="flex justify-between text-sm mb-2"><span>Subtotal</span><span>৳{total.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm mb-4"><span>Delivery</span><span>৳{deliveryFee}</span></div>
                <div className="luxury-divider mb-4" />
                <div className="flex justify-between text-lg font-medium"><span>Total</span><span>৳{(total + deliveryFee).toLocaleString()}</span></div>
                <button type="submit" className="luxury-button-primary w-full mt-6">Place Order</button>
              </div>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
