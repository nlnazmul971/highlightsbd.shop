import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useSupabase';
import { Package, Plus, Minus, Search, BarChart3, History, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type SizeStock = {
  id: string;
  product_id: string;
  size: string;
  total_stock: number;
  sold_count: number;
  cancelled_count: number;
  returned_count: number;
};

type StockLog = {
  id: string;
  product_id: string;
  size: string;
  change_type: string;
  quantity: number;
  order_id: string | null;
  notes: string | null;
  created_at: string;
};

const useProductSizeStock = () => {
  return useQuery({
    queryKey: ['product-size-stock'],
    queryFn: async () => {
      const { data, error } = await supabase.from('product_size_stock').select('*').order('size');
      if (error) throw error;
      return (data || []) as SizeStock[];
    },
  });
};

const useStockLogs = (productId?: string) => {
  return useQuery({
    queryKey: ['stock-logs', productId],
    queryFn: async () => {
      let q = supabase.from('stock_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (productId) q = q.eq('product_id', productId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as StockLog[];
    },
  });
};

const AdminStockManagement = () => {
  const { data: products = [] } = useProducts();
  const { data: allStock = [], refetch: refetchStock } = useProductSizeStock();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'overview' | 'manage' | 'logs'>('overview');
  const qc = useQueryClient();

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const s = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s));
  }, [products, search]);

  // Group stock by product
  const stockByProduct = useMemo(() => {
    const map: Record<string, SizeStock[]> = {};
    allStock.forEach(s => {
      if (!map[s.product_id]) map[s.product_id] = [];
      map[s.product_id].push(s);
    });
    return map;
  }, [allStock]);

  const getAvailable = (s: SizeStock) => s.total_stock - s.sold_count + s.cancelled_count + s.returned_count;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-purple-600" />
        <h2 className="text-xl font-light tracking-wide">Stock Management</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['overview', 'manage', 'logs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs uppercase tracking-wider transition-colors border-b-2 ${tab === t ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'manage' ? '📦 Manage Stock' : '📋 Logs'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <StockOverview products={filteredProducts as any} stockByProduct={stockByProduct} search={search} setSearch={setSearch} getAvailable={getAvailable} />
      )}

      {tab === 'manage' && (
        <StockManage products={products as any} stockByProduct={stockByProduct} refetchStock={refetchStock} selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct} />
      )}

      {tab === 'logs' && (
        <StockLogs products={products as any} />
      )}
    </div>
  );
};

const StockOverview = ({ products, stockByProduct, search, setSearch, getAvailable }: any) => {
  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="luxury-input pl-9" />
      </div>

      <div className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Product</th>
                <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Sizes & Stock</th>
                <th className="text-center p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Total Available</th>
                <th className="text-center p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Sold</th>
                <th className="text-center p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Cancelled</th>
                <th className="text-center p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Returned</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => {
                const stocks = stockByProduct[p.id] || [];
                const totalAvailable = stocks.reduce((sum: number, s: any) => sum + getAvailable(s), 0);
                const totalSold = stocks.reduce((sum: number, s: any) => sum + s.sold_count, 0);
                const totalCancelled = stocks.reduce((sum: number, s: any) => sum + s.cancelled_count, 0);
                const totalReturned = stocks.reduce((sum: number, s: any) => sum + s.returned_count, 0);

                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {p.image_url && <img src={p.image_url} alt="" className="w-8 h-10 object-cover rounded" />}
                        <div>
                          <p className="font-medium text-sm truncate max-w-[180px]">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">SKU: {p.sku || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {stocks.length === 0 ? (
                          <span className="text-[10px] text-muted-foreground italic">No stock data</span>
                        ) : stocks.map((s: any) => (
                          <span key={s.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${getAvailable(s) > 5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : getAvailable(s) > 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {s.size}: {getAvailable(s)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold">
                      <span className={totalAvailable < 5 ? 'text-destructive' : 'text-green-600'}>{totalAvailable}</span>
                    </td>
                    <td className="p-3 text-center text-blue-600 font-medium">{totalSold}</td>
                    <td className="p-3 text-center text-orange-600 font-medium">{totalCancelled}</td>
                    <td className="p-3 text-center text-pink-600 font-medium">{totalReturned}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StockManage = ({ products, stockByProduct, refetchStock, selectedProduct, setSelectedProduct }: any) => {
  const [editStocks, setEditStocks] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const product = products.find((p: any) => p.id === selectedProduct);
  const currentStocks = stockByProduct[selectedProduct] || [];

  const handleSaveStock = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      for (const [size, qty] of Object.entries(editStocks)) {
        const existing = currentStocks.find((s: any) => s.size === size);
        if (existing) {
          await supabase.from('product_size_stock').update({ total_stock: qty } as any).eq('id', existing.id);
        } else {
          await supabase.from('product_size_stock').insert({
            product_id: selectedProduct, size, total_stock: qty,
          });
        }
        await supabase.from('stock_logs').insert({
          product_id: selectedProduct, size, change_type: 'manual',
          quantity: qty - (existing?.total_stock || 0),
          notes: `Stock set to ${qty}`,
        });
      }
      toast.success('Stock updated successfully!');
      refetchStock();
      qc.invalidateQueries({ queryKey: ['stock-logs'] });
      setEditStocks({});
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const initEditStocks = (p: any) => {
    setSelectedProduct(p.id);
    const stocks: Record<string, number> = {};
    const existingStocks = stockByProduct[p.id] || [];
    (p.sizes || []).forEach((size: string) => {
      const existing = existingStocks.find((s: any) => s.size === size);
      stocks[size] = existing?.total_stock || 0;
    });
    setEditStocks(stocks);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product list */}
        <div className="md:col-span-1 border border-border p-4 space-y-2 max-h-[500px] overflow-auto">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Select Product</p>
          {products.map((p: any) => (
            <div key={p.id} onClick={() => initEditStocks(p)}
              className={`p-2 border cursor-pointer flex items-center gap-2 transition-all ${selectedProduct === p.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'}`}>
              {p.image_url && <img src={p.image_url} alt="" className="w-8 h-10 object-cover rounded" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{p.name}</p>
                <p className="text-[9px] text-muted-foreground">{p.sizes?.join(', ')}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stock editor */}
        <div className="md:col-span-2 border border-border p-6 space-y-4">
          {!selectedProduct ? (
            <p className="text-sm text-muted-foreground text-center py-12">← Select a product to manage stock</p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {product?.image_url && <img src={product.image_url} alt="" className="w-14 h-16 object-cover rounded" />}
                <div>
                  <h3 className="font-medium">{product?.name}</h3>
                  <p className="text-xs text-muted-foreground">SKU: {product?.sku || '—'}</p>
                </div>
              </div>

              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Size-wise Stock (Total Pieces)</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(product?.sizes || []).map((size: string) => {
                  const existing = currentStocks.find((s: any) => s.size === size);
                  const available = existing
                    ? (editStocks[size] ?? existing.total_stock) - existing.sold_count + existing.cancelled_count + existing.returned_count
                    : editStocks[size] || 0;

                  return (
                    <div key={size} className="border border-border p-3 space-y-2 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{size}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${available > 5 ? 'bg-green-100 text-green-700' : available > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          Avail: {available}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setEditStocks(prev => ({ ...prev, [size]: Math.max(0, (prev[size] || 0) - 1) }))}
                          className="p-1 border border-border hover:bg-muted rounded"><Minus size={12} /></button>
                        <input type="number" min={0} value={editStocks[size] ?? existing?.total_stock ?? 0}
                          onChange={e => setEditStocks(prev => ({ ...prev, [size]: parseInt(e.target.value) || 0 }))}
                          className="luxury-input text-center text-sm w-16" />
                        <button type="button" onClick={() => setEditStocks(prev => ({ ...prev, [size]: (prev[size] || 0) + 1 }))}
                          className="p-1 border border-border hover:bg-muted rounded"><Plus size={12} /></button>
                      </div>
                      {existing && (
                        <div className="text-[9px] text-muted-foreground space-y-0.5">
                          <p>Sold: <span className="text-blue-600 font-medium">{existing.sold_count}</span></p>
                          <p>Cancel: <span className="text-orange-600 font-medium">{existing.cancelled_count}</span></p>
                          <p>Return: <span className="text-pink-600 font-medium">{existing.returned_count}</span></p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button onClick={handleSaveStock} disabled={saving}
                className="luxury-button-primary flex items-center gap-2 text-xs px-6">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                Save Stock
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StockLogs = ({ products }: { products: any[] }) => {
  const [filterProduct, setFilterProduct] = useState<string>('');
  const { data: logs = [] } = useStockLogs(filterProduct || undefined);

  const getProductName = (id: string) => products.find((p: any) => p.id === id)?.name || 'Unknown';

  const changeTypeColors: Record<string, string> = {
    sold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    cancelled: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    returned: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    manual: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    restock: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <History size={16} className="text-muted-foreground" />
        <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="luxury-input text-sm max-w-xs">
          <option value="">All Products</option>
          {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Date</th>
                <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Product</th>
                <th className="text-center p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Size</th>
                <th className="text-center p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Type</th>
                <th className="text-center p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Qty</th>
                <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: StockLog) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="p-3 text-xs text-muted-foreground">{new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-3 text-xs font-medium">{getProductName(log.product_id)}</td>
                  <td className="p-3 text-center"><span className="px-2 py-0.5 bg-muted rounded text-xs font-bold">{log.size}</span></td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${changeTypeColors[log.change_type] || 'bg-muted text-foreground'}`}>
                      {log.change_type}
                    </span>
                  </td>
                  <td className="p-3 text-center font-bold">{log.quantity > 0 ? `+${log.quantity}` : log.quantity}</td>
                  <td className="p-3 text-xs text-muted-foreground">{log.notes || '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">No stock logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStockManagement;
