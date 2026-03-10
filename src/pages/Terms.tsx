import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
      <h1 className="luxury-heading text-3xl sm:text-4xl tracking-[0.15em] text-center mb-4">Terms & Conditions</h1>
      <div className="w-12 h-px bg-foreground mx-auto mb-10" />

      <div className="space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
        <p>
          By accessing and using the <strong className="text-foreground">HIGHLIGHTS</strong> website, you agree to the following terms and conditions.
        </p>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Orders & Payments</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>All orders are confirmed once payment is received or Cash on Delivery is selected.</li>
          <li>We accept bKash, Nagad, and Cash on Delivery as payment methods.</li>
          <li>Prices are listed in Bangladeshi Taka (BDT) and include applicable taxes.</li>
          <li>We reserve the right to cancel any order due to stock unavailability or payment issues.</li>
        </ul>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Product Information</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>We strive to display product colors and details as accurately as possible. Slight variations may occur due to screen settings.</li>
          <li>Product availability is subject to change without prior notice.</li>
        </ul>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Delivery</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Delivery within Dhaka: 1–3 business days.</li>
          <li>Delivery outside Dhaka: 3–5 business days.</li>
          <li>Delivery charges apply based on your location.</li>
        </ul>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Intellectual Property</h2>
        <p>
          All content on this website — including logos, images, text, and designs — is the property of HIGHLIGHTS and may not be used without written permission.
        </p>

        <h2 className="text-foreground font-medium text-lg tracking-wide mt-8">Changes to Terms</h2>
        <p>
          HIGHLIGHTS reserves the right to update these terms at any time. Continued use of the website constitutes acceptance of the updated terms.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
