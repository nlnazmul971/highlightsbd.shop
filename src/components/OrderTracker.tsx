import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const statusSteps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
const statusIcons: Record<string, React.ReactNode> = {
  Pending: <Clock size={16} />,
  Processing: <Package size={16} />,
  Shipped: <Truck size={16} />,
  Delivered: <CheckCircle size={16} />,
  Cancelled: <XCircle size={16} />,
};

const OrderTracker = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Cancelled' })
        .eq('id', orderId)
        .eq('user_id', userId)
        .eq('status', 'Pending');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['my-orders', userId] });
      setCancellingId(null);
    },
    onError: () => {
      toast.error('Failed to cancel order');
      setCancellingId(null);
    },
  });

  if (isLoading) return <p className="text-center text-sm text-muted-foreground">Loading orders...</p>;
  if (orders.length === 0) return <p className="text-center text-sm text-muted-foreground">No orders yet.</p>;

  return (
    <div className="space-y-4">
      <h2 className="luxury-heading text-lg tracking-[0.1em] text-center">My Orders</h2>
      {orders.map((order) => {
        const isCancelled = order.status === 'Cancelled';
        const currentStep = isCancelled ? -1 : statusSteps.indexOf(order.status);
        const items = (order.items as any[]) || [];
        return (
          <div key={order.id} className={`border border-border p-4 space-y-3 ${isCancelled ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium">৳{order.total.toLocaleString()}</span>
                {isCancelled && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1 justify-end mt-0.5">
                    <XCircle size={12} /> Cancelled
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1">
              {items.map((item: any, idx: number) => (
                <p key={idx} className="text-xs text-muted-foreground">
                  {item.name} × {item.quantity} — {item.size}/{item.color}
                </p>
              ))}
            </div>

            {/* Status tracker */}
            {!isCancelled && (
              <div className="flex items-center justify-between gap-1 pt-2">
                {statusSteps.map((step, i) => (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                      i <= currentStep ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
                    }`}>
                      {statusIcons[step]}
                    </div>
                    <span className={`text-[9px] ${i <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {order.tracking_code && (
              <p className="text-xs text-muted-foreground">
                Tracking: <span className="font-medium text-foreground">{order.tracking_code}</span>
                {order.courier_provider && ` (${order.courier_provider})`}
              </p>
            )}

            {/* Cancel button - only for Pending orders */}
            {order.status === 'Pending' && (
              cancellingId === order.id ? (
                <div className="flex items-center gap-2 pt-1">
                  <p className="text-xs text-muted-foreground">Cancel this order?</p>
                  <button
                    onClick={() => cancelOrder.mutate(order.id)}
                    disabled={cancelOrder.isPending}
                    className="text-xs text-destructive font-medium hover:underline"
                  >
                    {cancelOrder.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                  </button>
                  <button
                    onClick={() => setCancellingId(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCancellingId(order.id)}
                  className="text-xs text-destructive hover:underline flex items-center gap-1 pt-1"
                >
                  <XCircle size={12} /> Cancel Order
                </button>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderTracker;
