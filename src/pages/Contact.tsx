import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Contact = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
      <h1 className="luxury-heading text-3xl sm:text-4xl tracking-[0.15em] text-center mb-4">Contact Us</h1>
      <div className="w-12 h-px bg-foreground mx-auto mb-10" />

      <div className="space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
        <p>
          We'd love to hear from you! Whether you have a question about our products, need help with an order, or just want to say hello — feel free to reach out.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
          <div className="border border-border p-6 space-y-3">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-foreground shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wider text-foreground font-medium">Address</p>
                <p className="text-sm text-muted-foreground">House 12, Road 5, Sector 3, Uttara, Dhaka-1230</p>
              </div>
            </div>
          </div>

          <div className="border border-border p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-foreground shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wider text-foreground font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">+880 1234 567890</p>
              </div>
            </div>
          </div>

          <div className="border border-border p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-foreground shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wider text-foreground font-medium">Email</p>
                <p className="text-sm text-muted-foreground">info@highlightbd.com</p>
              </div>
            </div>
          </div>

          <div className="border border-border p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-foreground shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wider text-foreground font-medium">Business Hours</p>
                <p className="text-sm text-muted-foreground">Saturday – Thursday: 10AM – 8PM</p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6">
          You can also reach us via our Facebook page or send a message on WhatsApp for quick support.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Contact;
