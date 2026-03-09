import { useState, useMemo } from 'react';
import { useProducts, useOrders } from '@/hooks/useSupabase';
import { Package, ShoppingBag, DollarSign, TrendingUp, XCircle, RotateCcw, CreditCard, Truck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subDays, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';

const AdminDashboard = () => {
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useOrders();

  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const d = parseISO(o.created_at);
      return isWithinInterval(d, {
        start: startOfDay(parseISO(dateRange.from)),
        end: endOfDay(parseISO(dateRange.to)),
      });
    });
  }, [orders, dateRange]);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = filteredOrders.filter(o => o.status === 'Pending').length;
  const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled').length;
  const returnedOrders = filteredOrders.filter(o => o.status === 'Returned').length;
  const codOrders = filteredOrders.filter(o => o.payment_method === 'cod').length;
  const onlineOrders = filteredOrders.filter(o => o.payment_method !== 'cod').length;
  const lowStock = products.filter(p => p.stock < 5).length;

  // Daily revenue chart data
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => {
      if (o.status === 'Cancelled') return;
      const day = format(parseISO(o.created_at), 'MMM dd');
      map[day] = (map[day] || 0) + o.total;
    });
    return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
  }, [filteredOrders]);

  // Payment method pie data
  const paymentData = useMemo(() => {
    const methods: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const method = o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method?.toUpperCase() || 'Other';
      methods[method] = (methods[method] || 0) + 1;
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Order status pie data
  const statusData = useMemo(() => {
    const statuses: Record<string, number> = {};
    filteredOrders.forEach(o => {
      statuses[o.status] = (statuses[o.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent-foreground))', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  const stats = [
    { label: 'Total Orders', value: filteredOrders.length, icon: ShoppingBag, color: 'bg-accent text-accent-foreground' },
    { label: 'Revenue', value: `৳${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-secondary text-secondary-foreground' },
    { label: 'COD Orders', value: codOrders, icon: Truck, color: 'bg-primary/10 text-primary' },
    { label: 'Online Payment', value: onlineOrders, icon: CreditCard, color: 'bg-muted text-muted-foreground' },
    { label: 'Pending', value: pendingOrders, icon: TrendingUp, color: 'bg-primary/10 text-primary' },
    { label: 'Cancelled', value: cancelledOrders, icon: XCircle, color: 'bg-destructive/10 text-destructive' },
    { label: 'Returned', value: returnedOrders, icon: RotateCcw, color: 'bg-destructive/10 text-destructive' },
    { label: 'Products', value: products.length, icon: Package, color: 'bg-secondary text-secondary-foreground' },
  ];

  return (
    <div className="space-y-8">
      {/* Date range picker */}
      <div className="flex flex-wrap items-center gap-3 border border-border p-4">
        <span className="text-xs text-muted-foreground tracking-wider uppercase">Date Range:</span>
        <input
          type="date"
          value={dateRange.from}
          onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
          className="luxury-input w-auto text-sm"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <input
          type="date"
          value={dateRange.to}
          onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
          className="luxury-input w-auto text-sm"
        />
        <div className="flex gap-2 ml-auto">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDateRange({ from: format(subDays(new Date(), d), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') })}
              className="luxury-button-outline text-[10px] px-3 py-1.5"
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase">{s.label}</span>
              <div className={`p-1.5 rounded ${s.color}`}><s.icon size={14} /></div>
            </div>
            <p className="text-xl font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Bar Chart */}
      <div className="border border-border p-5">
        <h3 className="text-sm font-light tracking-wide mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Revenue Overview
        </h3>
        {dailyData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No revenue data for selected period</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 0,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Method Pie */}
        <div className="border border-border p-5">
          <h3 className="text-sm font-light tracking-wide mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Payment Methods
          </h3>
          {paymentData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="border border-border p-5">
          <h3 className="text-sm font-light tracking-wide mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Order Status
          </h3>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Low stock warning */}
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

      {/* Recent orders */}
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
                  <span className={`luxury-badge text-[8px] ${order.status === 'Cancelled' ? 'bg-destructive/10 text-destructive' : order.status === 'Returned' ? 'bg-destructive/10 text-destructive' : ''}`}>{order.status}</span>
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
