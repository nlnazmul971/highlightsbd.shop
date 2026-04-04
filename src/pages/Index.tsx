import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { categories } from '@/data/products';
import { useProducts, useStoreSettings, useAllReviewStats, useAllProductImages, useAllSizeStock } from '@/hooks/useSupabase';
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
  const { data: reviewStats = {} } = useAllReviewStats();
  const { data: allProductImages = [] } = useAllProductImages();
  const { data: allSizeStock = [] } = useAllSizeStock();
  const { viewedIds } = useRecentlyViewed();

  // Build sold-out map: product_id -> boolean (all sizes have 0 available)
  const soldOutMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    const grouped: Record<string, { available: number }[]> = {};
    for (const s of allSizeStock) {
      if (!grouped[s.product_id]) grouped[s.product_id] = [];
      grouped[s.product_id].push({ available: s.total_stock - s.sold_count + s.cancelled_count + s.returned_count });
    }
    for (const [pid, stocks] of Object.entries(grouped)) {
      const totalAvailable = stocks.reduce((sum, s) => sum + s.available, 0);
      map[pid] = totalAvailable <= 0;
    }
    return map;
  }, [allSizeStock]);

  const showProducts = activeCategory || searchQuery;

  const recentProducts = viewedIds
    .map(id => allProducts.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, 6);

  // Build hover image map: product_id -> second image url
  const hoverImageMap = useMemo(() => {
    const map: Record<string, string> = {};
    // Group by product_id, sorted by sort_order, pick second image
    const grouped: Record<string, { sort_order: number; image_url: string }[]> = {};
    for (const img of allProductImages) {
      if (!grouped[img.product_id]) grouped[img.product_id] = [];
      grouped[img.product_id].push(img);
    }
    for (const [pid, imgs] of Object.entries(grouped)) {
      const sorted = imgs.sort((a, b) => a.sort_order - b.sort_order);
      if (sorted.length > 0) map[pid] = sorted[0].image_url;
    }
    return map;
  }, [allProductImages]);

  // Dynamic posters from settings
  const rawPosters = settings['homepage_posters'];
  const posters = rawPosters ? JSON.parse(rawPosters) : [];

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
                <div className="aspect-[3/5] bg-muted" />
                <div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-4 bg-muted rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map(product => <ProductCard key={product.id} product={product} reviewStats={reviewStats} hoverImageUrl={hoverImageMap[product.id]} />)}
          </div>
        )}

        {/* Fancy Posters */}
        {!showProducts && (
          <section className="mt-20 sm:mt-28">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {posters.map((poster: any, i: number) => (
                <Link key={i} to={poster.link || '/'} className="relative group overflow-hidden cursor-pointer block">
                  <img src={poster.image} alt={poster.title} className="w-full h-auto block transition-transform duration-700 group-hover:scale-105" />
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
              {recentProducts.map(product => product && <ProductCard key={product.id} product={product} reviewStats={reviewStats} hoverImageUrl={hoverImageMap[product.id]} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
