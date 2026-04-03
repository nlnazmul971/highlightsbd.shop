import { useState, useMemo } from 'react';
import { useProducts, useOrders } from '@/hooks/useSupabase';
import { Package, ShoppingBag, DollarSign, TrendingUp, XCircle, RotateCcw, CreditCard, Truck, TrendingDown, Facebook, Store } from 'lucide-react';
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
  const totalAdvance = activeOrders.reduce((sum, o) => sum + ((o as any).advance_payment || 0), 0);
  
  // Delivery Revenue = only Delivered orders, minus courier fees
  const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered');
  const deliveredTotal = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const deliveredCourierFee = deliveredOrders.reduce((sum, o) => sum + ((o as any).courier_fee || 0), 0);
  const deliveredAdvance = deliveredOrders.reduce((sum, o) => sum + ((o as any).advance_payment || 0), 0);
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

  // Offline order stats
  const offlineOrders = filteredOrders.filter((o: any) => o.source === 'offline');
  const offlineOrderCount = offlineOrders.length;
  const offlineRevenue = offlineOrders.reduce((sum, o) => sum + o.total, 0);

  // Daily revenue chart data
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => {
      if (o.status === 'Cancelled' || o.status === 'Returned') return;
      const day = format(parseISO(o.created_at), 'MMM dd');
      map[day] = (map[day] || 0) + o.total;
    });
    return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
  }, [filteredOrders]);

  // Daily cancelled orders
  const dailyCancelled = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.filter(o => o.status === 'Cancelled').forEach(o => {
      const day = format(parseISO(o.created_at), 'MMM dd');
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [filteredOrders]);

  // Daily returned orders
  const dailyReturned = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.filter(o => o.status === 'Returned').forEach(o => {
      const day = format(parseISO(o.created_at), 'MMM dd');
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [filteredOrders]);

  // Daily FB orders
  const dailyFb = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.filter((o: any) => o.source === 'facebook').forEach(o => {
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
    { label: 'Offline Orders', value: offlineOrderCount, icon: Store, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Offline Revenue', value: `৳${offlineRevenue.toLocaleString()}`, icon: Store, color: 'bg-emerald-500/10 text-emerald-600' },
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

      {/* Charts Grid - Revenue + Mini Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Overview - Compact */}
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <h3 className="text-xs font-semibold tracking-wider uppercase text-indigo-600">Revenue Overview</h3>
          </div>
          {dailyData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* FB Orders Revenue - Compact */}
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="text-xs font-semibold tracking-wider uppercase text-blue-600">FB Orders Revenue</h3>
          </div>
          <p className="text-lg font-bold text-blue-600 mb-2">৳{fbRevenue.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">({fbOrderCount} orders)</span></p>
          {dailyFb.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No FB orders</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={dailyFb}>
                <defs>
                  <linearGradient id="fbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} formatter={(value: number) => [`৳${value.toLocaleString()}`, 'FB Revenue']} />
                <Bar dataKey="revenue" fill="url(#fbGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cancelled Orders - Compact */}
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-red-500/5 to-orange-500/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h3 className="text-xs font-semibold tracking-wider uppercase text-red-500">Cancelled Orders</h3>
          </div>
          <p className="text-lg font-bold text-red-500 mb-2">{cancelledOrders} <span className="text-[10px] font-normal text-muted-foreground">cancelled</span></p>
          {dailyCancelled.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No cancellations 🎉</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={dailyCancelled}>
                <defs>
                  <linearGradient id="cancelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" fill="url(#cancelGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Returned Orders - Compact */}
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-pink-500/5 to-rose-500/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-pink-500" />
            <h3 className="text-xs font-semibold tracking-wider uppercase text-pink-500">Returned Orders</h3>
          </div>
          <p className="text-lg font-bold text-pink-500 mb-2">{returnedOrders} <span className="text-[10px] font-normal text-muted-foreground">returned</span></p>
          {dailyReturned.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No returns 🎉</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={dailyReturned}>
                <defs>
                  <linearGradient id="returnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2} fill="url(#returnGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-background to-secondary/20">
          <h3 className="text-xs font-semibold tracking-wider uppercase mb-3">Payment Methods</h3>
          {paymentData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <defs>
                  {PIE_COLORS.map((color, i) => (
                    <linearGradient key={i} id={`payGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" cornerRadius={6} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}>
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={`url(#payGrad${i % PIE_COLORS.length})`} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-background to-secondary/20">
          <h3 className="text-xs font-semibold tracking-wider uppercase mb-3">Order Status</h3>
          {statusData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <defs>
                  {statusData.map((entry, i) => (
                    <linearGradient key={i} id={`statusGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} stopOpacity={1} />
                      <stop offset="100%" stopColor={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} stopOpacity={0.65} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" cornerRadius={6} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={`url(#statusGrad${i})`} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Low stock warning */}
      {lowStock > 0 && (
        <div className="border border-destructive/30 bg-destructive/5 p-4 rounded-lg">
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
        <h2 className="text-sm font-semibold tracking-wider uppercase mb-3">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between border border-border p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                  {(order as any).source === 'facebook' && <span className="bg-blue-500/10 text-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded">FB</span>}
                  <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">৳{order.total.toLocaleString()}</p>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${order.status === 'Cancelled' ? 'bg-red-500/10 text-red-500' : order.status === 'Returned' ? 'bg-pink-500/10 text-pink-500' : order.status === 'Delivered' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>{order.status}</span>
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
