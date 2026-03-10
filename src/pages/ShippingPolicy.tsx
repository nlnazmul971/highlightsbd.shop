import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

const ShippingPolicy = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
      <h1 className="luxury-heading text-3xl sm:text-4xl tracking-[0.15em] text-center mb-4">Shipping Policy</h1>
      <div className="w-12 h-px bg-foreground mx-auto mb-10" />

      <div className="space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">HIGHLIGHTS</strong> delivers across Bangladesh. We partner with trusted courier services to ensure your order reaches you safely and on time.
        </p>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Delivery Timeframes</h2>
        <div className="border border-border">
          <div className="grid grid-cols-2 border-b border-border">
            <div className="p-3 text-xs uppercase tracking-wider text-foreground font-medium border-r border-border">Location</div>
            <div className="p-3 text-xs uppercase tracking-wider text-foreground font-medium">Estimated Time</div>
          </div>
          <div className="grid grid-cols-2 border-b border-border">
            <div className="p-3 text-sm text-muted-foreground border-r border-border">Inside Dhaka</div>
            <div className="p-3 text-sm text-muted-foreground">1–3 Business Days</div>
          </div>
          <div className="grid grid-cols-2">
            <div className="p-3 text-sm text-muted-foreground border-r border-border">Outside Dhaka</div>
            <div className="p-3 text-sm text-muted-foreground">3–5 Business Days</div>
          </div>
        </div>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Shipping Charges</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Delivery charges are calculated at checkout based on your location.</li>
          <li>Free shipping may be available on select promotions.</li>
        </ul>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Order Tracking</h2>
        <p>
          Once your order is dispatched, you will receive a tracking number via SMS or through your account dashboard. You can use this to track your delivery in real time.
        </p>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Important Notes</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Please ensure your phone number and address are correct to avoid delivery delays.</li>
          <li>Delivery times may vary during holidays, sales events, or adverse weather conditions.</li>
          <li>We are not responsible for delays caused by courier partners, but we will assist in resolving any issues.</li>
        </ul>
      </div>
    </main>
    <Footer />
  </div>
);

export default ShippingPolicy;
