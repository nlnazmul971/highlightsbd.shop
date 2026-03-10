import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

const RefundPolicy = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
      <h1 className="luxury-heading text-3xl sm:text-4xl tracking-[0.15em] text-center mb-4">Refund & Return Policy</h1>
      <div className="w-12 h-px bg-foreground mx-auto mb-10" />

      <div className="space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
        <p>
          At <strong className="text-foreground">HIGHLIGHTS</strong>, customer satisfaction is our priority. If you're not happy with your purchase, we're here to help.
        </p>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Return Eligibility</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Items must be returned within <strong className="text-foreground">3 days</strong> of delivery.</li>
          <li>Products must be unused, unwashed, and in original packaging with tags intact.</li>
          <li>Items purchased during sales or with discount codes are not eligible for return.</li>
        </ul>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Exchange Policy</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>We offer exchanges for size or color issues within 3 days of delivery.</li>
          <li>Exchange is subject to product availability.</li>
          <li>Customer bears the shipping cost for exchange unless the product is defective.</li>
        </ul>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Refund Process</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Approved refunds will be processed within 5–7 business days.</li>
          <li>Refunds are issued via bKash or Nagad to the original payment method.</li>
          <li>Delivery charges are non-refundable.</li>
        </ul>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Damaged or Wrong Products</h2>
        <p>
          If you receive a damaged or incorrect item, please contact us within <strong className="text-foreground">24 hours</strong> of delivery with photos. We will arrange a free replacement or full refund.
        </p>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">How to Initiate a Return</h2>
        <p>
          Contact us via phone, email, or our Facebook/WhatsApp with your order ID and reason for return. Our team will guide you through the process.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default RefundPolicy;
