import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Minus, Plus, Star, Truck, Shield, RotateCcw, Send } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useProduct, useProductReviews, useRelatedProducts } from '@/hooks/useSupabase';
import ProductCard from '@/components/ProductCard';
import { getProductImage } from '@/data/products';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const ProductImageGallery = ({ mainImage, name }: { mainImage: string; name: string }) => {
  const images = [mainImage, mainImage, mainImage, mainImage];
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  // Mobile swipe
  const touchStart = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeIndex < images.length - 1) setActiveIndex(activeIndex + 1);
      if (diff < 0 && activeIndex > 0) setActiveIndex(activeIndex - 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Thumbnails - side on desktop, bottom on mobile */}
      <div className="hidden sm:flex sm:flex-col gap-2 sm:max-h-[600px]">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 w-16 h-20 overflow-hidden border-2 transition-all ${
              i === activeIndex ? 'border-foreground' : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <img src={img} alt={`${name} view ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div
        ref={imgRef}
        className="flex-1 aspect-[3/4] overflow-hidden bg-secondary cursor-crosshair relative"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[activeIndex]}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-200"
          style={zoomed ? { transform: 'scale(2.5)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
          draggable={false}
        />
      </div>

      {/* Mobile dot indicators */}
      <div className="flex sm:hidden items-center justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-foreground w-5' : 'bg-muted-foreground/30'}`}
          />
        ))}
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const { data: product, isLoading } = useProduct(id || '');
  const { data: reviews = [] } = useProductReviews(id || '');
  const { data: relatedProducts = [] } = useRelatedProducts(product?.category || '', id || '');
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const { addView } = useRecentlyViewed();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product?.id) addView(product.id);
  }, [product?.id, addView]);

  // Scroll to top on product change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <div className="pt-36 sm:pt-44 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          <div className="aspect-[3/4] bg-muted animate-pulse" />
          <div className="space-y-4 py-4">
            <div className="h-4 bg-muted rounded w-20 animate-pulse" />
            <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <div className="pt-36 sm:pt-44 text-center">
        <p className="text-muted-foreground mb-4">Product not found.</p>
        <Link to="/" className="luxury-button-outline inline-block">Back to Shop</Link>
      </div>
    </div>
  );

  const size = selectedSize || product.sizes[0];
  const color = selectedColor || product.colors[0]?.name || '';
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const handleAddToCart = () => addItem(product, size, color, quantity);
  const handleBuyNow = () => { addItem(product, size, color, quantity); window.location.href = '/checkout'; };

  return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20 sm:pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-4 sm:mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/?category=${product.category}`} className="hover:text-foreground transition-colors">{product.category}</Link>
          <span>/</span>
          <span className="text-foreground truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14">
          <ProductImageGallery mainImage={getProductImage(product.image_url)} name={product.name} />

          <div className="py-0 lg:py-4">
            <p className="luxury-body text-[10px] text-muted-foreground mb-1 tracking-[0.15em]">{product.category}</p>
            <h1 className="luxury-heading text-lg sm:text-3xl tracking-[0.08em] mb-1 sm:mb-2">{product.name}</h1>
            {(product.brand || product.sku) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 sm:mb-3">
                {product.brand && <span className="text-[11px] text-muted-foreground">Brand: <span className="text-foreground font-medium">{product.brand}</span></span>}
                {product.sku && <span className="text-[11px] text-muted-foreground">SKU: <span className="text-foreground font-medium">{product.sku}</span></span>}
              </div>
            )}

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={12} fill={j < Math.round(avgRating) ? 'currentColor' : 'none'} className={j < Math.round(avgRating) ? 'text-foreground' : 'text-muted-foreground/30'} />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">({reviews.length} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 sm:gap-3 mb-3 sm:mb-6">
              <span className="text-lg sm:text-2xl font-light">৳{product.price.toLocaleString()}</span>
              {product.original_price && (
                <>
                  <span className="text-xs sm:text-sm text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>
                  <span className="text-[10px] sm:text-xs text-destructive font-medium">
                    -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                  </span>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 sm:mb-8">{product.description}</p>

            {/* Size */}
            <div className="mb-3 sm:mb-6">
              <p className="luxury-body text-[10px] mb-1.5 sm:mb-2 tracking-[0.1em]">Size — <span className="text-muted-foreground">{size}</span></p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`min-w-[36px] h-9 sm:min-w-[40px] sm:h-11 px-2.5 sm:px-3 text-[11px] sm:text-xs tracking-wider border transition-all ${
                      size === s ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground'
                    }`}>{s}</button>
                ))}
              </div>
            </div>




            {/* Quantity */}
            <div className="mb-4 sm:mb-8">
              <p className="luxury-body text-[10px] mb-1.5 sm:mb-2 tracking-[0.1em]">Quantity</p>
              <div className="inline-flex items-center border border-border">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 sm:p-3 hover:bg-accent transition-colors"><Minus size={13} /></button>
                <span className="w-9 sm:w-12 text-center text-xs sm:text-sm">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-2 sm:p-3 hover:bg-accent transition-colors"><Plus size={13} /></button>
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
            </div>

            {/* CTA - visible on both mobile & desktop */}
            <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-3">
              <button onClick={handleAddToCart} className="flex-1 luxury-button-primary py-2.5 sm:py-3.5 text-[11px] sm:text-sm">Add to Cart</button>
              <button onClick={() => toggleItem(product)}
                className={`p-2.5 sm:p-3.5 border border-border hover:bg-accent transition-colors ${isInWishlist(product.id) ? 'text-destructive' : ''}`}>
                <Heart size={16} className="sm:w-[18px] sm:h-[18px]" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
            <button onClick={handleBuyNow} className="w-full luxury-button-outline py-2.5 sm:py-3.5 text-[11px] sm:text-sm">Buy Now</button>

            {/* Trust badges */}
            <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Truck size={14} className="sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-[11px]">Free Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Shield size={14} className="sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-[11px]">Secure Payment</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <RotateCcw size={14} className="sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-[11px]">Easy Returns</span>
              </div>
            </div>

            {/* Review Form & Reviews */}
            <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-border">
              <h3 className="luxury-heading text-base sm:text-lg tracking-[0.1em] mb-4 sm:mb-6">Reviews ({reviews.length})</h3>
              
              <ReviewForm productId={product.id} />

              {reviews.length > 0 && (
                <div className="space-y-3 sm:space-y-4 mt-6">
                  {reviews.map(r => (
                    <div key={r.id} className="pb-3 sm:pb-4 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">{Array.from({ length: 5 }).map((_, j) => <Star key={j} size={11} fill={j < r.rating ? 'currentColor' : 'none'} className={j < r.rating ? 'text-foreground' : 'text-muted-foreground/30'} />)}</div>
                        <span className="text-[11px] font-medium">{r.name}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 sm:mt-20 mb-8 sm:mb-12">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="luxury-heading text-xl sm:text-3xl tracking-[0.15em]">You May Also Like</h2>
              <div className="w-12 h-px bg-foreground mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
