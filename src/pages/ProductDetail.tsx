import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Minus, Plus, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useProduct, useProductReviews, useRelatedProducts } from '@/hooks/useSupabase';
import ProductCard from '@/components/ProductCard';
import { getProductImage } from '@/data/products';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

const ProductImageGallery = ({ mainImage, name }: { mainImage: string; name: string }) => {
  // Generate multiple views from the same image (simulating angles)
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

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3">
      {/* Thumbnails */}
      <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[600px]">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 w-16 h-20 sm:w-18 sm:h-22 overflow-hidden border-2 transition-all ${
              i === activeIndex ? 'border-foreground' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img src={img} alt={`${name} view ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main image with zoom */}
      <div
        ref={imgRef}
        className="flex-1 aspect-[3/4] overflow-hidden bg-secondary cursor-crosshair relative"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={images[activeIndex]}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-200"
          style={zoomed ? {
            transform: 'scale(3)',
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
          } : undefined}
          draggable={false}
        />
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

  if (isLoading) return (
    <div className="min-h-screen bg-background"><Header /><CartDrawer />
      <div className="pt-40 text-center text-muted-foreground">Loading...</div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-background"><Header /><CartDrawer />
      <div className="pt-40 text-center"><p className="text-muted-foreground">Product not found.</p><Link to="/" className="luxury-button-outline mt-6 inline-block">Back to Shop</Link></div>
    </div>
  );

  const size = selectedSize || product.sizes[0];
  const color = selectedColor || product.colors[0]?.name || '';

  const handleAddToCart = () => addItem(product, size, color, quantity);
  const handleBuyNow = () => { addItem(product, size, color, quantity); window.location.href = '/checkout'; };

  return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-24">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-12">
          <ProductImageGallery mainImage={getProductImage(product.image_url)} name={product.name} />
          <div className="py-0 lg:py-4">
            <p className="luxury-body text-[10px] text-muted-foreground mb-0.5">{product.category}</p>
            <h1 className="luxury-heading text-[22px] sm:text-4xl tracking-[0.08em] mb-1.5 sm:mb-4">{product.name}</h1>
            <div className="flex items-center gap-2 mb-2 sm:mb-6">
              <span className="text-lg sm:text-2xl font-light">৳{product.price.toLocaleString()}</span>
              {product.original_price && <span className="text-sm sm:text-lg text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>}
            </div>
            <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-8">{product.description}</p>

            <div className="mb-3 sm:mb-6">
              <p className="luxury-body text-[10px] mb-1.5">Size</p>
              <div className="flex gap-1.5">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)} className={`w-9 h-9 sm:w-12 sm:h-12 text-xs tracking-wider border transition-colors ${size === s ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground'}`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="mb-3 sm:mb-6">
              <p className="luxury-body text-[10px] mb-1.5">Color — {color}</p>
              <div className="flex gap-1.5">
                {product.colors.map(c => (
                  <button key={c.name} onClick={() => setSelectedColor(c.name)} className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all ${color === c.name ? 'border-foreground scale-110' : 'border-border'}`} style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            </div>

            <div className="mb-4 sm:mb-8">
              <p className="luxury-body text-[10px] mb-1.5">Quantity</p>
              <div className="inline-flex items-center border border-border">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 sm:p-3 hover:bg-accent transition-colors"><Minus size={13} /></button>
                <span className="w-9 sm:w-12 text-center text-sm">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 sm:p-3 hover:bg-accent transition-colors"><Plus size={13} /></button>
              </div>
            </div>

            {/* Desktop CTA */}
            <div className="hidden sm:flex gap-2 mb-2.5">
              <button onClick={handleAddToCart} className="flex-1 luxury-button-primary">Add to Cart</button>
              <button onClick={() => toggleItem(product)} className={`p-3 border border-border hover:bg-accent transition-colors ${isInWishlist(product.id) ? 'text-destructive' : ''}`}>
                <Heart size={18} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
            <button onClick={handleBuyNow} className="hidden sm:block w-full luxury-button-outline">Buy Now</button>
            <p className="text-xs text-muted-foreground mt-2.5 mb-20 sm:mb-0">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>

      {/* Mobile sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background border-t border-border px-4 py-3 flex gap-2">
        <button onClick={handleAddToCart} className="flex-1 luxury-button-primary py-3 text-sm">Add to Cart</button>
        <button onClick={handleBuyNow} className="flex-1 luxury-button-outline py-3 text-sm">Buy Now</button>
        <button onClick={() => toggleItem(product)} className={`p-3 border border-border ${isInWishlist(product.id) ? 'text-destructive' : ''}`}>
          <Heart size={18} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
        </button>
      </div>

            {reviews.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="luxury-heading text-xl tracking-[0.1em] mb-6">Reviews</h3>
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="pb-4 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">{Array.from({ length: 5 }).map((_, j) => <Star key={j} size={12} fill={j < r.rating ? 'currentColor' : 'none'} className={j < r.rating ? 'text-foreground' : 'text-muted-foreground/30'} />)}</div>
                        <span className="text-xs text-muted-foreground">{r.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 mb-12">
            <div className="text-center mb-10">
              <h2 className="luxury-heading text-2xl sm:text-3xl tracking-[0.15em]">You May Also Like</h2>
              <div className="w-12 h-px bg-foreground mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
