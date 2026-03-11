import { useState } from 'react';
import { useProducts, useDeleteProduct, useUpdateProduct, useCreateProduct, useProductImages, useAddProductImage, useDeleteProductImage } from '@/hooks/useSupabase';
import { Product, getProductImage } from '@/data/products';
import { Edit, Trash2, Plus, Search, X, Upload, Image as ImageIcon } from 'lucide-react';
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

  const filtered = products;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="luxury-input pl-9" />
        </div>
        <button onClick={() => { setShowAddForm(true); setEditingProduct({ id: '', name: '', price: 0, original_price: null, image_url: '', category: 'T-Shirt', description: '', sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Black', hex: '#1a1a1a' }], stock: 0, featured: false, brand: '', sku: '', created_at: '', updated_at: '' }); }} className="luxury-button-primary inline-flex items-center gap-2 text-[10px]">
          <Plus size={14} /> Add Product
        </button>
      </div>

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

const ProductForm = ({ product, isNew, onSave, onCancel, onDone }: { product: Product; isNew: boolean; onSave: (p: Product) => Promise<any>; onCancel: () => void; onDone: () => void }) => {
  const [form, setForm] = useState(product);
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

      {/* Multiple images - only show after product is saved */}
      {savedProductId && (
        <MultiImageUpload productId={savedProductId} />
      )}

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground tracking-wider uppercase">Description</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="luxury-input min-h-[80px]" />
      </div>
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
