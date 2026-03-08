import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success('Subscribed successfully!');
      setEmail('');
    }
  };

  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top section - Brand + Contact */}
        <div className="mb-6 sm:mb-10">
          <h3 className="luxury-heading text-xl tracking-[0.3em] font-semibold mb-2 sm:mb-4">HIGHLIGHTS</h3>
          <div className="space-y-1 sm:space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0" />
              HOUSE 12, ROAD 5, SECTOR 3, UTTARA, DHAKA
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <p className="flex items-center gap-2">
                <Phone size={14} />
                +880 1234 567890
              </p>
              <p className="flex items-center gap-2">
                <Mail size={14} />
                INFO@HIGHLIGHTS.COM
              </p>
            </div>
          </div>
          {/* Social icons */}
          <div className="flex items-center gap-3 mt-3 sm:mt-4">
            <a href="#" className="p-1.5 hover:opacity-60 transition-opacity" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" className="p-1.5 hover:opacity-60 transition-opacity" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
          </div>
        </div>

        {/* Links + Newsletter */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-10">
          <div>
            <h4 className="luxury-body text-[11px] mb-2 sm:mb-4 text-foreground">Information</h4>
            <div className="space-y-1.5 sm:space-y-2 text-sm text-muted-foreground uppercase tracking-wider">
              <Link to="/" className="block hover:text-foreground transition-colors">Home</Link>
              <p className="hover:text-foreground cursor-pointer transition-colors">About Us</p>
              <p className="hover:text-foreground cursor-pointer transition-colors">Contact</p>
              <p className="hover:text-foreground cursor-pointer transition-colors">Blog</p>
            </div>
          </div>
          <div>
            <h4 className="luxury-body text-[11px] mb-2 sm:mb-4 text-foreground">Policies</h4>
            <div className="space-y-1.5 sm:space-y-2 text-sm text-muted-foreground uppercase tracking-wider">
              <p className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</p>
              <p className="hover:text-foreground cursor-pointer transition-colors">Terms & Conditions</p>
              <p className="hover:text-foreground cursor-pointer transition-colors">Refund Policy</p>
              <p className="hover:text-foreground cursor-pointer transition-colors">Guidelines</p>
            </div>
          </div>
          <div>
            <h4 className="luxury-body text-[11px] mb-4 text-foreground">Newsletter</h4>
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

        <div className="luxury-divider mb-6" />
        <p className="text-center text-xs text-muted-foreground tracking-[0.2em] uppercase">© 2026 HIGHLIGHTS. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
