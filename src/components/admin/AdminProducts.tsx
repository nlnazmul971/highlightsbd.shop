import { useState, useEffect } from 'react';
import { useProducts, useDeleteProduct, useUpdateProduct, useCreateProduct, useProductImages, useAddProductImage, useDeleteProductImage } from '@/hooks/useSupabase';
import { Product, getProductImage } from '@/data/products';
import { Edit, Trash2, Plus, Search, X, Upload, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';
import { supabase } from '@/integrations/supabase/client';

const AdminProducts = () => {
  const [search, setSearch] = useState('');
  const { data: products = [] } = useProducts(undefined, search || undefined);
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const createProduct = useCreateProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copyChartOpen, setCopyChartOpen] = useState(false);

  const filtered = products;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="luxury-input pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCopyChartOpen(true)} className="luxury-button-outline inline-flex items-center gap-2 text-[10px]">
            <Copy size={14} /> Copy Size Chart
          </button>
          <button onClick={() => { setShowAddForm(true); setEditingProduct({ id: '', name: '', price: 0, original_price: null, image_url: '', category: 'T-Shirt', description: '', sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Black', hex: '#1a1a1a' }], stock: 0, featured: false, brand: '', sku: '', size_chart: [], created_at: '', updated_at: '' }); }} className="luxury-button-primary inline-flex items-center gap-2 text-[10px]">
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {copyChartOpen && (
        <CopySizeChartModal products={products} onClose={() => setCopyChartOpen(false)} />
      )}

      {editingProduct && (
        <ProductForm product={editingProduct} isNew={showAddForm} onSave={async (p) => {
          try {
            if (showAddForm) {
              const { id, created_at, updated_at, ...rest } = p;
              const result = await createProduct.mutateAsync(rest);
              toast.success('Product added');
              return result;
            } else {
              await updateProduct.mutateAsync(p);
              toast.success('Product updated');
              return p;
            }
          } catch (err: any) { toast.error(err.message); return null; }
        }} onCancel={() => { setEditingProduct(null); setShowAddForm(false); }}
        onDone={() => { setEditingProduct(null); setShowAddForm(false); }} />
      )}

      <div className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Product</th>
                <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium hidden sm:table-cell">Category</th>
                <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Price</th>
                <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium hidden md:table-cell">Stock</th>
                <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium hidden md:table-cell">Featured</th>
                <th className="text-right p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={getProductImage(p.image_url)} alt={p.name} className="w-10 h-12 object-cover flex-shrink-0" />
                      <span className="font-medium truncate max-w-[150px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{p.category}</td>
                  <td className="p-3">৳{p.price.toLocaleString()}</td>
                  <td className="p-3 hidden md:table-cell">
                    <span className={p.stock < 5 ? 'text-destructive font-medium' : ''}>{p.stock}</span>
                  </td>
                  <td className="p-3 hidden md:table-cell">{p.featured ? '⭐' : '—'}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditingProduct(p); setShowAddForm(false); }} className="p-2 hover:bg-accent transition-colors"><Edit size={14} /></button>
                      <button onClick={async () => { if (confirm('Delete this product?')) { await deleteProduct.mutateAsync(p.id); toast.success('Deleted'); } }} className="p-2 hover:bg-destructive/10 text-destructive transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} product(s)</p>
    </div>
  );
};

const CopySizeChartModal = ({ products, onClose }: { products: Product[]; onClose: () => void }) => {
  const [sourceId, setSourceId] = useState('');
  const [targetIds, setTargetIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const updateProduct = useUpdateProduct();

  const parseChart = (sc: any): any[] => {
    if (!sc) return [];
    if (Array.isArray(sc)) return sc;
    if (typeof sc === 'string') { try { const p = JSON.parse(sc); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
  };

  const sourcesWithChart = products.filter(p => parseChart(p.size_chart).length > 0);
  const source = products.find(p => p.id === sourceId);
  const sourceChart = parseChart(source?.size_chart);
  const targetCandidates = products
    .filter(p => p.id !== sourceId)
    .filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id: string) => {
    const next = new Set(targetIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setTargetIds(next);
  };

  const toggleAll = () => {
    if (targetIds.size === targetCandidates.length) setTargetIds(new Set());
    else setTargetIds(new Set(targetCandidates.map(p => p.id)));
  };

  const apply = async () => {
    if (!sourceId) { toast.error('Source product select করুন'); return; }
    if (sourceChart.length === 0) { toast.error('Source product এ valid size chart নেই'); return; }
    if (targetIds.size === 0) { toast.error('কমপক্ষে একটি product select করুন'); return; }
    setSaving(true);
    try {
      let success = 0;
      let failed = 0;
      for (const id of targetIds) {
        try {
          await updateProduct.mutateAsync({ id, size_chart: sourceChart } as any);
          success++;
        } catch (e) {
          console.error('Copy failed for', id, e);
          failed++;
        }
      }
      if (success > 0) toast.success(`${success} product এ size chart copy হয়েছে${failed ? ` (${failed} failed)` : ''}`);
      if (success === 0) toast.error('কোনো product update হয়নি');
      if (success > 0) onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-border max-w-2xl w-full max-h-[85vh] overflow-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium tracking-wide">Copy Size Chart to Multiple Products</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-accent"><X size={16} /></button>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground tracking-wider uppercase">Source Product (যেটার size chart নিবেন)</label>
          <select value={sourceId} onChange={e => setSourceId(e.target.value)} className="luxury-input">
            <option value="">-- Select source product --</option>
            {sourcesWithChart.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({parseChart(p.size_chart).length} rows)</option>
            ))}
          </select>
          {sourcesWithChart.length === 0 && (
            <p className="text-xs text-destructive">কোনো product এ size chart নেই। আগে একটিতে size chart বানিয়ে নিন।</p>
          )}
        </div>

        {sourceId && sourceChart.length > 0 && (
          <div className="border border-border p-2 max-h-32 overflow-auto">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Preview</p>
            <table className="w-full text-[11px]">
              <thead><tr>{Object.keys(sourceChart[0]).map(c => <th key={c} className="text-left px-1.5 py-0.5 font-medium">{c}</th>)}</tr></thead>
              <tbody>{sourceChart.map((r: any, i: number) => (
                <tr key={i}>{Object.keys(sourceChart[0]).map(c => <td key={c} className="px-1.5 py-0.5">{r[c]}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground tracking-wider uppercase">Target Products ({targetIds.size} selected)</label>
            <button onClick={toggleAll} className="text-[10px] text-primary hover:underline">
              {targetIds.size === targetCandidates.length ? 'Unselect all' : 'Select all'}
            </button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="luxury-input text-xs" />
          <div className="border border-border max-h-64 overflow-auto">
            {targetCandidates.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs border-b border-border last:border-0 hover:bg-muted/30 ${targetIds.has(p.id) ? 'bg-primary/5' : ''}`}
              >
                <div className={`w-4 h-4 border flex items-center justify-center ${targetIds.has(p.id) ? 'bg-primary border-primary' : 'border-border'}`}>
                  {targetIds.has(p.id) && <Check size={10} className="text-primary-foreground" />}
                </div>
                <img src={getProductImage(p.image_url)} alt="" className="w-8 h-10 object-cover" />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {parseChart(p.size_chart).length > 0 ? `${parseChart(p.size_chart).length} rows (will overwrite)` : 'no chart'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <button onClick={onClose} className="luxury-button-outline text-[10px]">Cancel</button>
          <button onClick={apply} disabled={saving || !sourceId || targetIds.size === 0} className="luxury-button-primary text-[10px] disabled:opacity-50">
            {saving ? 'Copying...' : `Copy to ${targetIds.size} product(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

const MultiImageUpload = ({ productId }: { productId: string }) => {
  const { data: images = [] } = useProductImages(productId);
  const addImage = useAddProductImage();
  const deleteImage = useDeleteProductImage();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 25 * 1024 * 1024) { toast.error(`${file.name} is too large (max 25MB)`); continue; }

        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
        if (uploadError) { toast.error(uploadError.message); continue; }

        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
        await addImage.mutateAsync({ product_id: productId, image_url: publicUrl, sort_order: images.length + i });
      }
      toast.success('Images uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground tracking-wider uppercase">Additional Images</label>
      <div className="flex flex-wrap gap-2">
        {images.map((img: any) => (
          <div key={img.id} className="relative inline-block">
            <img src={img.image_url} alt="" className="w-20 h-24 object-cover border border-border" />
            <button
              onClick={async () => { await deleteImage.mutateAsync(img.id); toast.success('Image removed'); }}
              className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <label className="w-20 h-24 border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-foreground/50 transition-colors">
          <ImageIcon size={16} className="text-muted-foreground mb-1" />
          <span className="text-[9px] text-muted-foreground">{uploading ? 'Uploading...' : 'Add'}</span>
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>
    </div>
  );
};

const SizeChartEditor = ({ value, onChange }: { value: any[]; onChange: (v: any[]) => void }) => {
  const safeValue = Array.isArray(value) ? value : [];
  
  const [columns, setColumns] = useState<string[]>(() => {
    if (safeValue.length > 0) return Object.keys(safeValue[0]);
    return ['Size', 'Chest (inch)', 'Length (inch)', 'Shoulder (inch)'];
  });
  const [rows, setRows] = useState<Record<string, string>[]>(safeValue);
  const [newCol, setNewCol] = useState('');

  useEffect(() => {
    if (Array.isArray(value)) {
      setRows(value);
      if (value.length > 0) {
        setColumns(Object.keys(value[0]));
      }
    }
  }, [value]);

  const addRow = () => {
    const row: Record<string, string> = {};
    columns.forEach(c => row[c] = '');
    const updated = [...rows, row];
    setRows(updated);
    onChange(updated);
  };

  const removeRow = (i: number) => {
    const updated = rows.filter((_, idx) => idx !== i);
    setRows(updated);
    onChange(updated);
  };

  const updateCell = (rowIdx: number, col: string, val: string) => {
    const updated = rows.map((r, i) => i === rowIdx ? { ...r, [col]: val } : r);
    setRows(updated);
    onChange(updated);
  };

  const addColumn = () => {
    if (!newCol.trim()) return;
    const col = newCol.trim();
    setColumns([...columns, col]);
    const updated = rows.map(r => ({ ...r, [col]: '' }));
    setRows(updated);
    onChange(updated);
    setNewCol('');
  };

  const removeColumn = (col: string) => {
    const newCols = columns.filter(c => c !== col);
    setColumns(newCols);
    const updated = rows.map(r => {
      const { [col]: _, ...rest } = r;
      return rest;
    });
    setRows(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="text-xs text-muted-foreground tracking-wider uppercase">Size Chart</label>
      
      {columns.length > 0 && (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30">
                {columns.map(col => (
                  <th key={col} className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <div className="flex items-center gap-1">
                      {col}
                      <button onClick={() => removeColumn(col)} className="text-destructive hover:text-destructive/80 ml-1"><X size={10} /></button>
                    </div>
                  </th>
                ))}
                <th className="px-2 py-1.5 border-b border-border w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columns.map(col => (
                    <td key={col} className="px-1 py-1">
                      <input
                        value={row[col] || ''}
                        onChange={e => updateCell(i, col, e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-transparent border border-transparent hover:border-border focus:border-foreground/30 outline-none"
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    <button onClick={() => removeRow(i)} className="p-1 text-destructive hover:text-destructive/80"><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addRow} className="luxury-button-outline text-[10px] py-1.5 px-3 inline-flex items-center gap-1">
          <Plus size={12} /> Add Row
        </button>
        <div className="flex items-center gap-1">
          <input
            value={newCol}
            onChange={e => setNewCol(e.target.value)}
            placeholder="Column name"
            className="luxury-input text-[10px] py-1.5 px-2 w-28"
            onKeyDown={e => e.key === 'Enter' && addColumn()}
          />
          <button type="button" onClick={addColumn} className="luxury-button-outline text-[10px] py-1.5 px-2">
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductForm = ({ product, isNew, onSave, onCancel, onDone }: { product: Product; isNew: boolean; onSave: (p: Product) => Promise<any>; onCancel: () => void; onDone: () => void }) => {
  const [form, setForm] = useState({
    ...product,
    size_chart: Array.isArray(product.size_chart) ? product.size_chart : []
  });
  const [savedProductId, setSavedProductId] = useState(isNew ? '' : product.id);

  const handleSave = async () => {
    const result = await onSave(form);
    if (result && isNew && result.id) {
      setSavedProductId(result.id);
      toast.info('Now you can add additional images');
    } else if (!isNew) {
      onDone();
    }
  };

  return (
    <div className="border border-border p-6 space-y-4 bg-muted/10">
      <h3 className="text-sm font-medium tracking-wider uppercase">{isNew ? 'Add Product' : 'Edit Product'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground tracking-wider uppercase">Product Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product Name" className="luxury-input" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground tracking-wider uppercase">Brand Name</label>
          <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Brand Name" className="luxury-input" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground tracking-wider uppercase">SKU</label>
          <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. TSH-BLK-001" className="luxury-input" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground tracking-wider uppercase">Category</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="luxury-input">
            {['T-Shirt', 'Winter', 'Shirts', 'Knit Polos', 'Pant', 'Panjabi', 'Kafsu'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground tracking-wider uppercase">Price (৳)</label>
          <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} placeholder="Price" className="luxury-input" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground tracking-wider uppercase">Original Price (৳)</label>
          <input type="number" value={form.original_price || ''} onChange={e => setForm({ ...form, original_price: e.target.value ? Number(e.target.value) : null })} placeholder="Original Price" className="luxury-input" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground tracking-wider uppercase">Stock</label>
          <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} placeholder="Stock" className="luxury-input" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground tracking-wider uppercase">Sizes</label>
        <div className="flex flex-wrap gap-2">
          {['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'].map(size => (
            <button
              key={size}
              type="button"
              onClick={() => {
                const sizes = form.sizes.includes(size)
                  ? form.sizes.filter(s => s !== size)
                  : [...form.sizes, size];
                setForm({ ...form, sizes });
              }}
              className={`px-3 py-1.5 text-xs border transition-colors ${form.sizes.includes(size) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground tracking-wider uppercase">Main Product Image</label>
        <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
        <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="Or paste image URL" className="luxury-input text-xs" />
      </div>

      {savedProductId && (
        <MultiImageUpload productId={savedProductId} />
      )}

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground tracking-wider uppercase">Description</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="luxury-input min-h-[80px]" />
      </div>

      <SizeChartEditor
        value={form.size_chart}
        onChange={(chart) => setForm({ ...form, size_chart: chart })}
      />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-primary" />
          Featured
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={handleSave} className="luxury-button-primary text-[10px]">{isNew && !savedProductId ? 'Save & Add Images' : 'Save'}</button>
        <button onClick={onCancel} className="luxury-button-outline text-[10px]">Cancel</button>
        {savedProductId && isNew && <button onClick={onDone} className="luxury-button-outline text-[10px]">Done</button>}
      </div>
    </div>
  );
};

export default AdminProducts;