import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

const AdminUsers = () => {
  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['all-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data;
    },
  });

  const getRoleForUser = (userId: string) => {
    const r = roles.find((r: any) => r.user_id === userId);
    return r ? r.role : 'user';
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">{profiles.length} registered user(s)</p>

      {profiles.length === 0 ? (
        <div className="text-center py-20">
          <Users size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No users yet</p>
        </div>
      ) : (
        <div className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Name</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium hidden sm:table-cell">Phone</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium hidden md:table-cell">City</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium">Role</th>
                  <th className="text-left p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium hidden lg:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p: any) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium">{p.display_name || '—'}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{p.phone || '—'}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{p.city || '—'}</td>
                    <td className="p-3"><span className="luxury-badge text-[8px]">{getRoleForUser(p.user_id)}</span></td>
                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
