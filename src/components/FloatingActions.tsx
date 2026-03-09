import { MessageCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const FloatingActions = () => {
  const { setIsCartOpen, itemCount } = useCart();

  const handleWhatsApp = () => {
    window.open('https://wa.me/8801XXXXXXXXX?text=Hi, I am interested in your products!', '_blank');
  };

  return (
    <div className="fixed right-6 bottom-6 z-40 hidden md:flex flex-col gap-3">
      <button
        onClick={handleWhatsApp}
        className="w-12 h-12 rounded-full border border-border bg-background shadow-lg flex items-center justify-center hover:bg-accent transition-colors"
        aria-label="Message on WhatsApp"
      >
        <MessageCircle size={20} className="text-foreground" />
      </button>
      <button
        onClick={() => setIsCartOpen(true)}
        className="relative w-12 h-12 rounded-full border border-border bg-background shadow-lg flex items-center justify-center hover:bg-accent transition-colors"
        aria-label="Open cart"
      >
        <ShoppingBag size={20} className="text-foreground" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
            {itemCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingActions;
