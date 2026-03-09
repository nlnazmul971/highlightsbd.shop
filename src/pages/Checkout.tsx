import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateOrder } from '@/hooks/useSupabase';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Check, Copy, ChevronDown } from 'lucide-react';

type PaymentMethod = 'cod' | 'online';
type OnlineProvider = 'bkash' | 'nagad' | null;

const BkashLogo = () => (
  <div className="flex items-center justify-center h-10 px-4 rounded bg-[#E2136E] text-white font-bold text-sm tracking-wide">
    bKash
  </div>
);

const NagadLogo = () => (
  <div className="flex items-center justify-center h-10 px-4 rounded bg-[#F6921E] text-white font-bold text-sm tracking-wide">
    Nagad
  </div>
);

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', senderNumber: '', transactionId: '' });
  const [delivery, setDelivery] = useState<'standard' | 'express'>('standard');
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [onlineProvider, setOnlineProvider] = useState<OnlineProvider>(null);
  const [copied, setCopied] = useState<'number' | 'amount' | null>(null);

  const deliveryFee = delivery === 'express' ? 150 : 80;
  const grandTotal = total + deliveryFee;

  const providerNumber = useMemo(() => {
    if (onlineProvider === 'bkash') return '01712-345678';
    if (onlineProvider === 'nagad') return '01812-345678';
    return null;
  }, [onlineProvider]);

  const handleCopy = useCallback(async (type: 'number' | 'amount', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      toast.success(type === 'number' ? 'Number copied' : 'Amount copied');
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      toast.error('Copy failed');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!form.name || !form.phone || !form.address || !form.city) {
      toast.error('Please fill all fields');
      return;
    }
    if (payment === 'online' && !onlineProvider) {
      toast.error('Please select a payment provider');
      return;
    }
    if (payment === 'online' && !form.senderNumber) {
      toast.error('Please enter sender number');
      return;
    }
    if (payment === 'online' && !form.transactionId) {
      toast.error('Please enter transaction ID');
      return;
    }

    if (!user) {
      toast.error('Please sign in to place an order');
      navigate('/auth');
      return;
    }

    try {
      await createOrder.mutateAsync({
        user_id: user.id,
        items: items.map(i => ({ product_id: i.product.id, name: i.product.name, quantity: i.quantity, price: i.product.price, size: i.size, color: i.color })) as unknown as Json,
        total: grandTotal,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        customer_city: form.city,
        delivery_method: delivery,
        payment_method: payment === 'online' ? onlineProvider! : 'cod',
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
                      <input type="radio" name="delivery" value={d.id} checked={delivery === d.id} onChange={() => setDelivery(d.id as 'standard' | 'express')} className="hidden" />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="luxury-body text-[11px] text-foreground mb-3 mt-8">Payment Method</h2>
                <div className="space-y-3">
                  {/* Cash on Delivery */}
                  <label className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${payment === 'cod' ? 'border-foreground' : 'border-border hover:border-muted-foreground'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${payment === 'cod' ? 'border-foreground' : 'border-muted-foreground'}`}>
                        {payment === 'cod' && <div className="w-2 h-2 rounded-full bg-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm">Cash on Delivery</p>
                        <p className="text-xs text-muted-foreground">Pay when you receive</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={payment === 'cod'}
                      onChange={() => {
                        setPayment('cod');
                        setOnlineProvider(null);
                        setForm(f => ({ ...f, transactionId: '' }));
                      }}
                      className="hidden"
                    />
                  </label>

                  {/* Online Payment */}
                  <div className={`border transition-colors ${payment === 'online' ? 'border-foreground' : 'border-border hover:border-muted-foreground'}`}>
                    <label className="flex items-center justify-between p-4 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${payment === 'online' ? 'border-foreground' : 'border-muted-foreground'}`}>
                          {payment === 'online' && <div className="w-2 h-2 rounded-full bg-foreground" />}
                        </div>
                        <div>
                          <p className="text-sm">Online Payment</p>
                          <p className="text-xs text-muted-foreground">Pay via bKash or Nagad</p>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${payment === 'online' ? 'rotate-180' : ''}`} />
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={payment === 'online'}
                        onChange={() => setPayment('online')}
                        className="hidden"
                      />
                    </label>

                    {/* Provider Selection */}
                    {payment === 'online' && (
                      <div className="px-4 pb-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setOnlineProvider('bkash')}
                            className={`p-3 border-2 transition-colors ${onlineProvider === 'bkash' ? 'border-[#E2136E]' : 'border-border hover:border-muted-foreground'}`}
                          >
                            <BkashLogo />
                          </button>
                          <button
                            type="button"
                            onClick={() => setOnlineProvider('nagad')}
                            className={`p-3 border-2 transition-colors ${onlineProvider === 'nagad' ? 'border-[#F6921E]' : 'border-border hover:border-muted-foreground'}`}
                          >
                            <NagadLogo />
                          </button>
                        </div>

                        {/* Provider Details */}
                        {onlineProvider && providerNumber && (
                          <div className="p-4 bg-secondary/30 border border-border space-y-4">
                            <p className="text-sm font-medium">
                              Send payment to {onlineProvider === 'bkash' ? 'bKash' : 'Nagad'}:
                            </p>

                            {/* Number with Copy */}
                            <div className="flex items-center justify-between gap-3 p-3 bg-background border border-border rounded">
                              <div>
                                <span className="text-xs text-muted-foreground">Number</span>
                                <p className="font-semibold tracking-wider">{providerNumber}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy('number', providerNumber)}
                                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                {copied === 'number' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                <span className="text-sm">Copy</span>
                              </button>
                            </div>

                            {/* Amount with Copy */}
                            <div className="flex items-center justify-between gap-3 p-3 bg-background border border-border rounded">
                              <div>
                                <span className="text-xs text-muted-foreground">Amount</span>
                                <p className="font-semibold">৳{grandTotal.toLocaleString()}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy('amount', grandTotal.toString())}
                                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                {copied === 'amount' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                <span className="text-sm">Copy</span>
                              </button>
                            </div>

                            {/* Transaction ID Input */}
                            <div>
                              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-2">
                                Transaction ID <span className="text-destructive">*</span>
                              </label>
                              <input
                                required
                                value={form.transactionId}
                                onChange={e => setForm({ ...form, transactionId: e.target.value })}
                                placeholder={`Enter your ${onlineProvider === 'bkash' ? 'bKash' : 'Nagad'} transaction ID`}
                                className="luxury-input"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
                <div className="flex justify-between text-lg font-medium"><span>Total</span><span>৳{grandTotal.toLocaleString()}</span></div>
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
