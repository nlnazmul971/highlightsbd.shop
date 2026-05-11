import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Minus, Plus, Star, Truck, Shield, RotateCcw, Send, ZoomIn, X } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useProduct, useProductReviews, useRelatedProducts, useProductImages, useStoreSettings, useAllSizeStock } from '@/hooks/useSupabase';
import ProductCard from '@/components/ProductCard';
import { getProductImage } from '@/data/products';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const ProductImageGallery = ({ mainImage, name, productId }: { mainImage: string; name: string; productId: string }) => {
  const { data: additionalImages = [] } = useProductImages(productId);
  
  // Build images array: main image + additional images
  const images = [mainImage, ...additionalImages.map((img: any) => img.image_url)];
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [mobileZoom, setMobileZoom] = useState(false);
  const [mobileZoomPos, setMobileZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

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
    <div className="flex flex-col sm:flex-row gap-3 lg:h-full">
      {/* Thumbnails */}
      <div className="hidden sm:flex sm:flex-col gap-2 sm:max-h-[600px] lg:max-h-full overflow-y-auto">
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
        className="flex-1 aspect-[2/3] lg:h-[700px] lg:max-h-[700px] overflow-hidden bg-secondary cursor-crosshair relative border border-border"
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
        {/* Mobile zoom button */}
        <button
          onClick={() => setMobileZoom(true)}
          className="sm:hidden absolute bottom-3 right-3 p-2.5 bg-foreground/60 backdrop-blur-sm text-background rounded-full shadow-lg active:scale-95 transition-transform"
          aria-label="Zoom image"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      {/* Mobile fullscreen zoom overlay - pinch to zoom */}
      {mobileZoom && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          style={{ touchAction: 'pinch-zoom' }}
        >
          <button
            onClick={() => setMobileZoom(false)}
            className="fixed top-4 right-4 z-[101] p-2.5 bg-white/20 backdrop-blur-sm text-white rounded-full shadow-lg"
            aria-label="Close zoom"
          >
            <X size={20} />
          </button>
          <img
            src={images[activeIndex]}
            alt={name}
            className="w-full h-auto max-h-screen object-contain"
            draggable={false}
          />
        </div>
      )}

      {/* Mobile thumbnail strip */}
      <div className="flex sm:hidden items-center justify-start gap-1.5 overflow-x-auto py-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 w-12 h-14 overflow-hidden border transition-all ${
              i === activeIndex ? 'border-foreground' : 'border-transparent opacity-50'
            }`}
          >
            <img src={img} alt={`${name} view ${i + 1}`} className="w-full h-full object-cover" />
          </button>
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
  const { addItem, setShowPopup } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const { addView } = useRecentlyViewed();
  const { data: storeSettings } = useStoreSettings();
  const { data: allSizeStock = [] } = useAllSizeStock();
  const messageLink = storeSettings?.product_message_link || storeSettings?.footer_messenger || 'https://m.me/highlightbd';
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product?.id) addView(product.id);
  }, [product?.id, addView]);

  useEffect(() => {
    if (!product) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'view_item',
      ecommerce: {
        currency: 'BDT',
        value: product.price,
        detail: {
          products: [{
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
          }],
        },
        items: [{
          item_id: product.id,
          item_name: product.name,
          category: product.category,
          price: product.price,
        }],
      },
    });
  }, [product?.id]);

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

  // Check sold out per size
  const productStock = allSizeStock.filter(s => s.product_id === product.id);
  const getSizeAvailable = (sz: string) => {
    const s = productStock.find(st => st.size === sz);
    if (!s) return product.stock > 0 ? 999 : 0; // fallback to product.stock if no size stock data
    return s.total_stock - s.sold_count + s.cancelled_count + s.returned_count;
  };
  const currentSizeAvailable = getSizeAvailable(size);
  const allSoldOut = productStock.length > 0
    ? product.sizes.every(sz => getSizeAvailable(sz) <= 0)
    : product.stock <= 0;

  const handleAddToCart = () => addItem(product, size, color, quantity);
  const handleBuyNow = () => {
    addItem(product, size, color, quantity);
    setShowPopup(false);
    window.location.href = '/checkout';
  };

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
          <ProductImageGallery mainImage={getProductImage(product.image_url)} name={product.name} productId={product.id} />

          <div className="py-0 lg:py-4">
            <p className="luxury-body text-[10px] text-muted-foreground mb-1 tracking-[0.15em]">{product.category}</p>
            <h1 className="luxury-heading text-lg sm:text-3xl tracking-[0.08em] mb-1 sm:mb-2">{product.name}</h1>
            {(product.brand || product.sku) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 sm:mb-3">
                {product.brand && <span className="text-[11px] text-muted-foreground">Brand: <span className="text-foreground font-medium">{product.brand}</span></span>}
                {product.sku && <span className="text-[11px] text-muted-foreground">SKU: <span className="text-foreground font-medium">{product.sku}</span></span>}
              </div>
            )}

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

            <div className="mb-3 sm:mb-6">
              <p className="luxury-body text-[10px] mb-1.5 sm:mb-2 tracking-[0.1em]">Size — <span className="text-muted-foreground">{size}</span></p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {product.sizes.map(s => {
                  const avail = getSizeAvailable(s);
                  return (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className={`min-w-[36px] h-9 sm:min-w-[40px] sm:h-11 px-2.5 sm:px-3 text-[11px] sm:text-xs tracking-wider border transition-all relative ${
                        avail <= 0 ? 'opacity-40 line-through' :
                        size === s ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground'
                      }`}>{s}</button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4 sm:mb-8">
              <p className="luxury-body text-[10px] mb-1.5 sm:mb-2 tracking-[0.1em]">Quantity</p>
              <div className="inline-flex items-center border border-border">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 sm:p-3 hover:bg-accent transition-colors"><Minus size={13} /></button>
                <span className="w-9 sm:w-12 text-center text-xs sm:text-sm">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(currentSizeAvailable || product.stock, quantity + 1))} className="p-2 sm:p-3 hover:bg-accent transition-colors"><Plus size={13} /></button>
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">
                {currentSizeAvailable > 0 ? `${currentSizeAvailable} in stock` : allSoldOut ? 'Sold Out' : 'This size is out of stock'}
              </p>
            </div>

            {allSoldOut ? (
              <div className="space-y-2">
                <div className="w-full py-3.5 text-center bg-destructive/10 text-destructive text-sm font-medium tracking-wider uppercase">SOLD OUT</div>
                <button onClick={() => toggleItem(product)}
                  className={`w-full py-2.5 sm:py-3.5 text-[11px] sm:text-sm flex items-center justify-center gap-2 border transition-colors ${isInWishlist(product.id) ? 'border-destructive text-destructive' : 'border-border hover:bg-accent'}`}>
                  <Heart size={16} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                  {isInWishlist(product.id) ? 'In Wishlist' : 'Add to Wishlist'}
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <button onClick={handleAddToCart} disabled={currentSizeAvailable <= 0} className="flex-1 luxury-button-primary py-2.5 sm:py-3.5 text-[11px] sm:text-sm disabled:opacity-40">Add to Cart</button>
                  <button onClick={() => toggleItem(product)}
                    className={`p-2.5 sm:p-3.5 border border-border hover:bg-accent transition-colors ${isInWishlist(product.id) ? 'text-destructive' : ''}`}>
                    <Heart size={16} className="sm:w-[18px] sm:h-[18px]" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <button onClick={handleBuyNow} disabled={currentSizeAvailable <= 0} className="w-full luxury-button-outline py-2.5 sm:py-3.5 text-[11px] sm:text-sm disabled:opacity-40">Buy Now</button>
              </>
            )}
            <a
              href={messageLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 sm:py-3.5 text-[11px] sm:text-sm flex items-center justify-center gap-2 mt-2 border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors tracking-[0.15em] uppercase"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Message Now
            </a>

            <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Shield size={14} className="sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-[11px]">Secure Payment</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Truck size={14} className="sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-[11px]">Fast Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <RotateCcw size={14} className="sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-[11px]">Easy Returns</span>
              </div>
            </div>

            {/* Size Chart Section - Updated for better data handling */}
            {product.size_chart && (
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
                <h3 className="luxury-heading text-base sm:text-lg tracking-[0.1em] mb-3 sm:mb-4">Size Chart</h3>
                <div className="overflow-x-auto">
                  {(() => {
                    let chartData: any[] = [];
                    try {
                      chartData = typeof product.size_chart === 'string' 
                        ? JSON.parse(product.size_chart) 
                        : product.size_chart;
                    } catch (e) {
                      console.error("Size chart error:", e);
                    }

                    if (!Array.isArray(chartData) || chartData.length === 0) return null;

                    return (
                      <table className="w-full text-xs sm:text-sm border border-border">
                        <thead>
                          <tr className="bg-muted/30">
                            {Object.keys(chartData[0]).map(key => (
                              <th key={key} className="px-3 py-2 text-left text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground border-b border-border font-medium">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/10">
                              {Object.values(row).map((val: any, j: number) => (
                                <td key={j} className="px-3 py-2 text-foreground">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}

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

const ReviewForm = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    if (!comment.trim()) { toast.error('Please write a comment'); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user?.uid || null,
        name: name.trim(),
        rating,
        comment: comment.trim(),
      });
      if (error) throw error;
      toast.success('Review submitted!');
      setRating(0); setName(''); setComment('');
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border p-4 space-y-3 mb-4">
      <p className="text-xs tracking-wider uppercase text-muted-foreground font-medium">Write a Review</p>
      <div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(i + 1)}
            >
              <Star
                size={18}
                fill={(hoverRating || rating) > i ? 'currentColor' : 'none'}
                className={(hoverRating || rating) > i ? 'text-foreground' : 'text-muted-foreground/30'}
              />
            </button>
          ))}
        </div>
      </div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Your Name"
        className="luxury-input text-xs"
        maxLength={100}
        required
      />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Write your review..."
        className="luxury-input text-xs min-h-[60px]"
        maxLength={1000}
        required
      />
      <button
        type="submit"
        disabled={submitting}
        className="luxury-button-primary text-[10px] py-2 px-6 inline-flex items-center gap-1.5"
      >
        <Send size={12} />
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ProductDetail;