import { useProducts, useOrders } from '@/hooks/useSupabase';
import { Package, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useOrders();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const lowStock = products.filter(p => p.stock < 5).length;

  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: 'bg-primary/10 text-primary' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'bg-accent text-accent-foreground' },
    { label: 'Revenue', value: `৳${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-secondary text-secondary-foreground' },
    { label: 'Pending Orders', value: pendingOrders, icon: TrendingUp, color: 'bg-muted text-muted-foreground' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground tracking-wider uppercase">{s.label}</span>
              <div className={`p-2 rounded ${s.color}`}><s.icon size={16} /></div>
            </div>
            <p className="text-2xl font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {lowStock > 0 && (
        <div className="border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-medium">⚠️ {lowStock} product(s) with low stock (less than 5)</p>
          <div className="mt-3 space-y-1">
            {products.filter(p => p.stock < 5).map(p => (
              <p key={p.id} className="text-xs text-muted-foreground">{p.name} — Stock: {p.stock}</p>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-light tracking-wide mb-4" style={{ fontFamily: 'var(--font-display)' }}>Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between border border-border p-3">
                <div>
                  <p className="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">৳{order.total.toLocaleString()}</p>
                  <span className="luxury-badge text-[8px]">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
