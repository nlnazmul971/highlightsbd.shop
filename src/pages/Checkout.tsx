import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckoutPaymentSettings, useCreateOrder, useDeliveryZones, useProfile, useUpdateProfile, useValidateCoupon, useIncrementCouponUsage, CouponRow } from '@/hooks/useSupabase';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Check, Copy, ChevronDown } from 'lucide-react';
import { isHoneypotFilled, isFormFilledTooFast, isRateLimited, recordOrderTimestamp, isValidBDPhone, sanitizeInput, isValidEmail } from '@/lib/botProtection';

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY = '6LeeyYUsAAAAAAfJMZwQSmc7zwu4gnrlq9dGrIMC';

type PaymentMethod = 'cod' | 'online';
type OnlineProvider = 'bkash' | 'nagad' | null;
type DeliveryZone = string;

const FALLBACK_DELIVERY_OPTIONS: { id: DeliveryZone; label: string; subtitle: string; price: number }[] = [
  { id: 'Inside Dhaka', label: 'Inside Dhaka', subtitle: 'Dhaka city area', price: 70 },
  {
    id: 'Sub - Urban Dhaka',
    label: 'Sub - Urban Dhaka',
    subtitle: 'Ashulia, Dhamrai, Keranigonj, Dohar, Hemayetpur, Keraniganj Model, Nowabganj, Savar, South Keraniganj',
    price: 120,
  },
  {
    id: 'Outside Dhaka',
    label: 'Outside Dhaka',
    subtitle: 'All districts outside Dhaka',
    price: 150,
  },
];

const FALLBACK_PAYMENT_SETTINGS: Record<'bkash' | 'nagad', { number: string; instructions: string; is_active: boolean }> = {
  bkash: {
    number: '01712-345678',
    instructions: 'Please send the exact amount and enter your sender number + transaction ID below.',
    is_active: true,
  },
  nagad: {
    number: '01812-345678',
    instructions: 'Please send the exact amount and enter your sender number + transaction ID below.',
    is_active: true,
  },
};

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
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  const { data: zones = [] } = useDeliveryZones(false);
  const { data: paymentSettings = [] } = useCheckoutPaymentSettings();
  const { data: profile } = useProfile(user?.id);

  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', senderNumber: '', transactionId: '', customerNote: '' });
  const [attempted, setAttempted] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryZone>('Inside Dhaka');
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [onlineProvider, setOnlineProvider] = useState<OnlineProvider>(null);
  const [copied, setCopied] = useState<'number' | 'amount' | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponRow | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [honeypot, setHoneypot] = useState('');
  const formOpenedAt = useRef(Date.now());
  const validateCoupon = useValidateCoupon();
  const incrementCouponUsage = useIncrementCouponUsage();

  // Auto-fill from saved profile
  useEffect(() => {
    if (profile && useSavedAddress) {
      setForm(f => ({
        ...f,
        name: profile.display_name || f.name,
        phone: profile.phone || f.phone,
        address: profile.address || f.address,
        city: profile.city || f.city,
      }));
    }
    if (user?.email) {
      setForm(f => ({ ...f, email: f.email || user.email || '' }));
    }
  }, [profile, useSavedAddress, user]);


  // GTM: begin_checkout event
  useEffect(() => {
    if (items.length === 0) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'begin_checkout',
      ecommerce: {
        currency: 'BDT',
        currencyCode: 'BDT',
        value: total,
        items: items.map(i => ({
          item_id: i.product.id,
          item_name: i.product.name,
          category: i.product.category,
          price: i.product.price,
          quantity: i.quantity,
        })),
        detail: {
          products: items.map(i => ({
            id: i.product.id,
            name: i.product.name,
            category: i.product.category,
            price: i.product.price,
            quantity: i.quantity,
          })),
        },
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deliveryOptions = useMemo(() => {
    const active = (zones || []).filter(z => z.is_active);
    if (active.length > 0) {
      return active.map(z => ({
        id: z.name,
        label: z.name,
        subtitle: z.description || '',
        price: z.fee,
      }));
    }
    return FALLBACK_DELIVERY_OPTIONS;
  }, [zones]);

  useEffect(() => {
    if (!deliveryOptions.some(o => o.id === delivery)) {
      setDelivery(deliveryOptions[0]?.id ?? 'Inside Dhaka');
    }
  }, [deliveryOptions, delivery]);

  const deliveryFee = useMemo(() => {
    const selected = deliveryOptions.find(o => o.id === delivery);
    return selected?.price ?? 0;
  }, [delivery, deliveryOptions]);

  const grandTotal = Math.max(0, total + deliveryFee - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { toast.error('Enter a coupon code'); return; }
    try {
      const coupon = await validateCoupon.mutateAsync({ code: couponCode, orderTotal: total });
      setAppliedCoupon(coupon);
      const discount = coupon.discount_type === 'percentage'
        ? Math.round(total * coupon.discount_value / 100)
        : coupon.discount_value;
      setCouponDiscount(Math.min(discount, total));
      toast.success(`Coupon applied! ৳${Math.min(discount, total)} off`);
    } catch (err: any) {
      toast.error(err.message || 'Invalid coupon');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  const paymentMap = useMemo(() => {
    const map: Record<string, { number: string; instructions: string; is_active: boolean }> = {};
    for (const s of paymentSettings || []) {
      map[s.provider] = { number: s.number || '', instructions: s.instructions || '', is_active: s.is_active };
    }
    return map;
  }, [paymentSettings]);

  const getProviderSetting = useCallback(
    (provider: 'bkash' | 'nagad') => {
      return paymentMap[provider] ?? FALLBACK_PAYMENT_SETTINGS[provider];
    },
    [paymentMap]
  );

  const selectableProviders = useMemo((): Array<'bkash' | 'nagad'> => {
    const base: Array<'bkash' | 'nagad'> = ['bkash', 'nagad'];
    const active = base.filter(p => getProviderSetting(p).is_active);
    const list = active.length ? active : base;
    return list;
  }, [getProviderSetting]);

  useEffect(() => {
    if (payment !== 'online') return;
    const allowed = selectableProviders as unknown as Array<'bkash' | 'nagad'>;
    if (!onlineProvider || !allowed.includes(onlineProvider as any)) {
      setOnlineProvider(allowed[0] ?? 'bkash');
    }
  }, [payment, selectableProviders, onlineProvider]);

  const providerNumber = useMemo(() => {
    if (!onlineProvider) return null;
    return getProviderSetting(onlineProvider).number || null;
  }, [onlineProvider, getProviderSetting]);

  const providerInstruction = useMemo(() => {
    if (!onlineProvider) return '';
    return getProviderSetting(onlineProvider).instructions || '';
  }, [onlineProvider, getProviderSetting]);

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

  const handleDeliveryChange = (zone: DeliveryZone) => {
    setDelivery(zone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    // Bot protection checks
    if (isHoneypotFilled(honeypot)) {
      // Silently reject - don't tell bots why
      toast.success('Order placed successfully!');
      return;
    }
    if (isFormFilledTooFast(formOpenedAt.current)) {
      toast.error('Please take a moment to review your order');
      return;
    }
    if (isRateLimited()) {
      toast.error('Too many orders placed recently. Please try again later.');
      return;
    }

    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!form.name || !form.email || !form.phone || !form.address || !form.city) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!isValidBDPhone(form.phone)) {
      toast.error('Please enter a valid Bangladesh phone number');
      return;
    }
    if (payment === 'online' && !onlineProvider) {
      toast.error('Please select a payment provider');
      return;
    }
    if (payment === 'online' && onlineProvider) {
      const s = getProviderSetting(onlineProvider);
      if (!s.is_active) {
        toast.error('Selected payment provider is currently unavailable');
        return;
      }
      if (!s.number) {
        toast.error('Payment number is not configured');
        return;
      }
    }
    if (payment === 'online' && !form.senderNumber) {
      toast.error('Please enter sender number');
      return;
    }
    if (payment === 'online' && !form.transactionId) {
      toast.error('Please enter transaction ID');
      return;
    }
    try {
      // reCAPTCHA v3 verification
      if (window.grecaptcha) {
        try {
          const recaptchaToken = await new Promise<string>((resolve, reject) => {
            window.grecaptcha.ready(() => {
              window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'place_order' }).then(resolve).catch(reject);
            });
          });
          const { data: verifyResult } = await supabase.functions.invoke('verify-recaptcha', {
            body: { token: recaptchaToken },
          });
          if (!verifyResult?.success) {
            toast.error('Security verification failed. Please try again.');
            return;
          }
        } catch {
          // If reCAPTCHA fails, still allow order (graceful degradation)
          console.warn('reCAPTCHA verification skipped');
        }
      }

      await createOrder.mutateAsync({
        user_id: user?.id || null,
        items: items.map(i => ({
          product_id: i.product.id,
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
          size: i.size,
          color: i.color,
        })) as unknown as Json,
        total: grandTotal,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        customer_city: form.city,
        delivery_method: delivery,
        payment_method: payment === 'online' ? onlineProvider! : 'cod',
        payment_sender_number: form.senderNumber || null,
        transaction_id: form.transactionId || null,
        customer_note: form.customerNote || null,
      });
      // Save address to profile if logged in
      if (user) {
        try {
          await updateProfile.mutateAsync({
            userId: user.id,
            display_name: form.name,
            phone: form.phone,
            address: form.address,
            city: form.city,
          });
        } catch { /* silently fail address save */ }
      }
      // GTM: purchase event
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event: 'purchase',
        ecommerce: {
          transaction_id: new Date().getTime().toString(),
          currency: 'BDT',
          value: grandTotal,
          shipping: deliveryFee,
          coupon: appliedCoupon?.code || '',
          discount: couponDiscount,
          items: items.map(i => ({
            item_id: i.product.id,
            item_name: i.product.name,
            category: i.product.category,
            price: i.product.price,
            quantity: i.quantity,
            product_id: i.product.id,
          })),
          detail: {
            products: items.map(i => ({
              id: i.product.id,
              name: i.product.name,
              category: i.product.category,
              price: i.product.price,
              quantity: i.quantity,
            })),
          },
        },
        orderData: {
          customer: {
            billing: {
              first_name: form.name.split(' ')[0] || '',
              last_name: form.name.split(' ').slice(1).join(' ') || '',
              email: form.email,
              phone: form.phone,
              address: form.address,
              city: form.city,
              country: 'BD',
            },
          },
          delivery: {
            method: delivery,
            fee: deliveryFee,
          },
          payment: {
            method: payment === 'online' ? onlineProvider : 'cod',
          },
        },
      });
      // Record for rate limiting
      recordOrderTimestamp();
      // Increment coupon usage
      if (appliedCoupon) {
        try { await incrementCouponUsage.mutateAsync(appliedCoupon.id); } catch {}
      }
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartDrawer />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
        <h1 className="luxury-heading text-3xl tracking-[0.15em] text-center mb-12">Checkout</h1>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground">Your cart is empty.</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Honeypot - hidden from real users, bots will fill this */}
            <div className="absolute opacity-0 pointer-events-none" style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true" tabIndex={-1}>
              <label htmlFor="website_url">Website</label>
              <input type="text" id="website_url" name="website_url" value={honeypot} onChange={e => setHoneypot(e.target.value)} autoComplete="off" tabIndex={-1} />
            </div>
            <div className="space-y-6">
              <h2 className="luxury-body text-[11px] text-foreground mb-4">Delivery Information</h2>
              
              {/* Saved address toggle */}
              {user && profile?.address && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 border border-border">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={useSavedAddress}
                      onChange={e => {
                        setUseSavedAddress(e.target.checked);
                        if (!e.target.checked) {
                          setForm(f => ({ ...f, name: '', phone: '', address: '', city: '' }));
                        }
                      }}
                      className="accent-foreground"
                    />
                    Use saved address
                  </label>
                  {useSavedAddress && (
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {profile.address}, {profile.city}
                    </span>
                  )}
                </div>
              )}

              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name *" className={`luxury-input ${attempted && !form.name.trim() ? 'border-destructive' : ''}`} />
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email *" className={`luxury-input ${attempted && !form.email.trim() ? 'border-destructive' : ''}`} />
              <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone Number *" className={`luxury-input ${attempted && !form.phone.trim() ? 'border-destructive' : ''}`} />
              <textarea required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full Address (House, Road, Area) *" className={`luxury-input min-h-[100px] resize-y ${attempted && !form.address.trim() ? 'border-destructive' : ''}`} rows={4} />
              <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City *" className={`luxury-input ${attempted && !form.city.trim() ? 'border-destructive' : ''}`} />
              <textarea value={form.customerNote} onChange={e => setForm({ ...form, customerNote: e.target.value })} placeholder="Order Note (optional)" className="luxury-input min-h-[60px] resize-y" rows={2} />

              {/* Delivery Zone */}
              <div>
                <h2 className="luxury-body text-[11px] text-foreground mb-3 mt-8">Delivery</h2>
                <div className="space-y-2">
                  {deliveryOptions.map(d => (
                    <label
                      key={d.id}
                      className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${delivery === d.id ? 'border-foreground' : 'border-border hover:border-muted-foreground'}`}
                      onClick={() => handleDeliveryChange(d.id)}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          delivery === d.id ? 'border-foreground' : 'border-muted-foreground'
                        }`}
                      >
                        {delivery === d.id && <div className="w-2 h-2 rounded-full bg-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{d.label}</p>
                        {d.subtitle ? (
                          <p className="text-xs mt-0.5 text-muted-foreground">{d.subtitle}</p>
                        ) : null}
                      </div>
                      <span className="text-sm flex-shrink-0">৳{d.price}</span>
                      <input type="radio" name="delivery" value={d.id} checked={delivery === d.id} onChange={() => handleDeliveryChange(d.id)} className="hidden" />
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h2 className="luxury-body text-[11px] text-foreground mb-3 mt-8">Payment Method</h2>
                <div className="space-y-3">
                  {/* Cash on Delivery */}
                  {(
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
                          setForm(f => ({ ...f, senderNumber: '', transactionId: '' }));
                        }}
                        className="hidden"
                      />
                    </label>
                  )}

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
                      <input type="radio" name="payment" value="online" checked={payment === 'online'} onChange={() => setPayment('online')} className="hidden" />
                    </label>

                    {payment === 'online' && (
                      <div className="px-4 pb-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {selectableProviders.includes('bkash') && (
                            <button
                              type="button"
                              onClick={() => setOnlineProvider('bkash')}
                              className={`p-3 border-2 transition-colors ${onlineProvider === 'bkash' ? 'border-[#E2136E]' : 'border-border hover:border-muted-foreground'}`}
                            >
                              <BkashLogo />
                            </button>
                          )}

                          {selectableProviders.includes('nagad') && (
                            <button
                              type="button"
                              onClick={() => setOnlineProvider('nagad')}
                              className={`p-3 border-2 transition-colors ${onlineProvider === 'nagad' ? 'border-[#F6921E]' : 'border-border hover:border-muted-foreground'}`}
                            >
                              <NagadLogo />
                            </button>
                          )}
                        </div>

                        {onlineProvider && providerNumber && (
                          <div className="p-4 bg-secondary/30 border border-border space-y-4">
                            <p className="text-sm font-medium">Send payment to {onlineProvider === 'bkash' ? 'bKash' : 'Nagad'}:</p>

                            {providerInstruction ? (
                              <p className="text-xs text-muted-foreground leading-relaxed">{providerInstruction}</p>
                            ) : null}

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

                            <div>
                              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-2">
                                Sender Number <span className="text-destructive">*</span>
                              </label>
                              <input
                                required
                                value={form.senderNumber}
                                onChange={e => setForm({ ...form, senderNumber: e.target.value })}
                                placeholder={`Enter your ${onlineProvider === 'bkash' ? 'bKash' : 'Nagad'} number`}
                                className="luxury-input"
                              />
                            </div>

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
                      <div>
                        <p>{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.size} / {item.color} × {item.quantity}
                        </p>
                      </div>
                      <span>৳{(item.product.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {/* Coupon Section */}
                <div className="mb-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 text-sm">
                      <div>
                        <span className="font-medium text-green-800">{appliedCoupon.code}</span>
                        {appliedCoupon.name && <span className="text-green-600 ml-1">({appliedCoupon.name})</span>}
                        <span className="text-green-700 ml-2">-৳{couponDiscount.toLocaleString()}</span>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon Code"
                        className="luxury-input flex-1 uppercase"
                      />
                      <button type="button" onClick={handleApplyCoupon} disabled={validateCoupon.isPending} className="luxury-button-outline text-xs px-4 whitespace-nowrap">
                        {validateCoupon.isPending ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="luxury-divider mb-4" />
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal</span>
                  <span>৳{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Delivery</span>
                  <span>৳{deliveryFee}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm mb-2 text-green-600">
                    <span>Coupon Discount</span>
                    <span>-৳{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="luxury-divider mb-4 mt-2" />
                <div className="flex justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>৳{grandTotal.toLocaleString()}</span>
                </div>
                <button type="submit" disabled={createOrder.isPending} className="luxury-button-primary w-full mt-6">
                  {createOrder.isPending ? 'Placing Order...' : 'Place Order'}
                </button>
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

