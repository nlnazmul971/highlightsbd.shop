import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Heart, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

const navCategories = [
  { name: 'T-Shirt', path: '/?category=T-Shirt' },
  { name: 'Winter', path: '/?category=Winter' },
  { name: 'Shirts', path: '/?category=Shirts' },
  { name: 'Knit Polos', path: '/?category=Knit Polos' },
  { name: 'Pant', path: '/?category=Pant' },
  { name: 'Panjabi', path: '/?category=Panjabi' },
  { name: 'Kafsu', path: '/?category=Kafsu' },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount, setIsCartOpen } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();

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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-md shadow-sm' : 'bg-background'}`}>
      {/* Top bar */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left - Search + Mobile Menu */}
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-2 hover:opacity-60 transition-opacity">
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:opacity-60 transition-opacity">
                <Search size={20} />
              </button>
            </div>

            {/* Center - Logo */}
            <Link to="/" className="luxury-heading text-sm sm:text-base tracking-[0.3em] font-semibold">
              HIGHLIGHTS
            </Link>

            {/* Right - Icons */}
            <div className="flex items-center gap-0.5 sm:gap-3">
              <Link to="/wishlist" className="p-1.5 sm:p-2 hover:opacity-60 transition-opacity relative">
                <Heart size={18} className="sm:w-5 sm:h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground text-background text-[9px] rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
              <Link to="/admin" className="p-1.5 sm:p-2 hover:opacity-60 transition-opacity">
                <User size={18} className="sm:w-5 sm:h-5" />
              </Link>
              <button onClick={() => setIsCartOpen(true)} className="p-1.5 sm:p-2 hover:opacity-60 transition-opacity relative">
                <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground text-background text-[9px] rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

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

      {/* Category nav - Desktop */}
      <nav className="hidden sm:block border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-8 h-12">
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
  );
};

export default Header;
