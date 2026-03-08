import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { getProductImage } from '@/data/products';
import { Heart, ShoppingBag, X } from 'lucide-react';

const Wishlist = () => {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
        <h1 className="luxury-heading text-3xl tracking-[0.15em] text-center mb-12">Wishlist</h1>
        {items.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Your wishlist is empty</p>
            <Link to="/" className="luxury-button-outline mt-6 inline-block">Browse Collection</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map(product => (
              <div key={product.id} className="luxury-card group">
                <Link to={`/product/${product.id}`}>
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img src={getProductImage(product.image_url)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <button onClick={(e) => { e.preventDefault(); removeItem(product.id); }} className="absolute top-3 right-3 p-2 bg-background/90 hover:bg-background transition-colors"><X size={14} /></button>
                    <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={(e) => { e.preventDefault(); addItem(product, product.sizes[1] || product.sizes[0], product.colors[0]?.name || ''); }} className="w-full luxury-button-primary py-3 text-[10px] flex items-center justify-center gap-2">
                        <ShoppingBag size={14} /> Add to Cart
                      </button>
                    </div>
                  </div>
                </Link>
                <div className="p-4">
                  <h3 className="text-sm font-normal tracking-wide">{product.name}</h3>
                  <span className="text-sm font-medium mt-1 block">৳{product.price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
