import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, deleteDoc, updateDoc, addDoc, setDoc, orderBy, query, where } from 'firebase/firestore';
import { Trash2, RotateCcw, AlertTriangle, ShoppingBag, Users } from 'lucide-react';
import { toast } from 'sonner';

const AdminTrash = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'orders' | 'users'>('orders');

  const { data: deletedOrders = [] } = useQuery({
    queryKey: ['trash-orders'],
    queryFn: async () => {
      const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(o => o.deleted_at);
    },
  });

  const { data: deletedUsers = [] } = useQuery({
    queryKey: ['trash-users'],
    queryFn: async () => {
      const q = query(collection(db, 'trash_users'), orderBy('deleted_at', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    },
  });

  const restoreOrder = useMutation({
    mutationFn: async (id: string) => {
      await updateDoc(doc(db, 'orders', id), { deleted_at: null });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trash-orders'] }); queryClient.invalidateQueries({ queryKey: ['orders'] }); toast.success('Order restored'); },
    onError: (e: any) => toast.error(e.message),
  });

  const permanentDeleteOrder = useMutation({
    mutationFn: async (id: string) => { await deleteDoc(doc(db, 'orders', id)); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trash-orders'] }); toast.success('Order permanently deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const restoreUser = useMutation({
    mutationFn: async (trashUser: any) => {
      await setDoc(doc(db, 'profiles', trashUser.original_user_id), {
        user_id: trashUser.original_user_id,
        display_name: trashUser.display_name,
        phone: trashUser.phone,
        city: trashUser.city,
        address: trashUser.address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (trashUser.role && trashUser.role !== 'user') {
        await setDoc(doc(db, 'user_roles', trashUser.original_user_id), { user_id: trashUser.original_user_id, role: trashUser.role });
      }
      await deleteDoc(doc(db, 'trash_users', trashUser.id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['all-roles'] });
      toast.success('User restored');
    },
    onError: (e: any) => toast.error('Restore failed: ' + e.message),
  });

  const permanentDeleteUser = useMutation({
    mutationFn: async (id: string) => { await deleteDoc(doc(db, 'trash_users', id)); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trash-users'] }); toast.success('User permanently deleted from trash'); },
    onError: (e: any) => toast.error(e.message),
  });

  const totalTrash = deletedOrders.length + deletedUsers.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="border border-border p-4 bg-card"><div className="flex items-center gap-2 mb-2"><Trash2 size={16} className="text-destructive" /><span className="text-xs text-muted-foreground uppercase tracking-wider">Total in Trash</span></div><p className="text-2xl font-bold">{totalTrash}</p></div>
        <div className="border border-border p-4 bg-card"><div className="flex items-center gap-2 mb-2"><ShoppingBag size={16} className="text-primary" /><span className="text-xs text-muted-foreground uppercase tracking-wider">Deleted Orders</span></div><p className="text-2xl font-bold">{deletedOrders.length}</p></div>
        <div className="border border-border p-4 bg-card"><div className="flex items-center gap-2 mb-2"><Users size={16} className="text-primary" /><span className="text-xs text-muted-foreground uppercase tracking-wider">Deleted Users</span></div><p className="text-2xl font-bold">{deletedUsers.length}</p></div>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button onClick={() => setTab('orders')} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'orders' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Orders ({deletedOrders.length})</button>
        <button onClick={() => setTab('users')} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'users' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Users ({deletedUsers.length})</button>
      </div>

      {tab === 'orders' && (
        deletedOrders.length === 0 ? (
          <div className="text-center py-20"><Trash2 size={48} className="mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">No deleted orders</p></div>
        ) : (
          <div className="border border-border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30"><th className="text-left p-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Customer</th><th className="text-left p-3 text-xs text-muted-foreground uppercase tracking-wider font-medium hidden sm:table-cell">Total</th><th className="text-left p-3 text-xs text-muted-foreground uppercase tracking-wider font-medium hidden md:table-cell">Deleted</th><th className="text-right p-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Actions</th></tr></thead><tbody>
            {deletedOrders.map((order: any) => (
              <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="p-3"><p className="font-medium">{order.customer_name}</p><p className="text-xs text-muted-foreground">{order.customer_phone}</p></td>
                <td className="p-3 text-muted-foreground hidden sm:table-cell">৳{order.total}</td>
                <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">{new Date(order.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td className="p-3 text-right"><div className="flex items-center justify-end gap-2">
                  <button onClick={() => restoreOrder.mutate(order.id)} className="p-1.5 hover:bg-primary/10 text-primary transition-colors" title="Restore"><RotateCcw size={14} /></button>
                  <button onClick={() => { if (confirm('Permanently delete?')) permanentDeleteOrder.mutate(order.id); }} className="p-1.5 hover:bg-destructive/10 text-destructive transition-colors" title="Delete"><Trash2 size={14} /></button>
                </div></td>
              </tr>
            ))}
          </tbody></table></div></div>
        )
      )}

      {tab === 'users' && (
        deletedUsers.length === 0 ? (
          <div className="text-center py-20"><Trash2 size={48} className="mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">No deleted users</p></div>
        ) : (
          <div className="border border-border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30"><th className="text-left p-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Name</th><th className="text-left p-3 text-xs text-muted-foreground uppercase tracking-wider font-medium hidden sm:table-cell">Email</th><th className="text-left p-3 text-xs text-muted-foreground uppercase tracking-wider font-medium hidden md:table-cell">Deleted</th><th className="text-right p-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Actions</th></tr></thead><tbody>
            {deletedUsers.map((u: any) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="p-3"><p className="font-medium">{u.display_name || '—'}</p><p className="text-xs text-muted-foreground">{u.role}</p></td>
                <td className="p-3 text-muted-foreground hidden sm:table-cell">{u.email || '—'}</td>
                <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">{new Date(u.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td className="p-3 text-right"><div className="flex items-center justify-end gap-2">
                  <button onClick={() => restoreUser.mutate(u)} className="p-1.5 hover:bg-primary/10 text-primary transition-colors" title="Restore"><RotateCcw size={14} /></button>
                  <button onClick={() => { if (confirm('Permanently delete?')) permanentDeleteUser.mutate(u.id); }} className="p-1.5 hover:bg-destructive/10 text-destructive transition-colors" title="Delete"><Trash2 size={14} /></button>
                </div></td>
              </tr>
            ))}
          </tbody></table></div></div>
        )
      )}

      <div className="flex items-start gap-2 p-3 border border-border bg-muted/20 text-xs text-muted-foreground">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <span>ট্র্যাশ থেকে রিস্টোর করলে আইটেম আগের জায়গায় ফিরে যাবে। পারমানেন্ট ডিলিট করলে আর ফেরানো যাবে না।</span>
      </div>
    </div>
  );
};

export default AdminTrash;
