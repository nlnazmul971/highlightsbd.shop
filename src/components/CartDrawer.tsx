import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { getProductImage } from '@/data/products';
import { Link } from 'react-router-dom';

const CartDrawer = () => {
  const { items, removeItem, updateQuantity, total, isCartOpen, setIsCartOpen } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" onClick={() => setIsCartOpen(false)} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-background z-50 shadow-2xl animate-scale-in flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="luxury-heading text-xl tracking-[0.15em]">Shopping Bag</h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:opacity-60 transition-opacity"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} className="text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm">Your bag is empty</p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <img src={getProductImage(item.product.image_url)} alt={item.product.name} className="w-20 h-24 object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-normal truncate">{item.product.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.size} / {item.color}</p>
                    <p className="text-sm font-medium mt-1">৳{item.product.price.toLocaleString()}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)} className="p-1 border border-border hover:bg-accent transition-colors"><Minus size={12} /></button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)} className="p-1 border border-border hover:bg-accent transition-colors"><Plus size={12} /></button>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.product.id, item.size, item.color)} className="p-1 h-fit hover:opacity-60 transition-opacity"><X size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="p-6 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <span className="luxury-body text-[11px]">Subtotal</span>
              <span className="text-lg font-medium">৳{total.toLocaleString()}</span>
            </div>
            <Link to="/checkout" onClick={() => setIsCartOpen(false)} className="luxury-button-primary block text-center w-full">Checkout</Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
