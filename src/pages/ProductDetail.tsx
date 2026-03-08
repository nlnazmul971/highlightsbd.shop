import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Minus, Plus, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useProduct, useProductReviews } from '@/hooks/useSupabase';
import { getProductImage } from '@/data/products';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

const ProductDetail = () => {
  const { id } = useParams();
  const { data: product, isLoading } = useProduct(id || '');
  const { data: reviews = [] } = useProductReviews(id || '');
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="aspect-[3/4] overflow-hidden bg-secondary">
            <img src={getProductImage(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="py-4 lg:py-8">
            <p className="luxury-body text-[11px] text-muted-foreground mb-2">{product.category}</p>
            <h1 className="luxury-heading text-3xl sm:text-4xl tracking-[0.1em] mb-4">{product.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-light">৳{product.price.toLocaleString()}</span>
              {product.original_price && <span className="text-lg text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">{product.description}</p>

            <div className="mb-6">
              <p className="luxury-body text-[11px] mb-3">Size</p>
              <div className="flex gap-2">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)} className={`w-12 h-12 text-xs tracking-wider border transition-colors ${size === s ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground'}`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="luxury-body text-[11px] mb-3">Color — {color}</p>
              <div className="flex gap-2">
                {product.colors.map(c => (
                  <button key={c.name} onClick={() => setSelectedColor(c.name)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.name ? 'border-foreground scale-110' : 'border-border'}`} style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="luxury-body text-[11px] mb-3">Quantity</p>
              <div className="inline-flex items-center border border-border">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-accent transition-colors"><Minus size={14} /></button>
                <span className="w-12 text-center text-sm">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-accent transition-colors"><Plus size={14} /></button>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button onClick={handleAddToCart} className="flex-1 luxury-button-primary">Add to Cart</button>
              <button onClick={() => toggleItem(product)} className={`p-4 border border-border hover:bg-accent transition-colors ${isInWishlist(product.id) ? 'text-destructive' : ''}`}>
                <Heart size={20} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
            <button onClick={handleBuyNow} className="w-full luxury-button-outline">Buy Now</button>
            <p className="text-xs text-muted-foreground mt-4">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>

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
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
