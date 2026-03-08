import { useState } from 'react';
import { useOrders, useUpdateOrder } from '@/hooks/useSupabase';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Eye, X, Pencil, Save, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const FRAUD_COLORS: Record<string, string> = {
  Delivered: 'hsl(142, 71%, 45%)',
  Pending: 'hsl(48, 96%, 53%)',
  Processing: 'hsl(207, 90%, 54%)',
  Shipped: 'hsl(262, 83%, 58%)',
  Cancelled: 'hsl(0, 84%, 60%)',
};

const AdminOrders = () => {
  const { data: orders = [] } = useOrders();
  const updateOrder = useUpdateOrder();
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    customer_name: '', customer_phone: '', customer_address: '',
    customer_city: '', delivery_method: '', payment_method: '',
  });

  // Fraud check state
  const [fraudData, setFraudData] = useState<any>(null);
  const [fraudLoading, setFraudLoading] = useState(false);

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateOrder.mutateAsync({ id, status });
      toast.success(`Order status updated to ${status}`);
    } catch (err: any) { toast.error(err.message); }
  };

  const openOrder = (order: any) => {
    setSelectedOrder(order);
    setEditing(false);
    setFraudData(null);
    setEditData({
      customer_name: order.customer_name, customer_phone: order.customer_phone,
      customer_address: order.customer_address, customer_city: order.customer_city,
      delivery_method: order.delivery_method, payment_method: order.payment_method,
    });
  };

  const saveEdit = async () => {
    if (!selectedOrder) return;
    try {
      await updateOrder.mutateAsync({ id: selectedOrder.id, ...editData });
      setSelectedOrder({ ...selectedOrder, ...editData });
      setEditing(false);
      toast.success('Customer details updated!');
    } catch (err: any) { toast.error(err.message); }
  };

  const runFraudCheck = async (phone: string, name: string) => {
    setFraudLoading(true);
    setFraudData(null);
    try {
      // 1. Check our own database by phone
      const { data: dbOrders } = await supabase
        .from('orders')
        .select('status, total, created_at')
        .eq('customer_phone', phone);

      const localOrders = dbOrders || [];
      const statusCounts: Record<string, number> = {};
      localOrders.forEach(o => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });

      const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
      const totalOrders = localOrders.length;
      const cancelledCount = statusCounts['Cancelled'] || 0;
      const deliveredCount = statusCounts['Delivered'] || 0;
      const cancelRate = totalOrders > 0 ? Math.round((cancelledCount / totalOrders) * 100) : 0;
      const totalSpent = localOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      // 2. Check Steadfast for this phone (optional - won't fail if no connection)
      let steadfastInfo = null;
      try {
        const { data: sfResult } = await supabase.functions.invoke('steadfast-courier', {
          body: { action: 'check_status', data: { consignment_id: phone } },
        });
        if (sfResult?.success) steadfastInfo = sfResult.data;
      } catch { /* ignore */ }

      // 3. Check Pathao (optional)
      let pathaoInfo = null;
      try {
        const { data: ptResult } = await supabase.functions.invoke('pathao-courier', {
          body: { action: 'view_order', data: { consignment_id: phone } },
        });
        if (ptResult?.success) pathaoInfo = ptResult.data;
      } catch { /* ignore */ }

      // Risk score
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (cancelRate > 50 || (totalOrders >= 3 && cancelRate > 40)) riskLevel = 'high';
      else if (cancelRate > 25 || (totalOrders >= 2 && cancelledCount > 0)) riskLevel = 'medium';

      setFraudData({
        pieData,
        totalOrders,
        cancelledCount,
        deliveredCount,
        cancelRate,
        totalSpent,
        riskLevel,
        steadfastInfo,
        pathaoInfo,
        customerName: name,
        customerPhone: phone,
      });
    } catch (err: any) {
      toast.error('Fraud check failed: ' + err.message);
    } finally {
      setFraudLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {['All', ...statusOptions].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`text-[10px] tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${filter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
            {s} {s !== 'All' && `(${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Order ID</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium hidden sm:table-cell">Customer</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium hidden md:table-cell">City</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Total</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Status</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium hidden lg:table-cell">Date</th>
                  <th className="text-right p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                    <td className="p-3 hidden sm:table-cell">
                      <button
                        onClick={() => { openOrder(order); runFraudCheck(order.customer_phone, order.customer_name); }}
                        className="text-left hover:underline underline-offset-2 decoration-primary/50"
                      >
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                      </button>
                    </td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{order.customer_city}</td>
                    <td className="p-3 font-medium">৳{order.total.toLocaleString()}</td>
                    <td className="p-3">
                      <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)} className="text-xs border border-border bg-background px-2 py-1 focus:outline-none">
                        {statusOptions.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => openOrder(order)} className="p-2 hover:bg-accent transition-colors"><Eye size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{filtered.length} order(s)</p>

      {/* Order Detail / Fraud Check Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-background border border-border max-w-2xl w-full max-h-[85vh] overflow-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Order #{selectedOrder.id.slice(0, 8)}</h3>
              <div className="flex items-center gap-1">
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="p-1.5 hover:bg-accent transition-colors" title="Edit"><Pencil size={14} /></button>
                ) : (
                  <button onClick={saveEdit} disabled={updateOrder.isPending} className="p-1.5 hover:bg-accent transition-colors text-primary" title="Save">
                    {updateOrder.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  </button>
                )}
                <button onClick={() => setSelectedOrder(null)} className="p-1.5 hover:bg-accent"><X size={16} /></button>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {editing ? (
                <>
                  <EditField label="Customer Name" value={editData.customer_name} onChange={v => setEditData(p => ({ ...p, customer_name: v }))} />
                  <EditField label="Phone" value={editData.customer_phone} onChange={v => setEditData(p => ({ ...p, customer_phone: v }))} />
                  <EditField label="Address" value={editData.customer_address} onChange={v => setEditData(p => ({ ...p, customer_address: v }))} textarea />
                  <EditField label="City" value={editData.customer_city} onChange={v => setEditData(p => ({ ...p, customer_city: v }))} />
                  <EditField label="Delivery Method" value={editData.delivery_method} onChange={v => setEditData(p => ({ ...p, delivery_method: v }))} />
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground tracking-wider uppercase">Payment Method</label>
                    <p className="text-sm py-1.5 text-muted-foreground">{editData.payment_method}</p>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <span className="text-muted-foreground">Customer:</span>{' '}
                    <button
                      onClick={() => runFraudCheck(selectedOrder.customer_phone, selectedOrder.customer_name)}
                      className="hover:underline underline-offset-2 decoration-primary/50 font-medium"
                    >
                      {selectedOrder.customer_name}
                    </button>
                    {!fraudData && !fraudLoading && (
                      <span className="text-[10px] text-muted-foreground ml-2">(click name for fraud check)</span>
                    )}
                  </p>
                  <p><span className="text-muted-foreground">Phone:</span> {selectedOrder.customer_phone}</p>
                  <p><span className="text-muted-foreground">Address:</span> {selectedOrder.customer_address}</p>
                  <p><span className="text-muted-foreground">City:</span> {selectedOrder.customer_city}</p>
                  <p><span className="text-muted-foreground">Delivery:</span> {selectedOrder.delivery_method}</p>
                  <p><span className="text-muted-foreground">Payment:</span> {selectedOrder.payment_method}</p>
                </>
              )}
              <p><span className="text-muted-foreground">Status:</span> <span className="luxury-badge">{selectedOrder.status}</span></p>
              <p><span className="text-muted-foreground">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>

            {/* Fraud Check Section */}
            {fraudLoading && (
              <div className="border border-border p-6 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">Checking fraud risk across couriers...</span>
              </div>
            )}

            {fraudData && (
              <div className="border border-border p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} />
                  <h4 className="text-sm font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Fraud Risk Analysis</h4>
                  <span className={`ml-auto text-[10px] tracking-wider uppercase px-3 py-1 border ${
                    fraudData.riskLevel === 'high' ? 'border-destructive/40 bg-destructive/10 text-destructive' :
                    fraudData.riskLevel === 'medium' ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700' :
                    'border-green-500/40 bg-green-500/10 text-green-700'
                  }`}>
                    {fraudData.riskLevel} risk
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Pie Chart */}
                  <div>
                    {fraudData.pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={fraudData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={30} strokeWidth={1}>
                            {fraudData.pieData.map((entry: any, index: number) => (
                              <Cell key={index} fill={FRAUD_COLORS[entry.name] || 'hsl(var(--muted-foreground))'} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: '11px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">No order history</div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Total Orders</span>
                      <span className="font-medium">{fraudData.totalOrders}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Delivered</span>
                      <span className="font-medium">{fraudData.deliveredCount}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Cancelled</span>
                      <span className="font-medium">{fraudData.cancelledCount}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Cancel Rate</span>
                      <span className={`font-medium ${fraudData.cancelRate > 40 ? 'text-destructive' : fraudData.cancelRate > 20 ? 'text-yellow-600' : ''}`}>
                        {fraudData.cancelRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Spent</span>
                      <span className="font-medium">৳{fraudData.totalSpent.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Courier checks info */}
                <div className="text-[10px] text-muted-foreground border-t border-border pt-3 space-y-0.5">
                  <p>✓ Local database checked ({fraudData.totalOrders} orders found)</p>
                  <p>{fraudData.steadfastInfo ? '✓' : '○'} Steadfast courier {fraudData.steadfastInfo ? 'data found' : 'checked (no match)'}</p>
                  <p>{fraudData.pathaoInfo ? '✓' : '○'} Pathao courier {fraudData.pathaoInfo ? 'data found' : 'checked (no match)'}</p>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="border-t border-border pt-4">
              <h4 className="text-xs tracking-wider uppercase text-muted-foreground mb-3">Items</h4>
              <div className="space-y-2">
                {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>৳{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-medium mt-3 pt-3 border-t border-border">
                <span>Total</span>
                <span>৳{selectedOrder.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditField = ({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) => (
  <div className="space-y-1">
    <label className="text-xs text-muted-foreground tracking-wider uppercase">{label}</label>
    {textarea ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className="luxury-input w-full text-sm" />
    ) : (
      <input value={value} onChange={e => onChange(e.target.value)} className="luxury-input w-full text-sm" />
    )}
  </div>
);

export default AdminOrders;
