import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Heart } from 'lucide-react';

const AdminWishlist = () => {
  const { data: wishlistData, isLoading } = useQuery({
    queryKey: ['admin-wishlist'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wishlist_items').select('*, products(*)').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  type ProductStat = { name: string; price: number; count: number; image_url: string };
  const productStats = (wishlistData || []).reduce((acc: Record<string, ProductStat>, item: any) => {
    const pid = item.product_id;
    if (!acc[pid]) {
      acc[pid] = { name: item.products?.name || 'Unknown', price: item.products?.price || 0, image_url: item.products?.image_url || '', count: 0 };
    }
    acc[pid].count++;
    return acc;
  }, {});

  const sorted: [string, ProductStat][] = (Object.entries(productStats) as [string, ProductStat][]).sort((a, b) => b[1].count - a[1].count);

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Wishlist Analytics</h2>
        <p className="text-xs text-muted-foreground mt-1">কোন প্রোডাক্ট কতজন wishlist এ রেখেছে দেখুন</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="border border-border p-4 text-center"><p className="text-2xl font-light">{wishlistData?.length || 0}</p><p className="text-xs text-muted-foreground tracking-wider uppercase mt-1">Total Wishlist Items</p></div>
        <div className="border border-border p-4 text-center"><p className="text-2xl font-light">{sorted.length}</p><p className="text-xs text-muted-foreground tracking-wider uppercase mt-1">Unique Products</p></div>
        <div className="border border-border p-4 text-center"><p className="text-2xl font-light">{new Set((wishlistData || []).map((i: any) => i.user_id)).size}</p><p className="text-xs text-muted-foreground tracking-wider uppercase mt-1">Users with Wishlist</p></div>
      </div>
      {sorted.length === 0 ? (
        <div className="text-center py-12"><Heart size={32} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-sm text-muted-foreground">No wishlist data yet</p></div>
      ) : (
        <div className="border border-border">
          <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] gap-3 p-3 border-b border-border bg-secondary/30 text-xs text-muted-foreground tracking-wider uppercase"><span className="hidden sm:block">Image</span><span>Product</span><span className="hidden sm:block">Price</span><span className="text-right">Wishlisted</span></div>
          {sorted.map(([pid, info]) => (
            <div key={pid} className="grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] gap-3 p-3 border-b border-border last:border-0 items-center">
              <div className="hidden sm:block w-10 h-10 bg-secondary overflow-hidden">{info.image_url && <img src={info.image_url} alt="" className="w-full h-full object-cover" />}</div>
              <span className="text-sm truncate">{info.name}</span>
              <span className="hidden sm:block text-sm text-muted-foreground">৳{info.price.toLocaleString()}</span>
              <span className="text-sm font-medium text-right flex items-center gap-1 justify-end"><Heart size={12} className="text-red-500 fill-red-500" />{info.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminWishlist;
