import { useSearchParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { categories } from '@/data/products';
import { useProducts, useStoreSettings } from '@/hooks/useSupabase';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';
  const { data: products = [], isLoading } = useProducts(
    activeCategory || undefined,
    searchQuery || undefined
  );
  const { data: allProducts = [] } = useProducts();
  const { data: settings = {} } = useStoreSettings();
  const { viewedIds } = useRecentlyViewed();

  const showProducts = activeCategory || searchQuery;

  const recentProducts = viewedIds
    .map(id => allProducts.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, 6);

  // Dynamic posters from settings
  const rawPosters = settings['homepage_posters'];
  const dynamicPosters = rawPosters ? JSON.parse(rawPosters) : [];
  const posters = dynamicPosters.length > 0
    ? dynamicPosters.map((p: any, i: number) => ({
        ...p,
        image: p.image || defaultPosters[i]?.image || '',
      }))
    : defaultPosters;

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

        {/* Fancy Posters */}
        {!showProducts && (
          <section className="mt-20 sm:mt-28">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {posters.map((poster: any, i: number) => (
                <Link key={i} to={poster.link || '/'} className="relative group overflow-hidden cursor-pointer block">
                  <img src={poster.image} alt={poster.title} className="w-full aspect-[3/4] sm:aspect-square object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="luxury-body text-[10px] text-background/70 mb-2">{poster.subtitle}</p>
                    <h3 className="luxury-heading text-2xl sm:text-3xl text-background tracking-[0.1em]">{poster.title}</h3>
                    <div className="w-8 h-px bg-background/50 mt-3" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        {recentProducts.length > 0 && (
          <section className="mt-20">
            <div className="text-center mb-10">
              <h2 className="luxury-heading text-2xl sm:text-3xl tracking-[0.15em]">Recently Viewed</h2>
              <div className="w-12 h-px bg-foreground mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {recentProducts.map(product => product && <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
