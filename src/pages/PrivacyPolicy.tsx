import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
      <h1 className="luxury-heading text-3xl sm:text-4xl tracking-[0.15em] text-center mb-4">Privacy Policy</h1>
      <div className="w-12 h-px bg-foreground mx-auto mb-10" />

      <div className="space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
        <p>
          At <strong className="text-foreground">HIGHLIGHTS</strong>, we are committed to protecting the privacy of our customers. This Privacy Policy outlines how we collect, use, and safeguard your personal information.
        </p>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Information We Collect</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Name, phone number, and delivery address when you place an order</li>
          <li>Email address when you subscribe to our newsletter</li>
          <li>Payment information (bKash/Nagad transaction details)</li>
          <li>Browsing data and cookies for website improvement</li>
        </ul>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">How We Use Your Information</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>To process and deliver your orders</li>
          <li>To communicate order updates and shipping notifications</li>
          <li>To send promotional offers (only if you opt in)</li>
          <li>To improve our website and customer experience</li>
        </ul>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Data Protection</h2>
        <p>
          We implement appropriate security measures to protect your personal data. We do not sell, trade, or share your personal information with third parties, except as required to fulfill your order (e.g., courier services).
        </p>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Cookies</h2>
        <p>
          Our website uses cookies to enhance your browsing experience. You may disable cookies in your browser settings, though some features may not function properly.
        </p>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Contact</h2>
        <p>
          If you have questions about this policy, please contact us at <strong className="text-foreground">info@highlightbd.com</strong>.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicy;
