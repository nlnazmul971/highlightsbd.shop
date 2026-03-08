import { useState, useRef, useEffect } from 'react';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, getProductImage } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from 'sonner';

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const [showSizes, setShowSizes] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  useEffect(() => {
    if (!showSizes) return;
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowSizes(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSizes]);

  const handleOpenSizes = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSizes(true);
  };

  const handleSelectSize = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, size, product.colors[0].name);
    setShowSizes(false);
    toast.success(`${product.name} (${size}) added to cart`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
  };

  return (
    <div className="luxury-card group animate-fade-in">
      <Link to={`/product/${product.id}`}>
        <div className="relative overflow-hidden aspect-[3/4]">
          <img src={getProductImage(product.image_url)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {discountPercent && <span className="luxury-badge absolute top-3 left-3">-{discountPercent}%</span>}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />

          {/* Wishlist + Quick view */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button onClick={handleWishlist} className={`p-1.5 sm:p-2.5 bg-background/90 backdrop-blur-sm hover:bg-background transition-colors ${isInWishlist(product.id) ? 'text-destructive' : ''}`}>
              <Heart size={13} className="sm:w-4 sm:h-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
            </button>
            <Link to={`/product/${product.id}`} onClick={e => e.stopPropagation()} className="p-1.5 sm:p-2.5 bg-background/90 backdrop-blur-sm hover:bg-background transition-colors">
              <Eye size={13} className="sm:w-4 sm:h-4" />
            </Link>
          </div>

          {/* Size selector popup */}
          {showSizes && (
            <div
              ref={popupRef}
              className="absolute inset-x-0 bottom-0 bg-background/95 backdrop-blur-md p-3 animate-scale-in z-10"
              onClick={e => { e.preventDefault(); e.stopPropagation(); }}
            >
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 text-center" style={{ fontFamily: 'var(--font-body)' }}>
                Select Size
              </p>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={(e) => handleSelectSize(e, size)}
                    className="min-w-[36px] h-9 px-2 border border-border text-xs tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart button */}
          {!showSizes && (
            <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <button onClick={handleOpenSizes} className="w-full py-2 sm:py-3 text-[9px] sm:text-[10px] flex items-center justify-center gap-1.5 sm:gap-2 bg-foreground/70 sm:bg-foreground text-background backdrop-blur-sm sm:backdrop-blur-none tracking-[0.15em] uppercase transition-colors hover:bg-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                <ShoppingBag size={11} className="sm:w-[13px] sm:h-[13px]" />
                Add to Cart
              </button>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-sm font-normal tracking-wide">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm font-medium">৳{product.price.toLocaleString()}</span>
            {product.original_price && <span className="text-xs text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
