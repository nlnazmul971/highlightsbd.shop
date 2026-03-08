import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts, useOrders, useDeleteProduct, useUpdateProduct, useCreateProduct, useUserRole } from '@/hooks/useSupabase';
import { Product, getProductImage } from '@/data/products';
import { Edit, Trash2, Plus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const Admin = () => {
  const { user, signIn, signUp, signOut } = useAuth();
  const { data: role } = useUserRole(user?.id);
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useOrders();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const createProduct = useCreateProduct();
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '', mode: 'login' as 'login' | 'signup' });

  const isAdmin = role === 'admin';

  // Auth screen
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header /><CartDrawer />
        <main className="max-w-md mx-auto px-4 pt-40 text-center">
          <h1 className="luxury-heading text-3xl tracking-[0.15em] mb-8">
            {authForm.mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (authForm.mode === 'login') await signIn(authForm.email, authForm.password);
              else { await signUp(authForm.email, authForm.password); toast.success('Check your email to confirm signup'); }
            } catch (err: any) { toast.error(err.message); }
          }} className="space-y-4">
            <input type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="Email" className="luxury-input" required />
            <input type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Password" className="luxury-input" required />
            <button type="submit" className="luxury-button-primary w-full">{authForm.mode === 'login' ? 'Sign In' : 'Sign Up'}</button>
          </form>
          <button onClick={() => setAuthForm({ ...authForm, mode: authForm.mode === 'login' ? 'signup' : 'login' })} className="text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors">
            {authForm.mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
          <Link to="/" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6"><ArrowLeft size={14} /> Back to store</Link>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header /><CartDrawer />
        <main className="max-w-md mx-auto px-4 pt-40 text-center">
          <h1 className="luxury-heading text-3xl tracking-[0.15em] mb-4">My Account</h1>
          <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
          <p className="text-xs text-muted-foreground mb-8">You don't have admin access.</p>
          <button onClick={signOut} className="luxury-button-outline">Sign Out</button>
          <Link to="/" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6"><ArrowLeft size={14} /> Back to store</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h1 className="luxury-heading text-3xl tracking-[0.15em]">Admin Panel</h1>
          <button onClick={signOut} className="luxury-button-outline text-[10px] py-2 px-4">Sign Out</button>
        </div>

        <div className="flex gap-6 mb-8 border-b border-border">
          {(['products', 'orders'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`luxury-body text-[11px] pb-3 border-b-2 transition-all ${tab === t ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'}`}>
              {t === 'products' ? 'Products' : 'Orders'}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <>
            <button onClick={() => { setShowAddForm(true); setEditingProduct({ id: '', name: '', price: 0, original_price: null, image_url: '', category: 'T-Shirt', description: '', sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Black', hex: '#1a1a1a' }], stock: 0, featured: false, created_at: '', updated_at: '' }); }} className="luxury-button-primary mb-6 inline-flex items-center gap-2 text-[10px]">
              <Plus size={14} /> Add Product
            </button>

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

            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="flex items-center gap-4 p-4 border border-border">
                  <img src={getProductImage(p.image_url)} alt={p.name} className="w-16 h-20 object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.category} • ৳{p.price.toLocaleString()} • Stock: {p.stock}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingProduct(p); setShowAddForm(false); }} className="p-2 border border-border hover:bg-accent transition-colors"><Edit size={14} /></button>
                    <button onClick={async () => { await deleteProduct.mutateAsync(p.id); toast.success('Product deleted'); }} className="p-2 border border-border hover:bg-destructive/10 text-destructive transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'orders' && (
          orders.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="border border-border p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="luxury-badge">{order.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.customer_name} • {order.customer_phone}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_address}, {order.customer_city}</p>
                  <p className="text-sm font-medium mt-3">Total: ৳{order.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
};

const ProductForm = ({ product, isNew, onSave, onCancel }: { product: Product; isNew: boolean; onSave: (p: Product) => void; onCancel: () => void }) => {
  const [form, setForm] = useState(product);

  return (
    <div className="border border-border p-6 mb-6 space-y-4">
      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product Name" className="luxury-input" />
      <div className="grid grid-cols-2 gap-4">
        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} placeholder="Price" className="luxury-input" />
        <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} placeholder="Stock" className="luxury-input" />
      </div>
      <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="Image URL" className="luxury-input" />
      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="luxury-input">
        {['T-Shirt', 'Winter', 'Shirts', 'Knit Polos', 'Pant', 'Panjabi', 'Kafsu'].map(c => <option key={c}>{c}</option>)}
      </select>
      <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="luxury-input min-h-[80px]" />
      <div className="flex gap-3">
        <button onClick={() => onSave(form)} className="luxury-button-primary text-[10px]">Save</button>
        <button onClick={onCancel} className="luxury-button-outline text-[10px]">Cancel</button>
      </div>
    </div>
  );
};

export default Admin;
