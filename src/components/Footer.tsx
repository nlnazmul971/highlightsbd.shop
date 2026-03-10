import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings } from '@/hooks/useSupabase';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const { data: s } = useStoreSettings();

  const brandName = s?.footer_brand_name || 'HIGHLIGHTS';
  const address = s?.footer_address || 'HOUSE 12, ROAD 5, SECTOR 3, UTTARA, DHAKA';
  const phone = s?.footer_phone || '+880 1234 567890';
  const footerEmail = s?.footer_email || 'INFO@HIGHLIGHTS.COM';
  const facebookUrl = s?.footer_facebook || '#';
  const instagramUrl = s?.footer_instagram || '#';
  const messengerUrl = s?.footer_messenger || '';
  const whatsappUrl = s?.footer_whatsapp || '';
  const copyright = s?.footer_copyright || `© 2026 ${brandName}. All rights reserved.`;

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      const emailLower = email.trim().toLowerCase();
      // Check for duplicate
      const q = query(collection(db, 'newsletter_subscribers'), where('email', '==', emailLower));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.info('You are already subscribed!');
      } else {
        await addDoc(collection(db, 'newsletter_subscribers'), { email: emailLower, created_at: new Date().toISOString() });
        toast.success('Subscribed successfully!');
      }
      setEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-12">
        {/* Top section - Brand + Contact */}
        <div className="mb-4 sm:mb-10">
          <h3 className="luxury-heading text-xl tracking-[0.3em] font-semibold mb-1.5 sm:mb-4">{brandName}</h3>
          <div className="space-y-0.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0" />
              {address}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
              <p className="flex items-center gap-2">
                <Phone size={14} />
                {phone}
              </p>
              <p className="flex items-center gap-2">
                <Mail size={14} />
                {footerEmail}
              </p>
            </div>
          </div>
          {/* Social icons */}
          <div className="flex items-center gap-3 mt-2 sm:mt-4">
            {facebookUrl && facebookUrl !== '' && (
              <a href={facebookUrl || '#'} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:opacity-60 transition-opacity" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            )}
            {instagramUrl && instagramUrl !== '' && (
              <a href={instagramUrl || '#'} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:opacity-60 transition-opacity" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
            )}
            {messengerUrl && messengerUrl !== '' && (
              <a href={messengerUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:opacity-60 transition-opacity" aria-label="Messenger">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
            )}
            {whatsappUrl && whatsappUrl !== '' && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:opacity-60 transition-opacity" aria-label="WhatsApp">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              </a>
            )}
          </div>
        </div>

        {/* Links + Newsletter */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-8 mb-4 sm:mb-10">
          <div>
            <h4 className="luxury-body text-[11px] mb-1.5 sm:mb-4 text-foreground">Information</h4>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
              <Link to="/" className="block hover:text-foreground transition-colors">Home</Link>
              <Link to="/about" className="block hover:text-foreground transition-colors">About Us</Link>
              <Link to="/contact" className="block hover:text-foreground transition-colors">Contact</Link>
              <Link to="/shop" className="block hover:text-foreground transition-colors">Shop</Link>
            </div>
          </div>
          <div>
            <h4 className="luxury-body text-[11px] mb-1.5 sm:mb-4 text-foreground">Policies</h4>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
              <Link to="/privacy-policy" className="block hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="block hover:text-foreground transition-colors">Terms & Conditions</Link>
              <Link to="/refund-policy" className="block hover:text-foreground transition-colors">Refund Policy</Link>
              <Link to="/shipping-policy" className="block hover:text-foreground transition-colors">Shipping Policy</Link>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h4 className="luxury-body text-[11px] mb-1.5 sm:mb-4 text-foreground">Newsletter</h4>
            <p className="text-xs text-muted-foreground mb-2">Subscribe to get updates on new arrivals & exclusive offers.</p>
            <form onSubmit={handleNewsletter} className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="luxury-input flex-1 border-border"
              />
              <button type="submit" className="luxury-button bg-primary text-primary-foreground px-6 py-3 text-xs tracking-[0.15em]">
                JOIN
              </button>
            </form>
          </div>
        </div>

        <div className="luxury-divider mb-3 sm:mb-6" />
        <p className="text-center text-xs text-muted-foreground tracking-[0.2em] uppercase">{copyright}</p>
      </div>
    </footer>
  );
};

export default Footer;
