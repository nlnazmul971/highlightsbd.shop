import { Heart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, getProductImage } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, product.sizes[1] || product.sizes[0], product.colors[0].name);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
  };

  return (
    <div className="luxury-card group animate-fade-in">
      <Link to={`/product/${product.id}`}>
        <div className="relative overflow-hidden aspect-[3/4]">
          <img src={getProductImage(product.image_url)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {discountPercent && <span className="luxury-badge absolute top-3 left-3">-{discountPercent}%</span>}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button onClick={handleWishlist} className={`p-2.5 bg-background/90 backdrop-blur-sm hover:bg-background transition-colors ${isInWishlist(product.id) ? 'text-destructive' : ''}`}>
              <Heart size={16} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
            </button>
            <Link to={`/product/${product.id}`} onClick={e => e.stopPropagation()} className="p-2.5 bg-background/90 backdrop-blur-sm hover:bg-background transition-colors">
              <Eye size={16} />
            </Link>
          </div>
          <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <button onClick={handleAddToCart} className="w-full luxury-button-primary py-3 text-[10px]">Add to Cart</button>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-sm font-normal tracking-wide">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm font-medium">৳{product.price.toLocaleString()}</span>
            {product.original_price && <span className="text-xs text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
