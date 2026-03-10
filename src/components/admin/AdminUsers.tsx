import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, Shield, TrendingUp, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type AppRole = 'admin' | 'moderator' | 'user';

const AdminUsers = () => {
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['all-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const getRoleForUser = (userId: string) => {
    const r = roles.find((r: any) => r.user_id === userId);
    return r ? r.role : 'user';
  };

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      if (newRole === 'user') {
        await supabase.from('user_roles').delete().eq('user_id', userId);
      } else {
        const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', userId).maybeSingle();
        if (existing) {
          await supabase.from('user_roles').update({ role: newRole } as any).eq('user_id', userId);
        } else {
          await supabase.from('user_roles').insert({ user_id: userId, role: newRole } as any);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-roles'] });
      toast.success('Role updated successfully');
    },
    onError: (err: any) => toast.error('Failed to update role: ' + err.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (profile: any) => {
      const currentRole = getRoleForUser(profile.user_id);
      await supabase.from('trash_users').insert({
        original_user_id: profile.user_id,
        display_name: profile.display_name,
        phone: profile.phone,
        city: profile.city,
        address: profile.address,
        role: currentRole,
      });
      await supabase.from('user_roles').delete().eq('user_id', profile.user_id);
      await supabase.from('profiles').delete().eq('user_id', profile.user_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['trash-users'] });
      toast.success('User moved to trash');
    },
    onError: (e: any) => toast.error('Delete failed: ' + e.message),
  });

  const adminCount = profiles.filter((p: any) => getRoleForUser(p.user_id) === 'admin').length;
  const userCount = profiles.length - adminCount;

  const chartData = React.useMemo(() => {
    if (profiles.length === 0) return [];
    const grouped: Record<string, number> = {};
    profiles.forEach((p: any) => {
      const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + 1;
    });
    const sortedProfiles = [...profiles].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const cumulativeMap: Record<string, number> = {};
    let cumulative = 0;
    sortedProfiles.forEach((p: any) => {
      const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      cumulative++;
      cumulativeMap[date] = cumulative;
    });
    return Object.entries(cumulativeMap).map(([date, total]) => ({ date, total, new: grouped[date] || 0 }));
  }, [profiles]);

  if (profilesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-border p-4 bg-card">
          <div className="flex items-center gap-2 mb-2"><Users size={16} className="text-primary" /><span className="text-xs text-muted-foreground uppercase tracking-wider">Total Users</span></div>
          <p className="text-2xl font-bold">{profiles.length}</p>
        </div>
        <div className="border border-border p-4 bg-card">
          <div className="flex items-center gap-2 mb-2"><UserCheck size={16} className="text-primary" /><span className="text-xs text-muted-foreground uppercase tracking-wider">Customers</span></div>
          <p className="text-2xl font-bold">{userCount}</p>
        </div>
        <div className="border border-border p-4 bg-card">
          <div className="flex items-center gap-2 mb-2"><Shield size={16} className="text-primary" /><span className="text-xs text-muted-foreground uppercase tracking-wider">Admins</span></div>
          <p className="text-2xl font-bold">{adminCount}</p>
        </div>
        <div className="border border-border p-4 bg-card">
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-primary" /><span className="text-xs text-muted-foreground uppercase tracking-wider">This Month</span></div>
          <p className="text-2xl font-bold">{profiles.filter((p: any) => { const now = new Date(); const created = new Date(p.created_at); return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear(); }).length}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="border border-border p-4 bg-card">
          <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">User Growth</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs><linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#userGradient)" name="Total Users" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="text-center py-20"><Users size={48} className="mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">No users yet</p></div>
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
                  <th className="text-right p-3 text-xs text-muted-foreground tracking-wider uppercase font-medium w-12"></th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p: any) => {
                  const currentRole = getRoleForUser(p.user_id);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium">{p.display_name || '—'}</td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">{p.phone || '—'}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{p.city || '—'}</td>
                      <td className="p-3">
                        <Select value={currentRole} onValueChange={(value) => changeRoleMutation.mutate({ userId: p.user_id, newRole: value as AppRole })}>
                          <SelectTrigger className="h-7 w-[120px] text-xs border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">{new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => { if (confirm(`"${p.display_name || 'this user'}" কে ট্র্যাশে পাঠাতে চান?`)) deleteUserMutation.mutate(p); }} className="p-1.5 hover:bg-destructive/10 text-destructive transition-colors" title="Move to Trash"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
