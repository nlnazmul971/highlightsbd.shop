import { useState } from 'react';
import { useProducts, useDeleteProduct, useUpdateProduct, useCreateProduct } from '@/hooks/useSupabase';
import { Product, getProductImage } from '@/data/products';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';

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
        <button onClick={() => { setShowAddForm(true); setEditingProduct({ id: '', name: '', price: 0, original_price: null, image_url: '', category: 'T-Shirt', description: '', sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Black', hex: '#1a1a1a' }], stock: 0, featured: false, created_at: '', updated_at: '' }); }} className="luxury-button-primary inline-flex items-center gap-2 text-[10px]">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {editingProduct && (
        <ProductForm product={editingProduct} isNew={showAddForm} onSave={async (p) => {
          try {
            if (showAddForm) {
              const { id, created_at, updated_at, ...rest } = p;
              await createProduct.mutateAsync(rest);
              toast.success('Product added');
            } else {
              await updateProduct.mutateAsync(p);
              toast.success('Product updated');
            }
            setEditingProduct(null); setShowAddForm(false);
          } catch (err: any) { toast.error(err.message); }
        }} onCancel={() => { setEditingProduct(null); setShowAddForm(false); }} />
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

const ProductForm = ({ product, isNew, onSave, onCancel }: { product: Product; isNew: boolean; onSave: (p: Product) => void; onCancel: () => void }) => {
  const [form, setForm] = useState(product);

  return (
    <div className="border border-border p-6 space-y-4 bg-muted/10">
      <h3 className="text-sm font-medium tracking-wider uppercase">{isNew ? 'Add Product' : 'Edit Product'}</h3>
      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product Name" className="luxury-input" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} placeholder="Price" className="luxury-input" />
        <input type="number" value={form.original_price || ''} onChange={e => setForm({ ...form, original_price: e.target.value ? Number(e.target.value) : null })} placeholder="Original Price" className="luxury-input" />
        <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} placeholder="Stock" className="luxury-input" />
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="luxury-input">
          {['T-Shirt', 'Winter', 'Shirts', 'Knit Polos', 'Pant', 'Panjabi', 'Kafsu'].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground tracking-wider uppercase">Product Image</label>
        <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
        <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="Or paste image URL" className="luxury-input text-xs" />
      </div>
      <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="luxury-input min-h-[80px]" />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-primary" />
          Featured
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={() => onSave(form)} className="luxury-button-primary text-[10px]">Save</button>
        <button onClick={onCancel} className="luxury-button-outline text-[10px]">Cancel</button>
      </div>
    </div>
  );
};

export default AdminProducts;
