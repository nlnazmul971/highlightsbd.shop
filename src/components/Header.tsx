import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Heart, Menu, X, MessageCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useIsMobile } from '@/hooks/use-mobile';

const navCategories = [
  { name: 'Shirt', path: '/?category=Shirts' },
  { name: 'T-Shirt', path: '/?category=T-Shirt' },
  { name: 'Panjabi', path: '/?category=Panjabi' },
  { name: 'Pant', path: '/?category=Pant' },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount, setIsCartOpen } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background ${scrolled ? 'shadow-sm' : ''}`}>
        {/* Top bar - hidden on mobile when scrolled */}
        {!(scrolled && isMobile) && (
          <div className="border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-20">
                <div className="flex items-center gap-2">
                  <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-1.5 hover:opacity-60 transition-opacity">
                    {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
                  </button>
                  <button onClick={() => setSearchOpen(!searchOpen)} className="p-1.5 hover:opacity-60 transition-opacity">
                    <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                </div>
                <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-base sm:text-3xl tracking-[0.35em] sm:tracking-[0.4em] font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  HIGHLIGHTS
                </Link>
                <div className="flex items-center gap-0 sm:gap-2">
                  <Link to="/wishlist" className="p-1.5 hover:opacity-60 transition-opacity relative">
                    <Heart size={15} className="sm:w-[18px] sm:h-[18px]" />
                    {wishlistItems.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-foreground text-background text-[8px] rounded-full flex items-center justify-center">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>
                  <Link to="/admin" className="p-1.5 hover:opacity-60 transition-opacity">
                    <User size={15} className="sm:w-[18px] sm:h-[18px]" />
                  </Link>
                  <button onClick={() => setIsCartOpen(true)} className="p-1.5 hover:opacity-60 transition-opacity relative">
                    <ShoppingBag size={15} className="sm:w-[18px] sm:h-[18px]" />
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-foreground text-background text-[8px] rounded-full flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search overlay */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b border-border animate-fade-in">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto px-4 py-6">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="luxury-input text-center border-0 border-b text-lg"
              />
            </form>
          </div>
        )}

        {/* Category nav */}
        <nav className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-6 sm:gap-8 h-10 sm:h-12">
              {navCategories.map(cat => (
                <Link key={cat.name} to={cat.path} className="luxury-body text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 bg-background border-b border-border animate-fade-in">
            <div className="px-4 py-4 space-y-3">
              {navCategories.map(cat => (
                <Link
                  key={cat.name}
                  to={cat.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block luxury-body text-[11px] py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Mobile bottom floating buttons - Chat & Cart */}
      <div className="fixed bottom-4 right-4 z-50 sm:hidden flex flex-col gap-2.5">
        <button
          onClick={() => {/* Chat functionality */}}
          className="w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm text-foreground flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-border/50 hover:bg-background/80 transition-all"
        >
          <MessageCircle size={17} />
        </button>
        <button
          onClick={() => setIsCartOpen(true)}
          className="w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm text-foreground flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-border/50 hover:bg-background/80 transition-all relative"
        >
          <ShoppingBag size={17} />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] rounded-full flex items-center justify-center font-medium">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
};

export default Header;
