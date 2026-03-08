import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plug, CheckCircle, XCircle, Loader2, Wallet, Send, Search } from 'lucide-react';
import { toast } from 'sonner';

const AdminAPI = () => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [balance, setBalance] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const callSteadfast = async (action: string, data?: any) => {
    const { data: result, error } = await supabase.functions.invoke('steadfast-courier', {
      body: { action, data },
    });
    if (error) throw error;
    return result;
  };

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const result = await callSteadfast('check_connection');
      if (result.success) {
        setConnectionStatus('connected');
        setBalance(result.data?.current_balance?.toString() || '0');
        toast.success('Steadfast API connected successfully!');
      } else {
        setConnectionStatus('error');
        toast.error('Connection failed: ' + (result.data?.message || 'Invalid credentials'));
      }
    } catch (err: any) {
      setConnectionStatus('error');
      toast.error('Connection failed: ' + err.message);
    }
  };

  const checkBalance = async () => {
    try {
      const result = await callSteadfast('check_balance');
      if (result.success) {
        setBalance(result.data?.current_balance?.toString() || '0');
        toast.success('Balance updated');
      } else {
        toast.error('Failed to fetch balance');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const trackOrder = async () => {
    if (!trackingId.trim()) { toast.error('Enter a consignment ID'); return; }
    setTrackingLoading(true);
    try {
      const result = await callSteadfast('check_status', { consignment_id: trackingId.trim() });
      if (result.success) {
        setTrackingResult(result.data);
      } else {
        toast.error('Tracking failed');
        setTrackingResult(null);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Steadfast Courier Integration */}
      <div className="border border-border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Plug size={20} />
          <div>
            <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Steadfast Courier API</h3>
            <p className="text-xs text-muted-foreground">Courier delivery integration for Bangladesh</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 border text-xs ${
            connectionStatus === 'connected' ? 'border-green-500/30 bg-green-500/5 text-green-700' :
            connectionStatus === 'error' ? 'border-destructive/30 bg-destructive/5 text-destructive' :
            'border-border text-muted-foreground'
          }`}>
            {connectionStatus === 'checking' && <Loader2 size={14} className="animate-spin" />}
            {connectionStatus === 'connected' && <CheckCircle size={14} />}
            {connectionStatus === 'error' && <XCircle size={14} />}
            {connectionStatus === 'idle' && <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />}
            <span>
              {connectionStatus === 'idle' && 'Not checked'}
              {connectionStatus === 'checking' && 'Checking...'}
              {connectionStatus === 'connected' && 'Connected'}
              {connectionStatus === 'error' && 'Connection Failed'}
            </span>
          </div>
          <button onClick={checkConnection} disabled={connectionStatus === 'checking'} className="luxury-button-primary text-[10px] py-2 px-4">
            {connectionStatus === 'checking' ? 'Checking...' : 'Check Connection'}
          </button>
        </div>

        {/* Balance */}
        {connectionStatus === 'connected' && balance !== null && (
          <div className="flex items-center gap-3 p-4 bg-muted/30 border border-border">
            <Wallet size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground tracking-wider uppercase">Current Balance</p>
              <p className="text-lg font-light" style={{ fontFamily: 'var(--font-display)' }}>৳{Number(balance).toLocaleString()}</p>
            </div>
            <button onClick={checkBalance} className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors underline">
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Order Tracking */}
      <div className="border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Search size={20} />
          <div>
            <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Track Order</h3>
            <p className="text-xs text-muted-foreground">Track delivery status by consignment ID</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={trackingId}
            onChange={e => setTrackingId(e.target.value)}
            placeholder="Enter Consignment ID"
            className="luxury-input flex-1"
            onKeyDown={e => e.key === 'Enter' && trackOrder()}
          />
          <button onClick={trackOrder} disabled={trackingLoading} className="luxury-button-primary text-[10px] py-2 px-4 inline-flex items-center gap-1">
            {trackingLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            Track
          </button>
        </div>

        {trackingResult && (
          <div className="border border-border p-4 space-y-2 bg-muted/10 text-sm">
            {trackingResult.delivery_status && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="luxury-badge">{trackingResult.delivery_status}</span>
              </div>
            )}
            {trackingResult.tracking_code && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tracking Code</span>
                <span>{trackingResult.tracking_code}</span>
              </div>
            )}
            {!trackingResult.delivery_status && (
              <pre className="text-xs text-muted-foreground overflow-auto">{JSON.stringify(trackingResult, null, 2)}</pre>
            )}
          </div>
        )}
      </div>

      {/* API Info */}
      <div className="border border-border p-6 space-y-3 opacity-70">
        <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>API Information</h3>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>• Base URL: portal.steadfast.com.bd/api/v1</p>
          <p>• Auth: API Key + Secret Key (stored securely)</p>
          <p>• Endpoints: create_order, status_by_cid, get_balance</p>
          <p>• Keys can be updated in project secrets</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAPI;
