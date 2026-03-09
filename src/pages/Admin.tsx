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
import AdminHomepage from '@/components/admin/AdminHomepage';
import AdminWishlist from '@/components/admin/AdminWishlist';
import AdminNewsletter from '@/components/admin/AdminNewsletter';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import OrderTracker from '@/components/OrderTracker';

const Admin = () => {
  const { user, signIn, signUp, signOut, signInWithPhone, verifyOtp } = useAuth();
  const { data: role } = useUserRole(user?.id);
  const [authForm, setAuthForm] = useState({ email: '', password: '', displayName: '', phone: '', mode: 'login' as 'login' | 'signup' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [phoneOtpStep, setPhoneOtpStep] = useState<'idle' | 'sent'>('idle');
  const [otpCode, setOtpCode] = useState('');

  const isAdmin = role === 'admin';

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header /><CartDrawer />
        <main className="max-w-md mx-auto px-4 pt-40 text-center">
          <h1 className="luxury-heading text-3xl tracking-[0.15em] mb-8">
            {authForm.mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          {authForm.mode === 'login' ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await signIn(authForm.email, authForm.password);
              } catch (err: any) { toast.error(err.message); }
            }} className="space-y-4">
              <input type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="Email" className="luxury-input" required />
              <input type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Password" className="luxury-input" required />
              <button type="submit" className="luxury-button-primary w-full">Sign In</button>
            </form>
          ) : (
            <>
              {phoneOtpStep === 'idle' ? (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!authForm.displayName.trim()) { toast.error('Please enter your name'); return; }
                  if (!authForm.phone.trim()) { toast.error('Please enter phone number'); return; }
                  if (!authForm.email.trim()) { toast.error('Please enter email'); return; }
                  if (!authForm.password || authForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
                  try {
                    await signUp(authForm.email, authForm.password, authForm.displayName, authForm.phone);
                    // Now send OTP to verify phone
                    await signInWithPhone(authForm.phone);
                    setPhoneOtpStep('sent');
                    toast.success('OTP sent to your phone number');
                  } catch (err: any) { toast.error(err.message); }
                }} className="space-y-4">
                  <input value={authForm.displayName} onChange={e => setAuthForm({ ...authForm, displayName: e.target.value })} placeholder="Full Name" className="luxury-input" required />
                  <input type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="Email" className="luxury-input" required />
                  <input type="tel" value={authForm.phone} onChange={e => setAuthForm({ ...authForm, phone: e.target.value })} placeholder="Phone Number (e.g. +8801XXXXXXXXX)" className="luxury-input" required />
                  <input type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Password (min 6 characters)" className="luxury-input" required />
                  <button type="submit" className="luxury-button-primary w-full">Sign Up & Verify Phone</button>
                </form>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await verifyOtp(authForm.phone, otpCode);
                    toast.success('Phone verified! Account created successfully.');
                    setPhoneOtpStep('idle');
                    setOtpCode('');
                  } catch (err: any) { toast.error(err.message); }
                }} className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    An OTP code has been sent to <strong>{authForm.phone}</strong>
                  </p>
                  <input
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="Enter OTP Code"
                    className="luxury-input text-center text-lg tracking-[0.3em]"
                    maxLength={6}
                    required
                  />
                  <button type="submit" className="luxury-button-primary w-full">Verify OTP</button>
                  <button type="button" onClick={async () => {
                    try {
                      await signInWithPhone(authForm.phone);
                      toast.success('OTP resent');
                    } catch (err: any) { toast.error(err.message); }
                  }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Resend OTP
                  </button>
                </form>
              )}
            </>
          )}
          <button onClick={() => { setAuthForm({ ...authForm, mode: authForm.mode === 'login' ? 'signup' : 'login' }); setPhoneOtpStep('idle'); }} className="text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors">
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
        <main className="max-w-lg mx-auto px-4 pt-40">
          <div className="text-center mb-8">
            <h1 className="luxury-heading text-3xl tracking-[0.15em] mb-4">My Account</h1>
            <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
            <button onClick={signOut} className="luxury-button-outline text-xs">Sign Out</button>
          </div>
          
          <OrderTracker userId={user.id} />

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
            {activeTab === 'homepage' && <AdminHomepage />}
            {activeTab === 'products' && <AdminProducts />}
            {activeTab === 'orders' && <AdminOrders />}
            {activeTab === 'reviews' && <AdminReviews />}
            {activeTab === 'wishlist' && <AdminWishlist />}
            {activeTab === 'newsletter' && <AdminNewsletter />}
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
