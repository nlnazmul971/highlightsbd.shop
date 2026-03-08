import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useSupabase';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminReviews from '@/components/admin/AdminReviews';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminAPI from '@/components/admin/AdminAPI';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const Admin = () => {
  const { user, signIn, signUp, signOut } = useAuth();
  const { data: role } = useUserRole(user?.id);
  const [authForm, setAuthForm] = useState({ email: '', password: '', mode: 'login' as 'login' | 'signup' });
  const [activeTab, setActiveTab] = useState('dashboard');

  const isAdmin = role === 'admin';

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header /><CartDrawer />
        <main className="max-w-md mx-auto px-4 pt-40 text-center">
          <h1 className="luxury-heading text-3xl tracking-[0.15em] mb-8">
            {authForm.mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (authForm.mode === 'login') await signIn(authForm.email, authForm.password);
              else { await signUp(authForm.email, authForm.password); toast.success('Check your email to confirm signup'); }
            } catch (err: any) { toast.error(err.message); }
          }} className="space-y-4">
            <input type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="Email" className="luxury-input" required />
            <input type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Password" className="luxury-input" required />
            <button type="submit" className="luxury-button-primary w-full">{authForm.mode === 'login' ? 'Sign In' : 'Sign Up'}</button>
          </form>
          <button onClick={() => setAuthForm({ ...authForm, mode: authForm.mode === 'login' ? 'signup' : 'login' })} className="text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors">
            {authForm.mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
          <Link to="/" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6"><ArrowLeft size={14} /> Back to store</Link>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header /><CartDrawer />
        <main className="max-w-md mx-auto px-4 pt-40 text-center">
          <h1 className="luxury-heading text-3xl tracking-[0.15em] mb-4">My Account</h1>
          <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
          <p className="text-xs text-muted-foreground mb-8">You don't have admin access.</p>
          <button onClick={signOut} className="luxury-button-outline">Sign Out</button>
          <Link to="/" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6"><ArrowLeft size={14} /> Back to store</Link>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onSignOut={signOut} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 gap-3 bg-background sticky top-0 z-30">
            <SidebarTrigger />
            <h1 className="text-sm font-medium tracking-wide capitalize">{activeTab}</h1>
            <div className="ml-auto flex items-center gap-3">
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                ← Back to Store
              </Link>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'products' && <AdminProducts />}
            {activeTab === 'orders' && <AdminOrders />}
            {activeTab === 'reviews' && <AdminReviews />}
            {activeTab === 'users' && <AdminUsers />}
            {activeTab === 'settings' && <AdminSettings />}
            {activeTab === 'api' && <AdminAPI />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
