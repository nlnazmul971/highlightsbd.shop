import { useState, useRef, useEffect } from 'react';
import { Heart, Eye, ShoppingBag, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, getProductImage } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  reviewStats?: Record<string, { avg: number; count: number }>;
  hoverImageUrl?: string | null;
  isSoldOut?: boolean;
}

const ProductCard = ({ product, reviewStats = {}, hoverImageUrl, isSoldOut = false }: ProductCardProps) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const [showSizes, setShowSizes] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const hoverImage = hoverImageUrl ?? null;

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
    <div className="group animate-fade-in">
      <Link to={`/product/${product.id}`}>
        <div
          className="relative overflow-hidden aspect-[3/4] bg-muted"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main image - always rendered */}
          <img
            src={getProductImage(product.image_url)}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out ${
              isHovered && hoverImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
            }`}
            loading="eager"
            decoding="async"
          />
          {/* Hover image - preloaded, hidden until hover */}
          {hoverImage && (
            <img
              src={hoverImage}
              alt={`${product.name} alternate`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              loading="eager"
              decoding="async"
            />
          )}

          {/* Discount badge with subtle shadow */}
          {discountPercent && (
            <span className="absolute top-3 left-3 text-[10px] tracking-[0.15em] uppercase font-semibold px-2.5 py-1 text-foreground bg-foreground/10 backdrop-blur-sm">
              -{discountPercent}%
            </span>
          )}

          {/* Wishlist + Quick view - fully transparent */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <button
              onClick={handleWishlist}
              className={`p-2 sm:p-2.5 bg-transparent hover:bg-background/30 backdrop-blur-none transition-all duration-300 ${
                isInWishlist(product.id) ? 'text-destructive' : 'text-foreground'
              }`}
            >
              <Heart size={15} className="sm:w-4 sm:h-4 drop-shadow-sm" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
            </button>
            <Link
              to={`/product/${product.id}`}
              onClick={e => e.stopPropagation()}
              className="p-2 sm:p-2.5 bg-transparent hover:bg-background/30 backdrop-blur-none transition-all duration-300 text-foreground"
            >
              <Eye size={15} className="sm:w-4 sm:h-4 drop-shadow-sm" />
            </Link>
          </div>

          {/* Size selector popup */}
          {showSizes && (
            <div
              ref={popupRef}
              className="absolute inset-x-0 bottom-0 bg-background/80 backdrop-blur-xl p-3 animate-scale-in z-10"
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
                    className="min-w-[36px] h-9 px-2 border border-border/50 text-xs tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors bg-background/50 backdrop-blur-sm"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart button - transparent with blur */}
          {!showSizes && (
            <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <button
                onClick={handleOpenSizes}
                className="w-full py-2.5 sm:py-3 text-[9px] sm:text-[10px] flex items-center justify-center gap-1.5 sm:gap-2 bg-foreground/50 backdrop-blur-md text-background tracking-[0.2em] uppercase transition-all duration-300 hover:bg-foreground/70"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <ShoppingBag size={12} className="sm:w-[13px] sm:h-[13px]" />
                Add to Cart
              </button>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="pt-3 pb-1 px-1">
          <h3 className="text-[13px] font-normal tracking-wide text-foreground/90 leading-tight">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm font-medium text-foreground">৳{product.price.toLocaleString()}</span>
            {product.original_price && (
              <span className="text-[11px] text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>
            )}
          </div>
          {reviewStats[product.id] && (
            <div className="flex items-center gap-1 mt-1.5">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={11}
                    className={star <= Math.round(reviewStats[product.id].avg) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/20'}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">({reviewStats[product.id].avg.toFixed(1)})</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
