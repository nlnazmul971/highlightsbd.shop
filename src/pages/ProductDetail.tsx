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
  const images = [mainImage, ...additionalImages.map((img: any) => img.image_url)];
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [mobileZoom, setMobileZoom] = useState(false);
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
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Thumbnails */}
      <div className="hidden sm:flex sm:flex-col gap-2 sm:max-h-[500px] lg:max-h-[600px] overflow-y-auto">
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

      {/* Main image - Adjusted height for PC view */}
      <div
        ref={imgRef}
        className="flex-1 aspect-[3/4] lg:h-[600px] overflow-hidden bg-secondary cursor-crosshair relative border border-border"
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
        <button
          onClick={() => setMobileZoom(true)}
          className="sm:hidden absolute bottom-3 right-3 p-2.5 bg-foreground/60 backdrop-blur-sm text-background rounded-full shadow-lg"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      {mobileZoom && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" style={{ touchAction: 'pinch-zoom' }}>
          <button onClick={() => setMobileZoom(false)} className="fixed top-4 right-4 z-[101] p-2.5 bg-white/20 text-white rounded-full"><X size={20} /></button>
          <img src={images[activeIndex]} alt={name} className="w-full h-auto max-h-screen object-contain" />
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
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="pt-44 text-center">Loading...</div></div>;
  if (!product) return <div className="min-h-screen bg-background"><Header /><div className="pt-44 text-center"><Link to="/" className="luxury-button-outline">Product not found. Back to Shop</Link></div></div>;

  const size = selectedSize || product.sizes[0];
  const color = selectedColor || product.colors[0]?.name || '';
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const productStock = allSizeStock.filter(s => s.product_id === product.id);
  const getSizeAvailable = (sz: string) => {
    const s = productStock.find(st => st.size === sz);
    if (!s) return product.stock > 0 ? 999 : 0;
    return s.total_stock - s.sold_count + s.cancelled_count + s.returned_count;
  };
  const currentSizeAvailable = getSizeAvailable(size);
  const allSoldOut = productStock.length > 0 ? product.sizes.every(sz => getSizeAvailable(sz) <= 0) : product.stock <= 0;

  const handleAddToCart = () => addItem(product, size, color, quantity);
  const handleBuyNow = () => { addItem(product, size, color, quantity); window.location.href = '/checkout'; };

  return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link><span>/</span>
          <Link to={`/?category=${product.category}`} className="hover:text-foreground">{product.category}</Link><span>/</span>
          <span className="text-foreground truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <ProductImageGallery mainImage={getProductImage(product.image_url)} name={product.name} productId={product.id} />

          <div className="space-y-4">
            <div>
              <p className="luxury-body text-[10px] text-muted-foreground mb-1 tracking-widest">{product.category}</p>
              <h1 className="luxury-heading text-xl sm:text-3xl mb-2">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-light text-foreground">৳{product.price.toLocaleString()}</span>
                {product.original_price && <span className="text-sm text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>}
              </div>
            </div>

            <div className="space-y-6">
              {/* Size Selection */}
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2">Size: {size}</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className={`h-10 px-4 text-xs border transition-all ${getSizeAvailable(s) <= 0 ? 'opacity-30 line-through' : size === s ? 'bg-foreground text-background border-foreground' : 'hover:border-foreground'}`}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2">Quantity</p>
                <div className="inline-flex items-center border border-border">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5"><Minus size={14} /></button>
                  <span className="w-10 text-center text-sm">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(currentSizeAvailable, quantity + 1))} className="p-2.5"><Plus size={14} /></button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {allSoldOut ? (
                  <div className="w-full py-3 text-center bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-widest">SOLD OUT</div>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={handleAddToCart} className="flex-1 luxury-button-primary py-3 text-xs uppercase tracking-widest">Add to Cart</button>
                    <button onClick={() => toggleItem(product)} className={`p-3 border ${isInWishlist(product.id) ? 'text-destructive border-destructive' : 'border-border'}`}><Heart size={18} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} /></button>
                  </div>
                )}
                {!allSoldOut && <button onClick={handleBuyNow} className="w-full luxury-button-outline py-3 text-xs uppercase tracking-widest">Buy It Now</button>}
              </div>

              {/* Size Chart - Placed right under actions in PC view */}
              {product.size_chart && (
                <div className="pt-6 border-t border-border">
                  <h3 className="text-xs uppercase tracking-widest mb-3 font-semibold text-foreground">Size Chart</h3>
                  <div className="overflow-x-auto">
                    {(() => {
                      let chartData = [];
                      try { chartData = typeof product.size_chart === 'string' ? JSON.parse(product.size_chart) : product.size_chart; } catch (e) { return null; }
                      if (!Array.isArray(chartData) || chartData.length === 0) return null;
                      return (
                        <table className="w-full text-[11px] border-collapse border border-border">
                          <thead>
                            <tr className="bg-muted/50">
                              {Object.keys(chartData[0]).map(k => <th key={k} className="border border-border px-2 py-1.5 text-left font-medium uppercase text-muted-foreground">{k}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {chartData.map((row, i) => (
                              <tr key={i}>{Object.values(row).map((v, j) => <td key={j} className="border border-border px-2 py-1.5 text-foreground">{v}</td>)}</tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 border-t border-border pt-12">
            <h2 className="luxury-heading text-center text-2xl tracking-widest mb-10">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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