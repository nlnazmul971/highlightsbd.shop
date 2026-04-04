import { useState, useRef, useMemo } from 'react';
import { useOrders, useUpdateOrder, useProducts } from '@/hooks/useSupabase';
import { supabase } from '@/integrations/supabase/client';
import { callCourier, sendOrderEmail } from '@/lib/api';
import { ShoppingBag, Eye, X, Pencil, Save, Loader2, ShieldAlert, Send, RefreshCw, RotateCcw, Truck, Download, Upload, Trash2, Facebook, CheckSquare, Square, Store, Package, FileText, Phone, MessageSquare, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Returned', 'Cancelled'];
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
  Returned: 'hsl(330, 80%, 55%)',
};

const AdminOrders = () => {
  const { data: orders = [] } = useOrders();
  const { data: products = [] } = useProducts();
  const updateOrder = useUpdateOrder();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const importRef = useRef<HTMLInputElement>(null);

  // Item editing state
  const [editingItems, setEditingItems] = useState(false);
  const [editItems, setEditItems] = useState<any[]>([]);

  // Invoice editor state
  const [invoiceEditing, setInvoiceEditing] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // Courier selection modal state
  const [courierModal, setCourierModal] = useState<{ open: boolean; order: any | null }>({ open: false, order: null });
  const [selectedCourier, setSelectedCourier] = useState<string>('steadfast');

  // Amount editing state
  const [editingAmount, setEditingAmount] = useState(false);
  const [amountData, setAmountData] = useState({ total: 0, discount: 0, delivery_charge: 0, advance_payment: 0 });

  // Processing summary toggle
  const [showProcessingSummary, setShowProcessingSummary] = useState(false);

  const filteredByStatus = filter === 'All' ? orders : orders.filter(o => o.status === filter);
  const filtered = searchQuery.trim()
    ? filteredByStatus.filter(o => {
        const q = searchQuery.toLowerCase();
        return o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q) ||
          o.id.toLowerCase().includes(q) ||
          (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
          (o.tracking_code && o.tracking_code.toLowerCase().includes(q));
      })
    : filteredByStatus;

  // Processing orders size summary
  const processingSummary = useMemo(() => {
    const processingOrders = orders.filter(o => o.status === 'Processing');
    const summary: Record<string, Record<string, number>> = {};
    processingOrders.forEach(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        const name = item.name || 'Unknown';
        const size = item.size || 'N/A';
        const qty = item.quantity || 1;
        if (!summary[name]) summary[name] = {};
        summary[name][size] = (summary[name][size] || 0) + qty;
      });
    });
    return summary;
  }, [orders]);

  const processingOrderCount = orders.filter(o => o.status === 'Processing').length;

  const downloadInvoice = (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const advancePayment = (order as any).advance_payment || 0;
    const invoiceHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice #${order.id.slice(0, 8)}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 40px 30px; color: #1a1a1a; }
  .brand { text-align: center; font-size: 36px; font-weight: 700; letter-spacing: 8px; text-transform: uppercase; margin-bottom: 8px; }
  .brand-sub { text-align: center; font-size: 11px; color: #999; letter-spacing: 3px; margin-bottom: 30px; }
  .divider { border: none; border-top: 1px solid #e0e0e0; margin: 20px 0; }
  h2 { font-size: 18px; font-weight: 300; letter-spacing: 3px; margin-bottom: 20px; text-transform: uppercase; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 13px; color: #666; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 8px; }
  .info p { margin: 3px 0; font-size: 13px; }
  .courier-box { background: #f5f5f5; padding: 14px 18px; margin-bottom: 20px; }
  .courier-box p { margin: 3px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; text-align: left; padding: 8px 0; border-bottom: 1px solid #eee; }
  td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid #f5f5f5; }
  td:last-child, th:last-child { text-align: right; }
  .totals { margin-top: 20px; text-align: right; font-size: 13px; }
  .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; }
  .totals .grand { font-size: 16px; font-weight: 600; border-top: 1px solid #1a1a1a; padding-top: 8px; margin-top: 8px; }
  .totals .advance { color: #16a34a; }
  .totals .due { font-size: 16px; font-weight: 700; color: #dc2626; border-top: 2px solid #dc2626; padding-top: 8px; margin-top: 4px; }
  .note { margin-top: 20px; padding: 12px; background: #f9f9f9; font-size: 12px; color: #666; font-style: italic; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div class="brand">HIGHLIGHTS</div>
<div class="brand-sub">www.highlightsbd.shop</div>
<hr class="divider" />
<h2>Invoice</h2>
<div class="meta"><span>Order #${order.id.slice(0, 8)}</span><span>${new Date(order.created_at).toLocaleDateString()}</span></div>
<div class="section info">
  <div class="section-title">Customer</div>
  <p><strong>${order.customer_name}</strong></p>
  <p>${order.customer_phone}</p>
  ${order.customer_email ? '<p>' + order.customer_email + '</p>' : ''}
  <p>${order.customer_address}, ${order.customer_city}</p>
</div>
${order.courier_provider || order.tracking_code ? `<div class="courier-box">
  <div class="section-title">Courier Information</div>
  ${order.courier_provider ? '<p><strong>Courier:</strong> ' + (order.courier_provider === 'steadfast' ? 'Steadfast Courier' : order.courier_provider === 'pathao' ? 'Pathao Courier' : order.courier_provider) + '</p>' : ''}
  ${order.tracking_code ? '<p><strong>Tracking ID:</strong> ' + order.tracking_code + '</p>' : ''}
  ${order.consignment_id && order.consignment_id !== order.tracking_code ? '<p><strong>Consignment ID:</strong> ' + order.consignment_id + '</p>' : ''}
</div>` : ''}
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
  ${(order.discount || 0) > 0 ? `<div class="row"><span>Subtotal</span><span>৳${items.reduce((s: number, i: any) => s + (i.price || 0) * (i.quantity || 1), 0).toLocaleString()}</span></div>` : ''}
  ${(order.discount || 0) > 0 ? `<div class="row"><span>Discount</span><span>-৳${order.discount.toLocaleString()}</span></div>` : ''}
  ${(order.delivery_charge || 0) > 0 ? `<div class="row"><span>Delivery Charge</span><span>৳${order.delivery_charge.toLocaleString()}</span></div>` : ''}
  <div class="row grand"><span>Total</span><span>৳${order.total.toLocaleString()}</span></div>
  ${advancePayment > 0 ? `<div class="row advance"><span>Advance Paid</span><span>-৳${advancePayment.toLocaleString()}</span></div>` : ''}
  ${advancePayment > 0 ? `<div class="row due"><span>Amount Due</span><span>৳${(order.total - advancePayment).toLocaleString()}</span></div>` : ''}
</div>
</body></html>`;
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) { w.onload = () => { w.print(); URL.revokeObjectURL(url); }; }
  };

  // Bulk invoice download
  const downloadBulkInvoice = () => {
    const toExport = filtered.filter(o => selectedIds.has(o.id));
    if (toExport.length === 0) { toast.error('কোনো অর্ডার সিলেক্ট করুন'); return; }
    
    const allInvoicesHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoices (${toExport.length})</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; color: #1a1a1a; }
  .invoice-page { max-width: 700px; margin: 0 auto; padding: 40px 30px; page-break-after: always; }
  .invoice-page:last-child { page-break-after: auto; }
  .brand { text-align: center; font-size: 30px; font-weight: 700; letter-spacing: 8px; text-transform: uppercase; margin-bottom: 6px; }
  .brand-sub { text-align: center; font-size: 10px; color: #999; letter-spacing: 3px; margin-bottom: 20px; }
  .divider { border: none; border-top: 1px solid #e0e0e0; margin: 15px 0; }
  h2 { font-size: 16px; font-weight: 300; letter-spacing: 3px; margin-bottom: 15px; text-transform: uppercase; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 12px; color: #666; }
  .section-title { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 6px; }
  .info p { margin: 2px 0; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; text-align: left; padding: 6px 0; border-bottom: 1px solid #eee; }
  td { padding: 8px 0; font-size: 12px; border-bottom: 1px solid #f5f5f5; }
  td:last-child, th:last-child { text-align: right; }
  .totals { margin-top: 15px; text-align: right; font-size: 12px; }
  .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 3px 0; }
  .totals .grand { font-size: 14px; font-weight: 600; border-top: 1px solid #1a1a1a; padding-top: 6px; margin-top: 6px; }
  .totals .advance { color: #16a34a; }
  .totals .due { font-size: 14px; font-weight: 700; color: #dc2626; }
  @media print { .invoice-page { padding: 20px; } }
</style></head><body>
${toExport.map(order => {
  const items = Array.isArray(order.items) ? order.items : [];
  const adv = (order as any).advance_payment || 0;
  return `<div class="invoice-page">
<div class="brand">HIGHLIGHTS</div>
<div class="brand-sub">www.highlightsbd.shop</div>
<hr class="divider" />
<h2>Invoice</h2>
<div class="meta"><span>Order #${order.id.slice(0, 8)}</span><span>${new Date(order.created_at).toLocaleDateString()}</span></div>
<div class="info">
  <div class="section-title">Customer</div>
  <p><strong>${order.customer_name}</strong></p>
  <p>${order.customer_phone}</p>
  <p>${order.customer_address}, ${order.customer_city}</p>
</div>
<table><thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead><tbody>
${items.map((i: any) => `<tr><td>${i.name}</td><td>${i.size || '-'}</td><td>${i.quantity}</td><td>৳${((i.price || 0) * (i.quantity || 1)).toLocaleString()}</td></tr>`).join('')}
</tbody></table>
<div class="totals">
  ${(order.discount || 0) > 0 ? `<div class="row"><span>Discount</span><span>-৳${order.discount.toLocaleString()}</span></div>` : ''}
  ${(order.delivery_charge || 0) > 0 ? `<div class="row"><span>Delivery</span><span>৳${order.delivery_charge.toLocaleString()}</span></div>` : ''}
  <div class="row grand"><span>Total</span><span>৳${order.total.toLocaleString()}</span></div>
  ${adv > 0 ? `<div class="row advance"><span>Advance</span><span>-৳${adv.toLocaleString()}</span></div><div class="row due"><span>Due</span><span>৳${(order.total - adv).toLocaleString()}</span></div>` : ''}
</div>
</div>`;
}).join('')}
</body></html>`;
    const blob = new Blob([allInvoicesHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) { w.onload = () => { w.print(); URL.revokeObjectURL(url); }; }
    toast.success(`${toExport.length}টি ইনভয়েস প্রিন্ট হচ্ছে`);
  };

  // Send order to Steadfast courier
  const sendToSteadfast = async (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const itemDesc = items.map((i: any) => `${i.name}${i.size ? ` (${i.size})` : ''} x${i.quantity}`).join(', ');
    const advancePayment = (order as any).advance_payment || 0;
    const codAmount = order.payment_method === 'cod' ? (order.total - advancePayment) : 0;

    const result = await callCourier('steadfast', 'create_order', {
      invoice: order.id.slice(0, 8),
      recipient_name: order.customer_name,
      recipient_phone: order.customer_phone,
      recipient_address: `${order.customer_address}, ${order.customer_city}`,
      cod_amount: codAmount > 0 ? codAmount : 0,
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
    const advancePayment = (order as any).advance_payment || 0;
    const codAmount = order.payment_method === 'cod' ? (order.total - advancePayment) : 0;

    const result = await callCourier('pathao', 'create_order', {
      store_id: 373239,
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
      amount_to_collect: codAmount > 0 ? codAmount : 0,
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

  const syncCourierStatus = async (order: any) => {
    if (!order.consignment_id) { toast.error('No consignment ID'); return; }
    setSyncingStatus(order.id);
    try {
      const provider = order.courier_provider === 'pathao' ? 'pathao' : 'steadfast';
      const actionName = order.courier_provider === 'pathao' ? 'view_order' : 'check_status';
      
      const result = await callCourier(provider as any, actionName, { consignment_id: order.consignment_id });

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

  const createReturn = async (order: any) => {
    if (!order.consignment_id) { toast.error('No consignment ID for return'); return; }
    if (order.courier_provider === 'pathao') { toast.error('Pathao direct return API not available'); return; }
    
    setReturnLoading(order.id);
    try {
      const result = await callCourier('steadfast', 'create_return_request', { consignment_id: order.consignment_id, reason: 'Customer requested return' });

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
      await sendOrderEmail({
        type: 'status_update',
        to: email,
        customerName: order.customer_name,
        orderId: order.id,
        status: newStatus,
        trackingCode: order.tracking_code,
        courierProvider: order.courier_provider,
      });
    } catch {
      console.warn('Status email failed to send');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string, order: any) => {
    try {
      if (newStatus === 'Processing' && !order.consignment_id) {
        setCourierModal({ open: true, order });
        setSelectedCourier(order.courier_provider || 'steadfast');
      } else {
        await updateOrder.mutateAsync({ id, status: newStatus });
        toast.success(`Order status updated to ${newStatus}`);
        sendStatusEmail(order, newStatus);

        if (newStatus === 'Cancelled' || newStatus === 'Returned') {
          const items = Array.isArray(order.items) ? order.items : [];
          for (const item of items) {
            if (item.product_id && item.size) {
              const { data: existing } = await supabase.from('product_size_stock')
                .select('*').eq('product_id', item.product_id).eq('size', item.size).maybeSingle();
              if (existing) {
                const field = newStatus === 'Cancelled' ? 'cancelled_count' : 'returned_count';
                await supabase.from('product_size_stock').update({
                  [field]: (existing as any)[field] + (item.quantity || 1)
                } as any).eq('id', existing.id);
              }
              await supabase.from('stock_logs').insert({
                product_id: item.product_id, size: item.size,
                change_type: newStatus.toLowerCase(), quantity: item.quantity || 1,
                order_id: id, notes: `Order ${newStatus.toLowerCase()}`,
              });
            }
          }
        }
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
    setEditingItems(false);
    setEditingAmount(false);
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

  const startEditItems = () => {
    const items = Array.isArray(selectedOrder.items) ? selectedOrder.items : [];
    setEditItems(items.map((i: any) => ({ ...i })));
    setEditingItems(true);
  };

  const saveItemsEdit = async () => {
    if (!selectedOrder) return;
    try {
      await updateOrder.mutateAsync({ id: selectedOrder.id, items: editItems });
      setSelectedOrder({ ...selectedOrder, items: editItems });
      setEditingItems(false);
      toast.success('Items updated!');
    } catch (err: any) { toast.error(err.message); }
  };

  // Amount editing
  const startEditAmount = () => {
    setAmountData({
      total: selectedOrder.total,
      discount: (selectedOrder as any).discount || 0,
      delivery_charge: (selectedOrder as any).delivery_charge || 0,
      advance_payment: (selectedOrder as any).advance_payment || 0,
    });
    setEditingAmount(true);
  };

  const saveAmountEdit = async () => {
    if (!selectedOrder) return;
    try {
      await updateOrder.mutateAsync({
        id: selectedOrder.id,
        total: amountData.total,
        discount: amountData.discount,
        delivery_charge: amountData.delivery_charge,
        advance_payment: amountData.advance_payment,
      });
      setSelectedOrder({ ...selectedOrder, ...amountData });
      setEditingAmount(false);
      toast.success('Amount updated! Dashboard will reflect changes.');
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
      try { const sfResult = await callCourier('steadfast', 'check_status', { consignment_id: phone }); if (sfResult?.success) steadfastInfo = sfResult.data; } catch {}
      let pathaoInfo = null;
      try { const ptResult = await callCourier('pathao', 'view_order', { consignment_id: phone }); if (ptResult?.success) pathaoInfo = ptResult.data; } catch {}

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (cancelRate > 50 || (totalOrders >= 3 && cancelRate > 40)) riskLevel = 'high';
      else if (cancelRate > 25 || (totalOrders >= 2 && cancelledCount > 0)) riskLevel = 'medium';

      setFraudData({ pieData, totalOrders, cancelledCount, deliveredCount, cancelRate, totalSpent, riskLevel, steadfastInfo, pathaoInfo, customerName: name, customerPhone: phone });
    } catch (err: any) { toast.error('Fraud check failed: ' + err.message); }
    finally { setFraudLoading(false); }
  };

  const openInvoiceEditor = (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    setInvoiceData({
      brandName: 'HIGHLIGHTS',
      brandSub: 'www.highlightsbd.shop',
      orderId: order.id.slice(0, 8),
      date: new Date(order.created_at).toLocaleDateString(),
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email || '',
      customerAddress: `${order.customer_address}, ${order.customer_city}`,
      courierProvider: order.courier_provider ? (order.courier_provider === 'steadfast' ? 'Steadfast Courier' : order.courier_provider === 'pathao' ? 'Pathao Courier' : order.courier_provider) : '',
      trackingCode: order.tracking_code || '',
      consignmentId: order.consignment_id || '',
      paymentMethod: order.payment_method,
      paymentSender: order.payment_sender_number || '',
      transactionId: order.transaction_id || '',
      deliveryMethod: order.delivery_method,
      customerNote: order.customer_note || '',
      items: items.map((i: any) => ({ name: i.name, size: i.size || '', quantity: i.quantity || 1, price: i.price || 0 })),
      discount: (order as any).discount || 0,
      deliveryCharge: (order as any).delivery_charge || 0,
      advancePayment: (order as any).advance_payment || 0,
      total: order.total,
      extraLines: [] as string[],
    });
    setInvoiceEditing(true);
  };

  const printEditedInvoice = () => {
    if (!invoiceData) return;
    const d = invoiceData;
    const subtotal = d.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    const adv = d.advancePayment || 0;
    const invoiceHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice #${d.orderId}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 40px 30px; color: #1a1a1a; }
  .brand { text-align: center; font-size: 36px; font-weight: 700; letter-spacing: 8px; text-transform: uppercase; margin-bottom: 8px; }
  .brand-sub { text-align: center; font-size: 11px; color: #999; letter-spacing: 3px; margin-bottom: 30px; }
  .divider { border: none; border-top: 1px solid #e0e0e0; margin: 20px 0; }
  h2 { font-size: 18px; font-weight: 300; letter-spacing: 3px; margin-bottom: 20px; text-transform: uppercase; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 13px; color: #666; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 8px; }
  .info p { margin: 3px 0; font-size: 13px; }
  .courier-box { background: #f5f5f5; padding: 14px 18px; margin-bottom: 20px; }
  .courier-box p { margin: 3px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; text-align: left; padding: 8px 0; border-bottom: 1px solid #eee; }
  td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid #f5f5f5; }
  td:last-child, th:last-child { text-align: right; }
  .totals { margin-top: 20px; text-align: right; font-size: 13px; }
  .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; }
  .totals .grand { font-size: 16px; font-weight: 600; border-top: 1px solid #1a1a1a; padding-top: 8px; margin-top: 8px; }
  .totals .advance { color: #16a34a; }
  .totals .due { font-size: 16px; font-weight: 700; color: #dc2626; border-top: 2px solid #dc2626; padding-top: 8px; margin-top: 4px; }
  .note { margin-top: 20px; padding: 12px; background: #f9f9f9; font-size: 12px; color: #666; font-style: italic; }
  .extra { margin-top: 15px; font-size: 12px; color: #555; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div class="brand">${d.brandName}</div>
<div class="brand-sub">${d.brandSub}</div>
<hr class="divider" />
<h2>Invoice</h2>
<div class="meta"><span>Order #${d.orderId}</span><span>${d.date}</span></div>
<div class="section info">
  <div class="section-title">Customer</div>
  <p><strong>${d.customerName}</strong></p>
  <p>${d.customerPhone}</p>
  ${d.customerEmail ? '<p>' + d.customerEmail + '</p>' : ''}
  <p>${d.customerAddress}</p>
</div>
${d.courierProvider || d.trackingCode ? `<div class="courier-box">
  <div class="section-title">Courier Information</div>
  ${d.courierProvider ? '<p><strong>Courier:</strong> ' + d.courierProvider + '</p>' : ''}
  ${d.trackingCode ? '<p><strong>Tracking ID:</strong> ' + d.trackingCode + '</p>' : ''}
  ${d.consignmentId && d.consignmentId !== d.trackingCode ? '<p><strong>Consignment ID:</strong> ' + d.consignmentId + '</p>' : ''}
</div>` : ''}
<div class="section info">
  <div class="section-title">Payment & Delivery</div>
  <p>Payment: ${d.paymentMethod}${d.paymentSender ? ' | Sender: ' + d.paymentSender : ''}${d.transactionId ? ' | TxID: ' + d.transactionId : ''}</p>
  <p>Delivery: ${d.deliveryMethod}</p>
</div>
${d.customerNote ? '<div class="note">Note: ' + d.customerNote + '</div>' : ''}
<table><thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead><tbody>
${d.items.map((i: any) => `<tr><td>${i.name}</td><td>${i.size || '-'}</td><td>${i.quantity}</td><td>৳${(i.price * i.quantity).toLocaleString()}</td></tr>`).join('')}
</tbody></table>
<div class="totals">
  ${(d.discount > 0 || d.deliveryCharge > 0) ? `<div class="row"><span>Subtotal</span><span>৳${subtotal.toLocaleString()}</span></div>` : ''}
  ${d.discount > 0 ? `<div class="row"><span>Discount</span><span>-৳${d.discount.toLocaleString()}</span></div>` : ''}
  ${d.deliveryCharge > 0 ? `<div class="row"><span>Delivery Charge</span><span>৳${d.deliveryCharge.toLocaleString()}</span></div>` : ''}
  <div class="row grand"><span>Total</span><span>৳${d.total.toLocaleString()}</span></div>
  ${adv > 0 ? `<div class="row advance"><span>Advance Paid</span><span>-৳${adv.toLocaleString()}</span></div>` : ''}
  ${adv > 0 ? `<div class="row due"><span>Amount Due</span><span>৳${(d.total - adv).toLocaleString()}</span></div>` : ''}
</div>
${d.extraLines.filter((l: string) => l.trim()).map((l: string) => '<div class="extra">' + l + '</div>').join('')}
</body></html>`;
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) { w.onload = () => { w.print(); URL.revokeObjectURL(url); }; }
    setInvoiceEditing(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(o => o.id)));
    }
  };

  const exportOrders = () => {
    const toExport = filtered.filter(o => selectedIds.has(o.id));
    if (toExport.length === 0) { toast.error('কোনো অর্ডার সিলেক্ট করুন'); return; }
    const exportData = toExport.map(o => ({
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      customer_email: (o as any).customer_email || '',
      customer_address: o.customer_address,
      customer_city: o.customer_city,
      items: o.items,
      total: o.total,
      discount: (o as any).discount || 0,
      delivery_charge: (o as any).delivery_charge || 0,
      advance_payment: (o as any).advance_payment || 0,
      delivery_method: o.delivery_method,
      payment_method: o.payment_method,
      payment_sender_number: (o as any).payment_sender_number || '',
      transaction_id: (o as any).transaction_id || '',
      customer_note: (o as any).customer_note || '',
      status: o.status,
      source: (o as any).source || 'website',
      created_at: o.created_at,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${toExport.length}টি অর্ডার এক্সপোর্ট হয়েছে`);
  };

  const importOrders = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      if (!Array.isArray(importData)) { toast.error('Invalid file format'); return; }
      let count = 0;
      for (const order of importData) {
        const { error } = await supabase.from('orders').insert({
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_email: order.customer_email || null,
          customer_address: order.customer_address,
          customer_city: order.customer_city,
          items: order.items,
          total: order.total,
          discount: order.discount || 0,
          delivery_charge: order.delivery_charge || 0,
          advance_payment: order.advance_payment || 0,
          delivery_method: order.delivery_method,
          payment_method: order.payment_method,
          payment_sender_number: order.payment_sender_number || null,
          transaction_id: order.transaction_id || null,
          customer_note: order.customer_note || null,
          status: order.status || 'Pending',
          source: order.source || 'website',
        });
        if (!error) count++;
      }
      toast.success(`${count}/${importData.length}টি অর্ডার ইম্পোর্ট হয়েছে`);
      window.location.reload();
    } catch (err: any) {
      toast.error('ইম্পোর্ট ব্যর্থ: ' + err.message);
    }
    if (importRef.current) importRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Pending Orders Packaging Summary */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowPendingSummary(!showPendingSummary)}
          className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Package size={16} className="text-primary" />
            <span className="text-sm font-medium">📦 Pending Orders - Packaging Summary</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{pendingOrderCount} orders</span>
          </div>
          <span className="text-xs text-muted-foreground">{showPendingSummary ? '▲ Hide' : '▼ Show'}</span>
        </button>
        {showPendingSummary && (
          <div className="border-t border-border p-4">
            {Object.keys(pendingSummary).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">কোনো pending order নেই 🎉</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(pendingSummary).map(([productName, sizes]) => {
                  const totalQty = Object.values(sizes).reduce((s, q) => s + q, 0);
                  return (
                    <div key={productName} className="border border-border rounded-lg p-3 bg-gradient-to-br from-primary/5 to-transparent">
                      <h4 className="text-sm font-semibold truncate mb-2" title={productName}>{productName}</h4>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {Object.entries(sizes).sort(([a], [b]) => {
                          const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
                          return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
                        }).map(([size, qty]) => (
                          <span key={size} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                            {size}: <span className="text-foreground">{qty}</span>
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Total: {totalQty} pcs</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search bar + Export/Import/Invoice */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone, email, order ID, tracking..."
          className="luxury-input flex-1 min-w-[200px] text-sm"
        />
        <input type="file" accept=".json" ref={importRef} onChange={importOrders} className="hidden" />
        <button onClick={() => importRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-border hover:bg-accent transition-colors tracking-wider uppercase">
          <Upload size={13} /> Import
        </button>
        <button onClick={exportOrders} disabled={selectedIds.size === 0} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-primary bg-primary text-primary-foreground hover:bg-primary/90 transition-colors tracking-wider uppercase disabled:opacity-40">
          <Download size={13} /> Export ({selectedIds.size})
        </button>
        <button onClick={downloadBulkInvoice} disabled={selectedIds.size === 0} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-accent-foreground/30 bg-accent hover:bg-accent/80 transition-colors tracking-wider uppercase disabled:opacity-40">
          <FileText size={13} /> Invoice ({selectedIds.size})
        </button>
      </div>

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
                  <th className="p-3 w-8">
                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                      {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare size={15} /> : <Square size={15} />}
                    </button>
                  </th>
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
                  <tr key={order.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${selectedIds.has(order.id) ? 'bg-primary/5' : ''}`}>
                    <td className="p-3">
                      <button onClick={() => toggleSelect(order.id)} className="text-muted-foreground hover:text-foreground">
                        {selectedIds.has(order.id) ? <CheckSquare size={15} className="text-primary" /> : <Square size={15} />}
                      </button>
                    </td>
                    <td className="p-3 font-mono text-xs">
                      <span className="flex items-center gap-1.5">
                        #{order.id.slice(0, 8)}
                        {(order as any).source === 'facebook' && (
                          <span className="inline-flex items-center gap-0.5 bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                            <Facebook size={10} /> FB
                          </span>
                        )}
                        {(order as any).source === 'offline' && (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                            <Store size={10} /> Offline
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <button onClick={() => { openOrder(order); runFraudCheck(order.customer_phone, order.customer_name); }} className="text-left hover:underline underline-offset-2 decoration-primary/50">
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                      </button>
                    </td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{order.customer_city}</td>
                    <td className="p-3 font-medium">
                      ৳{order.total.toLocaleString()}
                      {(order as any).advance_payment > 0 && (
                        <span className="block text-[10px] text-emerald-600">Adv: ৳{(order as any).advance_payment}</span>
                      )}
                    </td>
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
                Choose a courier provider for Order #{courierModal.order.id.slice(0, 8)}.
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
                  {selectedOrder.customer_email && (
                    <p><span className="text-muted-foreground">Email:</span> {selectedOrder.customer_email}</p>
                  )}
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
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <button onClick={() => syncCourierStatus(selectedOrder)} disabled={syncingStatus === selectedOrder.id} className="luxury-button-primary text-[10px] py-2 px-3 inline-flex items-center gap-1.5">
                      {syncingStatus === selectedOrder.id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                      Sync Status
                    </button>
                    <button onClick={() => createReturn(selectedOrder)} disabled={returnLoading === selectedOrder.id} className="text-[10px] py-2 px-3 border border-border inline-flex items-center gap-1.5 hover:bg-accent transition-colors">
                      {returnLoading === selectedOrder.id ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                      Return Request
                    </button>
                    <button
                      onClick={() => { setSelectedOrder(null); setCourierModal({ open: true, order: selectedOrder }); setSelectedCourier(selectedOrder.courier_provider === 'pathao' ? 'steadfast' : 'pathao'); }}
                      disabled={courierSending === selectedOrder.id}
                      className="text-[10px] py-2 px-3 border border-primary/50 text-primary inline-flex items-center gap-1.5 hover:bg-primary/5 transition-colors"
                    >
                      <Send size={11} />
                      Re-send to Other Courier
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
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs tracking-wider uppercase text-muted-foreground">Items</h4>
                {!editingItems ? (
                  <button onClick={startEditItems} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                    <Pencil size={10} /> Edit Items/Size
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditingItems(false)} className="text-[10px] text-muted-foreground hover:underline">Cancel</button>
                    <button onClick={saveItemsEdit} disabled={updateOrder.isPending} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                      {updateOrder.isPending ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />} Save
                    </button>
                  </div>
                )}
              </div>
              {editingItems ? (
                <div className="space-y-2">
                  {editItems.map((item: any, i: number) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input value={item.name} onChange={e => { const items = [...editItems]; items[i] = { ...items[i], name: e.target.value }; setEditItems(items); }} className="luxury-input flex-1 text-sm" placeholder="Name" />
                      <input value={item.size || ''} onChange={e => { const items = [...editItems]; items[i] = { ...items[i], size: e.target.value }; setEditItems(items); }} className="luxury-input w-20 text-sm" placeholder="Size" />
                      <input value={item.color || ''} onChange={e => { const items = [...editItems]; items[i] = { ...items[i], color: e.target.value }; setEditItems(items); }} className="luxury-input w-20 text-sm" placeholder="Color" />
                      <input type="number" value={item.quantity} onChange={e => { const items = [...editItems]; items[i] = { ...items[i], quantity: parseInt(e.target.value) || 1 }; setEditItems(items); }} className="luxury-input w-16 text-sm" placeholder="Qty" />
                      <input type="number" value={item.price} onChange={e => { const items = [...editItems]; items[i] = { ...items[i], price: parseInt(e.target.value) || 0 }; setEditItems(items); }} className="luxury-input w-20 text-sm" placeholder="Price" />
                      <button onClick={() => setEditItems(editItems.filter((_, idx) => idx !== i))} className="p-1 text-destructive hover:bg-destructive/10"><X size={12} /></button>
                    </div>
                  ))}
                  <button onClick={() => setEditItems([...editItems, { name: '', size: '', color: '', quantity: 1, price: 0 }])} className="text-xs text-primary hover:underline">+ Add Item</button>
                </div>
              ) : (
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
              )}

              {/* Amount Section */}
              <div className="mt-3 pt-3 border-t border-border space-y-1 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs tracking-wider uppercase text-muted-foreground">Amount</span>
                  {!editingAmount ? (
                    <button onClick={startEditAmount} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                      <Pencil size={10} /> Edit Amount
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditingAmount(false)} className="text-[10px] text-muted-foreground hover:underline">Cancel</button>
                      <button onClick={saveAmountEdit} disabled={updateOrder.isPending} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                        {updateOrder.isPending ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />} Save
                      </button>
                    </div>
                  )}
                </div>

                {editingAmount ? (
                  <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Discount (৳)</label>
                        <input type="number" value={amountData.discount} onChange={e => setAmountData(p => ({ ...p, discount: parseInt(e.target.value) || 0 }))} className="luxury-input w-full text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Delivery Charge (৳)</label>
                        <input type="number" value={amountData.delivery_charge} onChange={e => setAmountData(p => ({ ...p, delivery_charge: parseInt(e.target.value) || 0 }))} className="luxury-input w-full text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Advance Payment (৳)</label>
                        <input type="number" value={amountData.advance_payment} onChange={e => setAmountData(p => ({ ...p, advance_payment: parseInt(e.target.value) || 0 }))} className="luxury-input w-full text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Total (৳)</label>
                        <input type="number" value={amountData.total} onChange={e => setAmountData(p => ({ ...p, total: parseInt(e.target.value) || 0 }))} className="luxury-input w-full text-sm" />
                      </div>
                    </div>
                    {amountData.advance_payment > 0 && (
                      <p className="text-xs text-emerald-600 font-medium">Due Amount: ৳{(amountData.total - amountData.advance_payment).toLocaleString()}</p>
                    )}
                  </div>
                ) : (
                  <>
                    {((selectedOrder as any).discount || 0) > 0 && (
                      <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>-৳{(selectedOrder as any).discount.toLocaleString()}</span></div>
                    )}
                    {((selectedOrder as any).delivery_charge || 0) > 0 && (
                      <div className="flex justify-between text-muted-foreground"><span>Delivery Charge</span><span>৳{(selectedOrder as any).delivery_charge.toLocaleString()}</span></div>
                    )}
                    {((selectedOrder as any).courier_fee || 0) > 0 && (
                      <div className="flex justify-between text-muted-foreground"><span>Courier Fee</span><span>৳{(selectedOrder as any).courier_fee.toLocaleString()}</span></div>
                    )}
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>৳{selectedOrder.total.toLocaleString()}</span>
                    </div>
                    {((selectedOrder as any).advance_payment || 0) > 0 && (
                      <>
                        <div className="flex justify-between text-emerald-600"><span>Advance Paid</span><span>-৳{(selectedOrder as any).advance_payment.toLocaleString()}</span></div>
                        <div className="flex justify-between font-bold text-destructive"><span>Amount Due</span><span>৳{(selectedOrder.total - (selectedOrder as any).advance_payment).toLocaleString()}</span></div>
                      </>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => openInvoiceEditor(selectedOrder)}
                className="mt-4 w-full luxury-button-outline text-[10px] py-2 inline-flex items-center justify-center gap-1.5"
              >
                <Download size={12} />
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Editor Modal */}
      {invoiceEditing && invoiceData && (
        <div className="fixed inset-0 bg-foreground/50 z-[60] flex items-center justify-center p-4" onClick={() => setInvoiceEditing(false)}>
          <div className="bg-background border border-border max-w-2xl w-full max-h-[90vh] overflow-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Edit Invoice</h3>
              <button onClick={() => setInvoiceEditing(false)} className="p-1.5 hover:bg-accent"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <EditField label="Brand Name" value={invoiceData.brandName} onChange={v => setInvoiceData((p: any) => ({ ...p, brandName: v }))} />
              <EditField label="Brand Subtitle" value={invoiceData.brandSub} onChange={v => setInvoiceData((p: any) => ({ ...p, brandSub: v }))} />
              <EditField label="Customer Name" value={invoiceData.customerName} onChange={v => setInvoiceData((p: any) => ({ ...p, customerName: v }))} />
              <EditField label="Phone" value={invoiceData.customerPhone} onChange={v => setInvoiceData((p: any) => ({ ...p, customerPhone: v }))} />
              <EditField label="Email" value={invoiceData.customerEmail} onChange={v => setInvoiceData((p: any) => ({ ...p, customerEmail: v }))} />
              <EditField label="Address" value={invoiceData.customerAddress} onChange={v => setInvoiceData((p: any) => ({ ...p, customerAddress: v }))} />
              <EditField label="Courier Provider" value={invoiceData.courierProvider} onChange={v => setInvoiceData((p: any) => ({ ...p, courierProvider: v }))} />
              <EditField label="Tracking Code" value={invoiceData.trackingCode} onChange={v => setInvoiceData((p: any) => ({ ...p, trackingCode: v }))} />
              <EditField label="Consignment ID" value={invoiceData.consignmentId} onChange={v => setInvoiceData((p: any) => ({ ...p, consignmentId: v }))} />
              <EditField label="Payment Method" value={invoiceData.paymentMethod} onChange={v => setInvoiceData((p: any) => ({ ...p, paymentMethod: v }))} />
              <EditField label="Sender Number" value={invoiceData.paymentSender} onChange={v => setInvoiceData((p: any) => ({ ...p, paymentSender: v }))} />
              <EditField label="Transaction ID" value={invoiceData.transactionId} onChange={v => setInvoiceData((p: any) => ({ ...p, transactionId: v }))} />
              <EditField label="Delivery Method" value={invoiceData.deliveryMethod} onChange={v => setInvoiceData((p: any) => ({ ...p, deliveryMethod: v }))} />
              <EditField label="Date" value={invoiceData.date} onChange={v => setInvoiceData((p: any) => ({ ...p, date: v }))} />
            </div>

            <EditField label="Customer Note" value={invoiceData.customerNote} onChange={v => setInvoiceData((p: any) => ({ ...p, customerNote: v }))} textarea />

            {/* Editable Items */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground tracking-wider uppercase">Items</label>
              {invoiceData.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input value={item.name} onChange={e => { const items = [...invoiceData.items]; items[idx] = { ...items[idx], name: e.target.value }; setInvoiceData((p: any) => ({ ...p, items })); }} className="luxury-input flex-1 text-sm" placeholder="Name" />
                  <input value={item.size} onChange={e => { const items = [...invoiceData.items]; items[idx] = { ...items[idx], size: e.target.value }; setInvoiceData((p: any) => ({ ...p, items })); }} className="luxury-input w-16 text-sm" placeholder="Size" />
                  <input type="number" value={item.quantity} onChange={e => { const items = [...invoiceData.items]; items[idx] = { ...items[idx], quantity: parseInt(e.target.value) || 1 }; setInvoiceData((p: any) => ({ ...p, items })); }} className="luxury-input w-16 text-sm" placeholder="Qty" />
                  <input type="number" value={item.price} onChange={e => { const items = [...invoiceData.items]; items[idx] = { ...items[idx], price: parseInt(e.target.value) || 0 }; setInvoiceData((p: any) => ({ ...p, items })); }} className="luxury-input w-20 text-sm" placeholder="Price" />
                  <button onClick={() => { const items = invoiceData.items.filter((_: any, i: number) => i !== idx); setInvoiceData((p: any) => ({ ...p, items })); }} className="p-1.5 text-destructive hover:bg-destructive/10 transition-colors"><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => setInvoiceData((p: any) => ({ ...p, items: [...p.items, { name: '', size: '', quantity: 1, price: 0 }] }))} className="text-xs text-primary hover:underline">+ Add Item</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <EditField label="Discount (৳)" value={String(invoiceData.discount)} onChange={v => setInvoiceData((p: any) => ({ ...p, discount: parseInt(v) || 0 }))} />
              <EditField label="Delivery (৳)" value={String(invoiceData.deliveryCharge)} onChange={v => setInvoiceData((p: any) => ({ ...p, deliveryCharge: parseInt(v) || 0 }))} />
              <EditField label="Advance (৳)" value={String(invoiceData.advancePayment || 0)} onChange={v => setInvoiceData((p: any) => ({ ...p, advancePayment: parseInt(v) || 0 }))} />
              <EditField label="Total (৳)" value={String(invoiceData.total)} onChange={v => setInvoiceData((p: any) => ({ ...p, total: parseInt(v) || 0 }))} />
            </div>

            {/* Extra Lines */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground tracking-wider uppercase">Extra Lines (custom text)</label>
              {invoiceData.extraLines.map((line: string, idx: number) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input value={line} onChange={e => { const lines = [...invoiceData.extraLines]; lines[idx] = e.target.value; setInvoiceData((p: any) => ({ ...p, extraLines: lines })); }} className="luxury-input flex-1 text-sm" placeholder="Custom text..." />
                  <button onClick={() => { const lines = invoiceData.extraLines.filter((_: string, i: number) => i !== idx); setInvoiceData((p: any) => ({ ...p, extraLines: lines })); }} className="p-1.5 text-destructive hover:bg-destructive/10 transition-colors"><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => setInvoiceData((p: any) => ({ ...p, extraLines: [...p.extraLines, ''] }))} className="text-xs text-primary hover:underline">+ Add Line</button>
            </div>

            <button onClick={printEditedInvoice} className="w-full luxury-button-primary text-sm py-2.5 inline-flex items-center justify-center gap-2">
              <Download size={14} />
              Print Invoice
            </button>
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
