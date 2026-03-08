import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { categories } from '@/data/products';
import { useProducts } from '@/hooks/useSupabase';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';
  const { data: products = [], isLoading } = useProducts(
    activeCategory || undefined,
    searchQuery || undefined
  );

  const showProducts = activeCategory || searchQuery;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartDrawer />
      {!showProducts && <Hero />}

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${showProducts ? 'pt-36 sm:pt-40' : 'pt-16 sm:pt-20'}`}>
        <div className="text-center mb-12">
          {searchQuery ? (
            <h2 className="luxury-heading text-3xl sm:text-4xl tracking-[0.15em]">Search: "{searchQuery}"</h2>
          ) : activeCategory && activeCategory !== 'All' ? (
            <h2 className="luxury-heading text-3xl sm:text-4xl tracking-[0.15em]">{activeCategory}</h2>
          ) : (
            <h2 className="luxury-heading text-3xl sm:text-4xl tracking-[0.15em]">Our Collection</h2>
          )}
          <div className="w-12 h-px bg-foreground mx-auto mt-4" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-12">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSearchParams(cat === 'All' ? {} : { category: cat })}
              className={`luxury-body text-[10px] sm:text-[11px] pb-1 border-b-2 transition-all ${
                (cat === 'All' && !activeCategory) || activeCategory === cat
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-muted" />
                <div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-4 bg-muted rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
