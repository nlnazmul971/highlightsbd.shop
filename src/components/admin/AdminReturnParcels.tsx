import { useState, useMemo } from 'react';
import { useOrders, useUpdateOrder } from '@/hooks/useSupabase';
import { supabase } from '@/integrations/supabase/client';
import { RotateCcw, Eye, X, Search, Package, DollarSign, TrendingDown, PackageCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';

const AdminReturnParcels = () => {
  const { data: orders = [] } = useOrders();
  const updateOrder = useUpdateOrder();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [filter, setFilter] = useState<'Returned' | 'Cancelled' | 'ReturnCancel' | 'All'>('All');
  const [receivedFilter, setReceivedFilter] = useState<'all' | 'received' | 'not_received'>('all');

  const isReturnLike = (s: string) => s === 'Returned' || s === 'Cancelled' || s === 'ReturnCancel';

  const returnedOrders = useMemo(() => {
    let filtered = orders.filter(o => isReturnLike(o.status));
    if (filter !== 'All') filtered = filtered.filter(o => o.status === filter);
    if (receivedFilter === 'received') filtered = filtered.filter(o => (o as any).return_received === true);
    if (receivedFilter === 'not_received') filtered = filtered.filter(o => !(o as any).return_received);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.id.toLowerCase().includes(q) ||
        ((o as any).tracking_code && (o as any).tracking_code.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [orders, filter, searchQuery, receivedFilter]);

  const returnedCount = orders.filter(o => o.status === 'Returned').length;
  const cancelledCount = orders.filter(o => o.status === 'Cancelled').length;
  const returnCancelCount = orders.filter(o => o.status === 'ReturnCancel').length;
  const returnCancelLoss = orders.filter(o => o.status === 'ReturnCancel').reduce((s, o) => s + ((o as any).courier_fee || 0), 0);
  const returnedRevenueLoss = orders.filter(o => o.status === 'Returned').reduce((s, o) => s + o.total, 0);
  const cancelledRevenueLoss = orders.filter(o => o.status === 'Cancelled').reduce((s, o) => s + o.total, 0);
  const receivedCount = orders.filter(o => isReturnLike(o.status) && (o as any).return_received).length;
  const notReceivedCount = orders.filter(o => isReturnLike(o.status) && !(o as any).return_received).length;

  const toggleReceived = async (order: any) => {
    const newVal = !(order as any).return_received;
    try {
      await updateOrder.mutateAsync({ id: order.id, return_received: newVal } as any);
      toast.success(newVal ? 'পার্সেল হাতে পেয়েছেন মার্ক করা হয়েছে ✅' : 'পার্সেল কুরিয়ারে আছে মার্ক করা হয়েছে');
      if (selectedOrder?.id === order.id) setSelectedOrder({ ...selectedOrder, return_received: newVal });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRestoreOrder = async (order: any) => {
    try {
      await updateOrder.mutateAsync({ id: order.id, status: 'Pending', return_received: false } as any);
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        if (item.product_id && item.size) {
          const { data: existing } = await supabase.from('product_size_stock')
            .select('*').eq('product_id', item.product_id).eq('size', item.size).maybeSingle();
          if (existing) {
            const field = order.status === 'Cancelled' ? 'cancelled_count' : 'returned_count';
            const newVal = Math.max(0, (existing as any)[field] - (item.quantity || 1));
            await supabase.from('product_size_stock').update({ [field]: newVal } as any).eq('id', existing.id);
          }
          await supabase.from('stock_logs').insert({
            product_id: item.product_id, size: item.size,
            change_type: 'restored', quantity: item.quantity || 1,
            order_id: order.id, notes: `Order restored from ${order.status}`,
          });
        }
      }
      toast.success('অর্ডার Pending এ ফিরিয়ে আনা হয়েছে এবং স্টক আপডেট হয়েছে');
      setSelectedOrder(null);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Return & Cancel Parcel Management</h2>
        <p className="text-xs text-muted-foreground mt-1">Returned ও Cancelled অর্ডার গুলো ম্যানেজ করুন</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-pink-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-1"><RotateCcw size={14} className="text-pink-500" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Returned</span></div>
          <p className="text-xl font-light">{returnedCount}</p>
        </div>
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-red-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-1"><X size={14} className="text-red-500" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cancelled</span></div>
          <p className="text-xl font-light">{cancelledCount}</p>
        </div>
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-orange-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-1"><TrendingDown size={14} className="text-orange-500" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Return Loss</span></div>
          <p className="text-xl font-light">৳{returnedRevenueLoss.toLocaleString()}</p>
        </div>
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-red-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-red-500" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cancel Loss</span></div>
          <p className="text-xl font-light">৳{cancelledRevenueLoss.toLocaleString()}</p>
        </div>
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-orange-600/5 to-transparent">
          <div className="flex items-center gap-2 mb-1"><X size={14} className="text-orange-600" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Return Cancel</span></div>
          <p className="text-xl font-light">{returnCancelCount}</p>
          <p className="text-[10px] text-muted-foreground">Courier loss: ৳{returnCancelLoss.toLocaleString()}</p>
        </div>
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-green-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-1"><PackageCheck size={14} className="text-green-500" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">হাতে পেয়েছি</span></div>
          <p className="text-xl font-light">{receivedCount}</p>
        </div>
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-yellow-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-1"><Truck size={14} className="text-yellow-500" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">কুরিয়ারে আছে</span></div>
          <p className="text-xl font-light">{notReceivedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, phone, order ID, tracking..."
            className="luxury-input pl-9 w-full text-sm" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['All', 'Returned', 'Cancelled', 'ReturnCancel'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
              }`}>
              {f === 'ReturnCancel' ? 'Return Cancel' : f} {f !== 'All' && `(${orders.filter(o => o.status === f).length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {([
            { key: 'all', label: 'সব' },
            { key: 'received', label: '✅ হাতে পেয়েছি' },
            { key: 'not_received', label: '🚚 কুরিয়ারে' },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setReceivedFilter(f.key as any)}
              className={`text-[10px] tracking-[0.1em] px-3 py-1.5 border transition-colors ${
                receivedFilter === f.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {returnedOrders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">কোনো return/cancel অর্ডার নেই 🎉</p>
        </div>
      ) : (
        <div className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Order</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Customer</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium hidden sm:table-cell">Items</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Total</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Status</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">পার্সেল</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium hidden md:table-cell">Courier</th>
                  <th className="text-right p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {returnedOrders.map(order => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  const isReceived = (order as any).return_received;
                  return (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                      <td className="p-3">
                        <p className="font-medium text-sm">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {items.map((i: any) => `${i.name} (${i.size || '-'})`).join(', ')}
                        </div>
                      </td>
                      <td className="p-3 font-medium">৳{order.total.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`text-[10px] tracking-wider uppercase px-2 py-1 border ${
                          order.status === 'Returned' ? 'border-pink-500/40 bg-pink-500/10 text-pink-600' :
                          order.status === 'ReturnCancel' ? 'border-orange-600/40 bg-orange-500/10 text-orange-600' :
                          'border-red-500/40 bg-red-500/10 text-red-600'
                        }`}>{order.status === 'ReturnCancel' ? 'Return Cancel' : order.status}</span>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleReceived(order); }}
                          className={`text-[10px] tracking-wider uppercase px-2 py-1 border transition-colors cursor-pointer ${
                            isReceived
                              ? 'border-green-500/40 bg-green-500/10 text-green-600'
                              : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700'
                          }`}
                        >
                          {isReceived ? '✅ হাতে পেয়েছি' : '🚚 কুরিয়ারে'}
                        </button>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {(order as any).tracking_code ? (
                          <span className="text-xs font-mono text-muted-foreground">{(order as any).tracking_code}</span>
                        ) : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelectedOrder(order)} className="p-1.5 hover:bg-accent transition-colors" title="View"><Eye size={14} /></button>
                          <button onClick={() => handleRestoreOrder(order)} className="p-1.5 hover:bg-primary/10 text-primary transition-colors" title="Restore to Pending">
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{returnedOrders.length} order(s)</p>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-background border border-border max-w-lg w-full max-h-[80vh] overflow-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Order #{selectedOrder.id.slice(0, 8)}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Customer:</span> {selectedOrder.customer_name}</p>
              <p><span className="text-muted-foreground">Phone:</span> {selectedOrder.customer_phone}</p>
              <p><span className="text-muted-foreground">Address:</span> {selectedOrder.customer_address}, {selectedOrder.customer_city}</p>
              <p><span className="text-muted-foreground">Status:</span> <span className={`font-medium ${selectedOrder.status === 'Returned' ? 'text-pink-600' : 'text-red-600'}`}>{selectedOrder.status}</span></p>
              {(selectedOrder as any).tracking_code && <p><span className="text-muted-foreground">Tracking:</span> {(selectedOrder as any).tracking_code}</p>}
              {(selectedOrder as any).courier_provider && <p><span className="text-muted-foreground">Courier:</span> {(selectedOrder as any).courier_provider}</p>}
              {(selectedOrder as any).admin_notes && <p><span className="text-muted-foreground">Notes:</span> <span className="italic">{(selectedOrder as any).admin_notes}</span></p>}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => toggleReceived(selectedOrder)}
                  className={`text-sm px-4 py-2 border transition-colors cursor-pointer rounded ${
                    (selectedOrder as any).return_received
                      ? 'border-green-500/40 bg-green-500/10 text-green-600'
                      : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700'
                  }`}
                >
                  {(selectedOrder as any).return_received ? '✅ পার্সেল হাতে পেয়েছি' : '🚚 পার্সেল এখনো কুরিয়ারে আছে — ক্লিক করে হাতে পাওয়া মার্ক করুন'}
                </button>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <h4 className="text-xs tracking-wider uppercase text-muted-foreground mb-2">Items</h4>
              {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item: any, i: number) => (
                <div key={i} className="flex justify-between py-1 text-sm">
                  <span>{item.name} <span className="text-muted-foreground">({item.size || '-'}) x{item.quantity}</span></span>
                  <span className="font-medium">৳{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium pt-2 border-t border-border mt-2">
                <span>Total</span><span>৳{selectedOrder.total.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => handleRestoreOrder(selectedOrder)}
              className="w-full luxury-button-primary text-sm py-2.5 inline-flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Restore to Pending
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturnParcels;