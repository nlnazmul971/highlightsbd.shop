import { useState, useMemo } from 'react';
import { useProducts, useOrders } from '@/hooks/useSupabase';
import { Package, ShoppingBag, DollarSign, TrendingUp, XCircle, RotateCcw, CreditCard, Truck, TrendingDown, Facebook } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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

  // Revenue excludes Cancelled & Returned orders
  const activeOrders = filteredOrders.filter(o => o.status !== 'Cancelled' && o.status !== 'Returned');
  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCourierFee = activeOrders.reduce((sum, o) => sum + ((o as any).courier_fee || 0), 0);
  
  // Delivery Revenue = only Delivered orders, minus courier fees
  const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered');
  const deliveredTotal = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const deliveredCourierFee = deliveredOrders.reduce((sum, o) => sum + ((o as any).courier_fee || 0), 0);
  const deliveryRevenue = deliveredTotal - deliveredCourierFee;

  const pendingOrders = filteredOrders.filter(o => o.status === 'Pending').length;
  const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled').length;
  const returnedOrders = filteredOrders.filter(o => o.status === 'Returned').length;
  const codOrders = filteredOrders.filter(o => o.payment_method === 'cod').length;
  const onlineOrders = filteredOrders.filter(o => o.payment_method !== 'cod').length;
  const lowStock = products.filter(p => p.stock < 5).length;

  // Facebook order stats
  const fbOrders = filteredOrders.filter((o: any) => o.source === 'facebook');
  const fbOrderCount = fbOrders.length;
  const fbRevenue = fbOrders.reduce((sum, o) => sum + o.total, 0);

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

  const PIE_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
  const STATUS_COLORS: Record<string, string> = {
    Pending: '#f59e0b',
    Processing: '#3b82f6',
    Shipped: '#8b5cf6',
    Delivered: '#10b981',
    Cancelled: '#ef4444',
    Returned: '#f43f5e',
  };

  const stats = [
    { label: 'Total Orders', value: filteredOrders.length, icon: ShoppingBag, color: 'bg-accent text-accent-foreground' },
    { label: 'Revenue', value: `৳${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-secondary text-secondary-foreground' },
    { label: 'Delivery Revenue', value: `৳${deliveryRevenue.toLocaleString()}`, icon: TrendingDown, color: 'bg-primary/10 text-primary', sub: `Delivered: ${deliveredOrders.length} | Courier: ৳${deliveredCourierFee.toLocaleString()}` },
    { label: 'FB Orders', value: fbOrderCount, icon: Facebook, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'FB Revenue', value: `৳${fbRevenue.toLocaleString()}`, icon: Facebook, color: 'bg-blue-500/10 text-blue-600' },
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
        <input type="date" value={dateRange.from} onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))} className="luxury-input w-auto text-sm" />
        <span className="text-xs text-muted-foreground">to</span>
        <input type="date" value={dateRange.to} onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))} className="luxury-input w-auto text-sm" />
        <div className="flex gap-2 ml-auto">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDateRange({ from: format(subDays(new Date(), d), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') })} className="luxury-button-outline text-[10px] px-3 py-1.5">
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className="border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase">{s.label}</span>
              <div className={`p-1.5 rounded ${s.color}`}><s.icon size={14} /></div>
            </div>
            <p className="text-xl font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
            {(s as any).sub && <p className="text-[10px] text-muted-foreground">{(s as any).sub}</p>}
          </div>
        ))}
      </div>

      {/* Revenue Area Chart */}
      <div className="border border-border p-5 rounded-lg bg-gradient-to-br from-background to-secondary/20">
        <h3 className="text-sm font-medium tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>Revenue Overview</h3>
        <p className="text-xs text-muted-foreground mb-4">Daily revenue for selected period</p>
        {dailyData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No revenue data for selected period</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border p-5 rounded-lg bg-gradient-to-br from-background to-secondary/20">
          <h3 className="text-sm font-medium tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>Payment Methods</h3>
          <p className="text-xs text-muted-foreground mb-4">Breakdown by payment type</p>
          {paymentData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <defs>
                  {PIE_COLORS.map((color, i) => (
                    <linearGradient key={i} id={`payGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" cornerRadius={6} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}>
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={`url(#payGrad${i % PIE_COLORS.length})`} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-border p-5 rounded-lg bg-gradient-to-br from-background to-secondary/20">
          <h3 className="text-sm font-medium tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>Order Status</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribution of order statuses</p>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <defs>
                  {statusData.map((entry, i) => (
                    <linearGradient key={i} id={`statusGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} stopOpacity={1} />
                      <stop offset="100%" stopColor={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} stopOpacity={0.65} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" cornerRadius={6} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={`url(#statusGrad${i})`} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
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
