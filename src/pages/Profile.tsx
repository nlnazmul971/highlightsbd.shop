import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, Lock, User } from 'lucide-react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useSupabase';
import OrderTracker from '@/components/OrderTracker';
import { toast } from 'sonner';

type Tab = 'orders' | 'address' | 'password';

const Profile = () => {
  const { user, signOut, changePassword } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.uid);
  const updateProfile = useUpdateProfile();
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header /><CartDrawer />
        <main className="max-w-md mx-auto px-4 pt-40 text-center">
          <h1 className="luxury-heading text-2xl tracking-[0.15em] mb-4">My Account</h1>
          <p className="text-sm text-muted-foreground mb-6">Please sign in to view your profile.</p>
          <Link to="/admin" className="luxury-button-primary inline-block px-8">Sign In</Link>
        </main>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'orders', label: 'My Orders', icon: <Package size={16} /> },
    { id: 'address', label: 'Address', icon: <MapPin size={16} /> },
    { id: 'password', label: 'Change Password', icon: <Lock size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <main className="max-w-2xl mx-auto px-4 pt-36 sm:pt-40 pb-20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <User size={24} className="text-muted-foreground" />
          </div>
          <h1 className="luxury-heading text-xl tracking-[0.15em]">{profile?.display_name || user.email}</h1>
          <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
          <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground mt-3 underline transition-colors">Sign Out</button>
        </div>
        <div className="flex border-b border-border mb-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs tracking-wider transition-colors ${activeTab === tab.id ? 'border-b-2 border-foreground text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
        {activeTab === 'orders' && <OrderTracker userId={user.uid} />}
        {activeTab === 'address' && <AddressSection profile={profile} userId={user.uid} updateProfile={updateProfile} isLoading={isLoading} />}
        {activeTab === 'password' && <PasswordSection changePassword={changePassword} />}
        <Link to="/" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-8 transition-colors"><ArrowLeft size={14} /> Back to store</Link>
      </main>
    </div>
  );
};

const AddressSection = ({ profile, userId, updateProfile, isLoading }: { profile: any; userId: string; updateProfile: any; isLoading: boolean }) => {
  const [form, setForm] = useState({ display_name: profile?.display_name || '', phone: profile?.phone || '', address: profile?.address || '', city: profile?.city || '' });
  useState(() => { if (profile) setForm({ display_name: profile.display_name || '', phone: profile.phone || '', address: profile.address || '', city: profile.city || '' }); });
  if (isLoading) return <p className="text-center text-sm text-muted-foreground">Loading...</p>;
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await updateProfile.mutateAsync({ userId, ...form }); toast.success('Address updated successfully!'); } catch (err: any) { toast.error(err.message || 'Failed to update address'); }
  };
  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div><label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">Full Name</label><input value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} placeholder="Your name" className="luxury-input" /></div>
      <div><label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">Phone Number</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" className="luxury-input" /></div>
      <div><label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street address" className="luxury-input" /></div>
      <div><label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" className="luxury-input" /></div>
      <button type="submit" disabled={updateProfile.isPending} className="luxury-button-primary w-full">{updateProfile.isPending ? 'Saving...' : 'Save Address'}</button>
    </form>
  );
};

const PasswordSection = ({ changePassword }: { changePassword: (p: string) => Promise<void> }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try { await changePassword(newPassword); toast.success('Password updated successfully!'); setNewPassword(''); setConfirmPassword(''); } catch (err: any) { toast.error(err.message || 'Failed to update password'); } finally { setLoading(false); }
  };
  return (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <div><label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" className="luxury-input" required minLength={6} /></div>
      <div><label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">Confirm Password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="luxury-input" required minLength={6} /></div>
      <button type="submit" disabled={loading} className="luxury-button-primary w-full">{loading ? 'Updating...' : 'Update Password'}</button>
    </form>
  );
};

export default Profile;
