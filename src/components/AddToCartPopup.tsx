import { CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { getProductImage } from '@/data/products';
import { useEffect } from 'react';

const AddToCartPopup = () => {
  const { showPopup, setShowPopup, lastAddedItem } = useCart();

  useEffect(() => {
    if (!showPopup) return;
    const timer = setTimeout(() => setShowPopup(false), 5000);
    return () => clearTimeout(timer);
  }, [showPopup, setShowPopup]);

  if (!showPopup || !lastAddedItem) return null;

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={() => setShowPopup(false)} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-md bg-background border border-border shadow-xl animate-fade-in">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-accent/30">
          <div className="flex items-center gap-2">
            <CheckCircle size={15} className="text-foreground" />
            <span className="text-xs tracking-wide uppercase" style={{ fontFamily: 'var(--font-body)' }}>Added to Cart</span>
          </div>
          <button onClick={() => setShowPopup(false)} className="p-1 hover:opacity-60 transition-opacity">
            <X size={15} />
          </button>
        </div>
        <div className="flex items-center gap-3 p-4">
          <img
            src={getProductImage(lastAddedItem.product.image_url)}
            alt={lastAddedItem.product.name}
            className="w-14 h-[72px] object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate">{lastAddedItem.product.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{lastAddedItem.size} / {lastAddedItem.color}</p>
            <p className="text-sm font-medium mt-1">৳{lastAddedItem.product.price.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={() => setShowPopup(false)}
            className="flex-1 py-2.5 text-[11px] uppercase tracking-[0.12em] border border-border hover:bg-accent transition-colors"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Continue Shopping
          </button>
          <Link
            to="/checkout"
            onClick={() => setShowPopup(false)}
            className="flex-1 py-2.5 text-[11px] uppercase tracking-[0.12em] bg-foreground text-background text-center hover:bg-foreground/90 transition-colors"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Checkout
          </Link>
        </div>
      </div>
    </>
  );
};

export default AddToCartPopup;
