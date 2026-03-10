import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, deleteDoc, orderBy, query } from 'firebase/firestore';
import { Loader2, Trash2, Mail, Download } from 'lucide-react';
import { toast } from 'sonner';

const AdminNewsletter = () => {
  const queryClient = useQueryClient();

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['admin-newsletter'],
    queryFn: async () => {
      const q = query(collection(db, 'newsletter_subscribers'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'newsletter_subscribers', id));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-newsletter'] }); toast.success('Subscriber removed'); },
    onError: (err: any) => toast.error(err.message),
  });

  const handleExport = () => {
    if (!subscribers?.length) return;
    const csv = 'Email,Subscribed At\n' + subscribers.map(s => `${s.email},${new Date(s.created_at).toLocaleDateString()}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'newsletter-subscribers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Newsletter Subscribers</h2>
          <p className="text-xs text-muted-foreground mt-1">মোট {subscribers?.length || 0} জন subscribe করেছে</p>
        </div>
        {(subscribers?.length || 0) > 0 && (
          <button onClick={handleExport} className="luxury-button-outline inline-flex items-center gap-2 text-[10px]"><Download size={14} /> Export CSV</button>
        )}
      </div>
      {!subscribers?.length ? (
        <div className="text-center py-12"><Mail size={32} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-sm text-muted-foreground">No subscribers yet</p></div>
      ) : (
        <div className="border border-border">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 p-3 border-b border-border bg-secondary/30 text-xs text-muted-foreground tracking-wider uppercase"><span>Email</span><span>Date</span><span></span></div>
          {subscribers.map(sub => (
            <div key={sub.id} className="grid grid-cols-[1fr_auto_auto] gap-3 p-3 border-b border-border last:border-0 items-center">
              <span className="text-sm truncate">{sub.email}</span>
              <span className="text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleDateString()}</span>
              <button onClick={() => deleteMutation.mutate(sub.id)} disabled={deleteMutation.isPending} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;
