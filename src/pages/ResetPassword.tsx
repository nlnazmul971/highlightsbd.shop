import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully!');
      navigate('/admin');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background">
        <Header /><CartDrawer />
        <main className="max-w-md mx-auto px-4 pt-40 text-center">
          <h1 className="luxury-heading text-2xl tracking-[0.15em] mb-4">Invalid Link</h1>
          <p className="text-sm text-muted-foreground mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/admin" className="luxury-button-primary inline-block px-8">Go to Sign In</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <main className="max-w-md mx-auto px-4 pt-40">
        <h1 className="luxury-heading text-2xl tracking-[0.15em] mb-8 text-center">Set New Password</h1>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" className="luxury-input" required minLength={6} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="luxury-input" required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="luxury-button-primary w-full">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        <Link to="/admin" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6">
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </main>
    </div>
  );
};

export default ResetPassword;
