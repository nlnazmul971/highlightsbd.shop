import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { useAdmin, Order } from '@/contexts/AdminContext';
import { Product } from '@/data/products';
import { Package, Edit, Trash2, Plus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const Admin = () => {
  const { products, addProduct, updateProduct, deleteProduct, isAdmin, setIsAdmin } = useAdmin();
  const [orders] = useState<Order[]>(() => JSON.parse(localStorage.getItem('arjo-orders') || '[]'));
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [password, setPassword] = useState('');

  // Simple admin login
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header /><CartDrawer />
        <main className="max-w-md mx-auto px-4 pt-40 text-center">
          <h1 className="luxury-heading text-3xl tracking-[0.15em] mb-8">Admin Access</h1>
          <form onSubmit={(e) => { e.preventDefault(); if (password === 'arjo2026') { setIsAdmin(true); toast.success('Welcome, Admin'); } else toast.error('Invalid password'); }}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter admin password" className="luxury-input mb-4" />
            <button type="submit" className="luxury-button-primary w-full">Access Panel</button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">Demo password: arjo2026</p>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6"><ArrowLeft size={14} /> Back to store</Link>
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
          <button onClick={() => { setIsAdmin(false); toast.info('Logged out'); }} className="luxury-button-outline text-[10px] py-2 px-4">Logout</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-border">
          {(['products', 'orders'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`luxury-body text-[11px] pb-3 border-b-2 transition-all ${tab === t ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'}`}>
              {t === 'products' ? 'Products' : 'Orders'}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <>
            <button onClick={() => { setShowAddForm(true); setEditingProduct({ id: Date.now().toString(), name: '', price: 0, image: '', category: 'T-Shirt', description: '', sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Black', hex: '#1a1a1a' }], stock: 0, featured: false, reviews: [] }); }} className="luxury-button-primary mb-6 inline-flex items-center gap-2 text-[10px]">
              <Plus size={14} /> Add Product
            </button>

            {(showAddForm || editingProduct) && editingProduct && (
              <ProductForm product={editingProduct} onSave={(p) => {
                if (showAddForm) addProduct(p); else updateProduct(p.id, p);
                setEditingProduct(null); setShowAddForm(false);
                toast.success(showAddForm ? 'Product added' : 'Product updated');
              }} onCancel={() => { setEditingProduct(null); setShowAddForm(false); }} />
            )}

            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="flex items-center gap-4 p-4 border border-border">
                  <img src={p.image} alt={p.name} className="w-16 h-20 object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.category} • ৳{p.price.toLocaleString()} • Stock: {p.stock}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingProduct(p); setShowAddForm(false); }} className="p-2 border border-border hover:bg-accent transition-colors"><Edit size={14} /></button>
                    <button onClick={() => { deleteProduct(p.id); toast.success('Product deleted'); }} className="p-2 border border-border hover:bg-destructive/10 text-destructive transition-colors"><Trash2 size={14} /></button>
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
                      <p className="text-sm font-medium">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`luxury-badge ${order.status === 'Pending' ? 'bg-accent text-accent-foreground' : ''}`}>{order.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.customer.name} • {order.customer.phone}</p>
                  <p className="text-sm text-muted-foreground">{order.customer.address}, {order.customer.city}</p>
                  <div className="mt-3">
                    {order.items.map((item, i) => (
                      <p key={i} className="text-xs text-muted-foreground">{item.name} ({item.size}/{item.color}) × {item.quantity} — ৳{(item.price * item.quantity).toLocaleString()}</p>
                    ))}
                  </div>
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

const ProductForm = ({ product, onSave, onCancel }: { product: Product; onSave: (p: Product) => void; onCancel: () => void }) => {
  const [form, setForm] = useState(product);

  return (
    <div className="border border-border p-6 mb-6 space-y-4">
      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product Name" className="luxury-input" />
      <div className="grid grid-cols-2 gap-4">
        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} placeholder="Price" className="luxury-input" />
        <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} placeholder="Stock" className="luxury-input" />
      </div>
      <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="Image URL" className="luxury-input" />
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
