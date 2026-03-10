import { useState } from 'react';
import { useOrders, useUpdateOrder } from '@/hooks/useSupabase';
import { supabase } from '@/integrations/supabase/client';
import { callCourier, sendOrderEmail } from '@/lib/api';
import { ShoppingBag, Eye, X, Pencil, Save, Loader2, ShieldAlert, Send, RefreshCw, RotateCcw, Truck, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const courierOptions = [
  { id: 'steadfast', name: 'Steadfast Courier' },
  { id: 'pathao', name: 'Pathao Courier' },
];

const COURIER_STATUS_MAP: Record<string, string> = {
  in_review: 'Processing',
  pending: 'Processing',
  delivered: 'Delivered',
  partial_delivered: 'Delivered',
  delivered_approval_pending: 'Shipped',
  cancelled: 'Cancelled',
  cancelled_approval_pending: 'Cancelled',
  hold: 'Processing',
  unknown: 'Processing',
};

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
  const [fraudData, setFraudData] = useState<any>(null);
  const [fraudLoading, setFraudLoading] = useState(false);
  const [courierSending, setCourierSending] = useState<string | null>(null);
  const [syncingStatus, setSyncingStatus] = useState<string | null>(null);
  const [returnLoading, setReturnLoading] = useState<string | null>(null);

  // Courier selection modal state
  const [courierModal, setCourierModal] = useState<{ open: boolean; order: any | null }>({ open: false, order: null });
  const [selectedCourier, setSelectedCourier] = useState<string>('steadfast');

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  const downloadInvoice = (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const invoiceHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice #${order.id.slice(0, 8)}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 40px 30px; color: #1a1a1a; }
  h1 { font-size: 24px; font-weight: 300; letter-spacing: 3px; margin-bottom: 30px; text-transform: uppercase; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; color: #666; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 8px; }
  .info p { margin: 3px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; text-align: left; padding: 8px 0; border-bottom: 1px solid #eee; }
  td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid #f5f5f5; }
  td:last-child, th:last-child { text-align: right; }
  .totals { margin-top: 20px; text-align: right; font-size: 13px; }
  .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; }
  .totals .grand { font-size: 16px; font-weight: 600; border-top: 1px solid #1a1a1a; padding-top: 8px; margin-top: 8px; }
  .note { margin-top: 20px; padding: 12px; background: #f9f9f9; font-size: 12px; color: #666; font-style: italic; }
  @media print { body { padding: 20px; } }
</style></head><body>
<h1>Invoice</h1>
<div class="meta"><span>Order #${order.id.slice(0, 8)}</span><span>${new Date(order.created_at).toLocaleDateString()}</span></div>
<div class="section info">
  <div class="section-title">Customer</div>
  <p><strong>${order.customer_name}</strong></p>
  <p>${order.customer_phone}</p>
  <p>${order.customer_address}, ${order.customer_city}</p>
</div>
<div class="section info">
  <div class="section-title">Payment & Delivery</div>
  <p>Payment: ${order.payment_method}${order.payment_sender_number ? ' | Sender: ' + order.payment_sender_number : ''}${order.transaction_id ? ' | TxID: ' + order.transaction_id : ''}</p>
  <p>Delivery: ${order.delivery_method}</p>
</div>
${order.customer_note ? '<div class="note">Note: ' + order.customer_note + '</div>' : ''}
<table><thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead><tbody>
${items.map((i: any) => `<tr><td>${i.name}</td><td>${i.size || '-'}</td><td>${i.quantity}</td><td>৳${((i.price || 0) * (i.quantity || 1)).toLocaleString()}</td></tr>`).join('')}
</tbody></table>
<div class="totals">
  <div class="row grand"><span>Total</span><span>৳${order.total.toLocaleString()}</span></div>
</div>
</body></html>`;
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) { w.onload = () => { w.print(); URL.revokeObjectURL(url); }; }
  };

  // Send order to Steadfast courier
  const sendToSteadfast = async (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const itemDesc = items.map((i: any) => `${i.name}${i.size ? ` (${i.size})` : ''} x${i.quantity}`).join(', ');

    const result = await callCourier('steadfast', 'create_order', {
      invoice: order.id.slice(0, 8),
      recipient_name: order.customer_name,
      recipient_phone: order.customer_phone,
      recipient_address: `${order.customer_address}, ${order.customer_city}`,
      cod_amount: order.payment_method === 'cod' ? order.total : 0,
      note: `Order #${order.id.slice(0, 8)}`,
      item_description: itemDesc,
      delivery_type: 0,
    });

    if (result.success && result.data?.consignment) {
      const c = result.data.consignment;
      return {
        consignment_id: c.consignment_id?.toString(),
        tracking_code: c.tracking_code,
        courier_provider: 'steadfast',
      };
    } else {
      throw new Error(result.error || result.data?.message || 'Steadfast failed');
    }
  };

  // Send order to Pathao courier
  const sendToPathao = async (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const itemDesc = items.map((i: any) => `${i.name}${i.size ? ` (${i.size})` : ''} x${i.quantity}`).join(', ');

    const result = await callCourier('pathao', 'create_order', {
      store_id: 1,
      merchant_order_id: order.id.slice(0, 8),
      recipient_name: order.customer_name,
      recipient_phone: order.customer_phone,
      recipient_address: order.customer_address,
      recipient_city: 1,
      recipient_zone: 1,
      delivery_type: 48,
      item_type: 2,
      special_instruction: itemDesc,
      item_quantity: items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0),
      item_weight: 0.5,
      amount_to_collect: order.payment_method === 'cod' ? order.total : 0,
      item_description: itemDesc,
    });

    if (result.success && result.data?.data) {
      const c = result.data.data;
      return {
        consignment_id: c.consignment_id?.toString(),
        tracking_code: c.consignment_id?.toString(),
        courier_provider: 'pathao',
      };
    } else {
      throw new Error(result.error || result.data?.message || 'Pathao failed');
    }
  };

  // Main send to courier function
  const sendToCourier = async (order: any, courierProvider: string) => {
    setCourierSending(order.id);
    try {
      let courierData;
      if (courierProvider === 'pathao') {
        courierData = await sendToPathao(order);
      } else {
        courierData = await sendToSteadfast(order);
      }

      await updateOrder.mutateAsync({
        id: order.id,
        status: 'Processing',
        ...courierData,
      });
      setSelectedOrder((prev: any) => prev ? { ...prev, status: 'Processing', ...courierData } : null);
      toast.success(`Courier order created! Tracking: ${courierData.tracking_code || courierData.consignment_id}`);
      sendStatusEmail({ ...order, tracking_code: courierData.tracking_code, courier_provider: courierData.courier_provider }, 'Processing');
    } catch (err: any) {
      toast.error('Failed to send to courier: ' + err.message);
    } finally {
      setCourierSending(null);
      setCourierModal({ open: false, order: null });
    }
  };

  // Sync courier status
  const syncCourierStatus = async (order: any) => {
    if (!order.consignment_id) { toast.error('No consignment ID'); return; }
    setSyncingStatus(order.id);
    try {
      const courierFunc = order.courier_provider === 'pathao' ? 'pathao-courier' : 'steadfast-courier';
      const actionName = order.courier_provider === 'pathao' ? 'view_order' : 'check_status';
      
      const { data: result, error } = await supabase.functions.invoke(courierFunc, {
        body: { action: actionName, data: { consignment_id: order.consignment_id } },
      });
      if (error) throw error;

      const deliveryStatus = order.courier_provider === 'pathao' 
        ? result.data?.data?.order_status?.toLowerCase() 
        : result.data?.delivery_status;

      if (deliveryStatus) {
        const mappedStatus = COURIER_STATUS_MAP[deliveryStatus] || order.status;

        if (mappedStatus !== order.status) {
          await updateOrder.mutateAsync({ id: order.id, status: mappedStatus });
          setSelectedOrder((prev: any) => prev ? { ...prev, status: mappedStatus } : null);
          toast.success(`Status synced: ${deliveryStatus} → ${mappedStatus}`);
          sendStatusEmail(order, mappedStatus);
        } else {
          toast.info(`Courier status: ${deliveryStatus} (no change)`);
        }
      } else {
        toast.error('Could not fetch courier status');
      }
    } catch (err: any) {
      toast.error('Sync failed: ' + err.message);
    } finally {
      setSyncingStatus(null);
    }
  };

  // Create return request
  const createReturn = async (order: any) => {
    if (!order.consignment_id) { toast.error('No consignment ID for return'); return; }
    if (order.courier_provider === 'pathao') { toast.error('Pathao direct return API not available'); return; }
    
    setReturnLoading(order.id);
    try {
      const { data: result, error } = await supabase.functions.invoke('steadfast-courier', {
        body: { action: 'create_return_request', data: { consignment_id: order.consignment_id, reason: 'Customer requested return' } },
      });
      if (error) throw error;

      if (result.success) {
        toast.success('Return request created successfully!');
      } else {
        toast.error('Return failed: ' + (result.error || result.data?.message || 'Unknown error'));
      }
    } catch (err: any) {
      toast.error('Return failed: ' + err.message);
    } finally {
      setReturnLoading(null);
    }
  };

  const sendStatusEmail = async (order: any, newStatus: string) => {
    const email = (order as any).customer_email;
    if (!email) return;
    try {
      await supabase.functions.invoke('send-order-email', {
        body: {
          type: 'status_update',
          to: email,
          customerName: order.customer_name,
          orderId: order.id,
          status: newStatus,
          trackingCode: order.tracking_code,
          courierProvider: order.courier_provider,
        },
      });
    } catch {
      console.warn('Status email failed to send');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string, order: any) => {
    try {
      // Show courier selection when changing to Processing (if not already sent)
      if (newStatus === 'Processing' && !order.consignment_id) {
        setCourierModal({ open: true, order });
        setSelectedCourier(order.courier_provider || 'steadfast');
      } else {
        await updateOrder.mutateAsync({ id, status: newStatus });
        toast.success(`Order status updated to ${newStatus}`);
        // Send status update email (fire & forget)
        sendStatusEmail(order, newStatus);
      }
    } catch (err: any) { toast.error(err.message); }
  };

  const confirmCourierSend = () => {
    if (courierModal.order) {
      sendToCourier(courierModal.order, selectedCourier);
    }
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
      const { data: dbOrders } = await supabase.from('orders').select('status, total, created_at').eq('customer_phone', phone);
      const localOrders = dbOrders || [];
      const statusCounts: Record<string, number> = {};
      localOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
      const totalOrders = localOrders.length;
      const cancelledCount = statusCounts['Cancelled'] || 0;
      const deliveredCount = statusCounts['Delivered'] || 0;
      const cancelRate = totalOrders > 0 ? Math.round((cancelledCount / totalOrders) * 100) : 0;
      const totalSpent = localOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      let steadfastInfo = null;
      try { const { data: sfResult } = await supabase.functions.invoke('steadfast-courier', { body: { action: 'check_status', data: { consignment_id: phone } } }); if (sfResult?.success) steadfastInfo = sfResult.data; } catch {}
      let pathaoInfo = null;
      try { const { data: ptResult } = await supabase.functions.invoke('pathao-courier', { body: { action: 'view_order', data: { consignment_id: phone } } }); if (ptResult?.success) pathaoInfo = ptResult.data; } catch {}

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (cancelRate > 50 || (totalOrders >= 3 && cancelRate > 40)) riskLevel = 'high';
      else if (cancelRate > 25 || (totalOrders >= 2 && cancelledCount > 0)) riskLevel = 'medium';

      setFraudData({ pieData, totalOrders, cancelledCount, deliveredCount, cancelRate, totalSpent, riskLevel, steadfastInfo, pathaoInfo, customerName: name, customerPhone: phone });
    } catch (err: any) { toast.error('Fraud check failed: ' + err.message); }
    finally { setFraudLoading(false); }
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
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium hidden lg:table-cell">Courier</th>
                  <th className="text-right p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                    <td className="p-3 hidden sm:table-cell">
                      <button onClick={() => { openOrder(order); runFraudCheck(order.customer_phone, order.customer_name); }} className="text-left hover:underline underline-offset-2 decoration-primary/50">
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                      </button>
                    </td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{order.customer_city}</td>
                    <td className="p-3 font-medium">৳{order.total.toLocaleString()}</td>
                    <td className="p-3">
                      <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value, order)} className="text-xs border border-border bg-background px-2 py-1 focus:outline-none">
                        {statusOptions.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {(order as any).tracking_code ? (
                        <span className="text-xs font-mono text-muted-foreground">{(order as any).tracking_code}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right flex items-center justify-end gap-1">
                      {(order as any).consignment_id && (
                        <button onClick={() => syncCourierStatus(order)} disabled={syncingStatus === order.id} className="p-1.5 hover:bg-accent transition-colors" title="Sync courier status">
                          {syncingStatus === order.id ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        </button>
                      )}
                      <button onClick={() => openOrder(order)} className="p-1.5 hover:bg-accent transition-colors"><Eye size={14} /></button>
                      <button
                        onClick={() => {
                          if (confirm('এই অর্ডারটি ট্র্যাশে পাঠাতে চান?')) {
                            updateOrder.mutate({ id: order.id, deleted_at: new Date().toISOString() });
                          }
                        }}
                        className="p-1.5 hover:bg-destructive/10 text-destructive transition-colors"
                        title="Move to Trash"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{filtered.length} order(s)</p>

      {/* Courier Selection Modal */}
      {courierModal.open && courierModal.order && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border max-w-sm w-full p-6 space-y-4 shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Truck size={18} className="text-primary" />
                Select Courier
              </h3>
              <button onClick={() => setCourierModal({ open: false, order: null })} className="p-1.5 hover:bg-accent transition-colors rounded-full">
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Choose a courier provider for Order #{courierModal.order.id.slice(0, 8)}. The order will be created automatically.
              </p>
              
              <div className="space-y-2">
                {courierOptions.map((courier) => (
                  <label key={courier.id} className={`flex items-center justify-between p-3 border cursor-pointer transition-colors ${selectedCourier === courier.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="courier" 
                        value={courier.id}
                        checked={selectedCourier === courier.id}
                        onChange={() => setSelectedCourier(courier.id)}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium">{courier.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setCourierModal({ open: false, order: null })} 
                className="px-4 py-2 text-sm border border-border hover:bg-accent transition-colors"
                disabled={courierSending !== null}
              >
                Cancel
              </button>
              <button 
                onClick={confirmCourierSend} 
                disabled={courierSending !== null} 
                className="luxury-button-primary text-sm py-2 px-4 inline-flex items-center gap-2"
              >
                {courierSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send to Courier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-foreground/50 z-[40] flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
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
                    <button onClick={() => runFraudCheck(selectedOrder.customer_phone, selectedOrder.customer_name)} className="hover:underline underline-offset-2 decoration-primary/50 font-medium">
                      {selectedOrder.customer_name}
                    </button>
                    {!fraudData && !fraudLoading && <span className="text-[10px] text-muted-foreground ml-2">(click for fraud check)</span>}
                  </p>
                  <p><span className="text-muted-foreground">Phone:</span> {selectedOrder.customer_phone}</p>
                  <p><span className="text-muted-foreground">Address:</span> {selectedOrder.customer_address}</p>
                  <p><span className="text-muted-foreground">City:</span> {selectedOrder.customer_city}</p>
                  <p><span className="text-muted-foreground">Delivery:</span> {selectedOrder.delivery_method}</p>
                  <p><span className="text-muted-foreground">Payment:</span> {selectedOrder.payment_method}</p>
                  {selectedOrder.payment_method !== 'cod' && selectedOrder.payment_sender_number && (
                    <p><span className="text-muted-foreground">Sender Number:</span> <span className="font-medium">{selectedOrder.payment_sender_number}</span></p>
                  )}
                  {selectedOrder.payment_method !== 'cod' && selectedOrder.transaction_id && (
                    <p><span className="text-muted-foreground">Transaction ID:</span> <span className="font-mono font-medium">{selectedOrder.transaction_id}</span></p>
                  )}
                  {selectedOrder.customer_note && (
                    <p><span className="text-muted-foreground">Customer Note:</span> <span className="italic">{selectedOrder.customer_note}</span></p>
                  )}
                </>
              )}
              <p><span className="text-muted-foreground">Status:</span> <span className="luxury-badge">{selectedOrder.status}</span></p>
              <p><span className="text-muted-foreground">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>

            {/* Courier Info & Actions */}
            <div className="border border-border p-4 space-y-3">
              <h4 className="text-xs tracking-wider uppercase text-muted-foreground">Courier</h4>
              {selectedOrder.consignment_id ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span className="uppercase text-xs">{selectedOrder.courier_provider || 'Steadfast'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Consignment ID</span><span className="font-mono">{selectedOrder.consignment_id}</span></div>
                  {selectedOrder.tracking_code && <div className="flex justify-between"><span className="text-muted-foreground">Tracking Code</span><span className="font-mono">{selectedOrder.tracking_code}</span></div>}
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => syncCourierStatus(selectedOrder)} disabled={syncingStatus === selectedOrder.id} className="luxury-button-primary text-[10px] py-2 px-3 inline-flex items-center gap-1.5">
                      {syncingStatus === selectedOrder.id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                      Sync Status
                    </button>
                    <button onClick={() => createReturn(selectedOrder)} disabled={returnLoading === selectedOrder.id} className="text-[10px] py-2 px-3 border border-border inline-flex items-center gap-1.5 hover:bg-accent transition-colors">
                      {returnLoading === selectedOrder.id ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                      Return Request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Not sent to courier yet</p>
                  <button onClick={() => { setSelectedOrder(null); setCourierModal({ open: true, order: selectedOrder }); }} disabled={courierSending === selectedOrder.id} className="luxury-button-primary text-[10px] py-2 px-4 inline-flex items-center gap-1.5">
                    {courierSending === selectedOrder.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                    Send to Courier
                  </button>
                </div>
              )}
            </div>

            {/* Fraud Check */}
            {fraudLoading && (
              <div className="border border-border p-6 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">Checking fraud risk...</span>
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
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Total Orders</span><span className="font-medium">{fraudData.totalOrders}</span></div>
                    <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Delivered</span><span className="font-medium">{fraudData.deliveredCount}</span></div>
                    <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Cancelled</span><span className="font-medium">{fraudData.cancelledCount}</span></div>
                    <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Cancel Rate</span><span className={`font-medium ${fraudData.cancelRate > 40 ? 'text-destructive' : ''}`}>{fraudData.cancelRate}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Spent</span><span className="font-medium">৳{fraudData.totalSpent.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground border-t border-border pt-3 space-y-0.5">
                  <p>✓ Local database ({fraudData.totalOrders} orders)</p>
                  <p>{fraudData.steadfastInfo ? '✓' : '○'} Steadfast {fraudData.steadfastInfo ? 'data found' : 'checked'}</p>
                  <p>{fraudData.pathaoInfo ? '✓' : '○'} Pathao {fraudData.pathaoInfo ? 'data found' : 'checked'}</p>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="border-t border-border pt-4">
              <h4 className="text-xs tracking-wider uppercase text-muted-foreground mb-3">Items</h4>
              <div className="space-y-3">
                {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover border border-border flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium flex-shrink-0">৳{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-medium mt-3 pt-3 border-t border-border">
                <span>Total</span>
                <span>৳{selectedOrder.total.toLocaleString()}</span>
              </div>
              <button
                onClick={() => downloadInvoice(selectedOrder)}
                className="mt-4 w-full luxury-button-outline text-[10px] py-2 inline-flex items-center justify-center gap-1.5"
              >
                <Download size={12} />
                Download Invoice
              </button>
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