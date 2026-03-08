import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { useAdmin, Order } from '@/contexts/AdminContext';
import { toast } from 'sonner';

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { orders, updateOrderStatus } = useAdmin();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '' });
  const [delivery, setDelivery] = useState('standard');
  const [payment, setPayment] = useState('cod');

  const deliveryFee = delivery === 'express' ? 150 : 80;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Cart is empty'); return; }
    if (!form.name || !form.phone || !form.address || !form.city) { toast.error('Please fill all fields'); return; }

    const order: Order = {
      id: Date.now().toString(),
      items: items.map(i => ({ productId: i.product.id, name: i.product.name, quantity: i.quantity, price: i.product.price, size: i.size, color: i.color })),
      total: total + deliveryFee,
      customer: form,
      delivery, payment,
      status: 'Pending',
      date: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('arjo-orders') || '[]');
    localStorage.setItem('arjo-orders', JSON.stringify([...existing, order]));

    clearCart();
    toast.success('Order placed successfully!');
    navigate('/');
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
            {/* Form */}
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
                <h2 className="luxury-body text-[11px] text-foreground mb-3 mt-8">Payment</h2>
                <label className={`flex items-center gap-3 p-4 border cursor-pointer ${payment === 'cod' ? 'border-foreground' : 'border-border'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${payment === 'cod' ? 'border-foreground' : 'border-muted-foreground'}`}>
                    {payment === 'cod' && <div className="w-2 h-2 rounded-full bg-foreground" />}
                  </div>
                  <span className="text-sm">Cash on Delivery</span>
                </label>
              </div>
            </div>

            {/* Summary */}
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
