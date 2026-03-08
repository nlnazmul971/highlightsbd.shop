const Footer = () => (
  <footer className="border-t border-border mt-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center sm:text-left">
        <div>
          <h3 className="luxury-heading text-2xl tracking-[0.2em] mb-4">HIGHLIGHTS</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">Premium men's fashion. Crafted with precision and designed for the modern gentleman.</p>
        </div>
        <div>
          <h4 className="luxury-body text-[11px] mb-4 text-foreground">Quick Links</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="hover:text-foreground cursor-pointer transition-colors">About Us</p>
            <p className="hover:text-foreground cursor-pointer transition-colors">Contact</p>
            <p className="hover:text-foreground cursor-pointer transition-colors">Shipping & Returns</p>
            <p className="hover:text-foreground cursor-pointer transition-colors">Size Guide</p>
          </div>
        </div>
        <div>
          <h4 className="luxury-body text-[11px] mb-4 text-foreground">Connect</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="hover:text-foreground cursor-pointer transition-colors">Instagram</p>
            <p className="hover:text-foreground cursor-pointer transition-colors">Facebook</p>
            <p className="hover:text-foreground cursor-pointer transition-colors">WhatsApp</p>
          </div>
        </div>
      </div>
      <div className="luxury-divider mt-12 mb-6" />
      <p className="text-center text-xs text-muted-foreground tracking-wider">© 2026 ARJO. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
