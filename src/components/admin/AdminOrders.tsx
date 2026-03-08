import { useState } from 'react';
import { useOrders, useUpdateOrder } from '@/hooks/useSupabase';
import { ShoppingBag, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const AdminOrders = () => {
  const { data: orders = [] } = useOrders();
  const updateOrder = useUpdateOrder();
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateOrder.mutateAsync({ id, status });
      toast.success(`Order status updated to ${status}`);
    } catch (err: any) { toast.error(err.message); }
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
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
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
                      <button onClick={() => setSelectedOrder(order)} className="p-2 hover:bg-accent transition-colors"><Eye size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{filtered.length} order(s)</p>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-background border border-border max-w-lg w-full max-h-[80vh] overflow-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Order #{selectedOrder.id.slice(0, 8)}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Customer:</span> {selectedOrder.customer_name}</p>
              <p><span className="text-muted-foreground">Phone:</span> {selectedOrder.customer_phone}</p>
              <p><span className="text-muted-foreground">Address:</span> {selectedOrder.customer_address}</p>
              <p><span className="text-muted-foreground">City:</span> {selectedOrder.customer_city}</p>
              <p><span className="text-muted-foreground">Delivery:</span> {selectedOrder.delivery_method}</p>
              <p><span className="text-muted-foreground">Payment:</span> {selectedOrder.payment_method}</p>
              <p><span className="text-muted-foreground">Status:</span> <span className="luxury-badge">{selectedOrder.status}</span></p>
              <p><span className="text-muted-foreground">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>
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

export default AdminOrders;
