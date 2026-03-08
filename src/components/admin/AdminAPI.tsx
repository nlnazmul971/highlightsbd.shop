import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plug, CheckCircle, XCircle, Loader2, Wallet, Search, Truck } from 'lucide-react';
import { toast } from 'sonner';

type ConnectionStatus = 'idle' | 'checking' | 'connected' | 'error';

const StatusBadge = ({ status }: { status: ConnectionStatus }) => (
  <div className={`flex items-center gap-2 px-3 py-2 border text-xs ${
    status === 'connected' ? 'border-green-500/30 bg-green-500/5 text-green-700' :
    status === 'error' ? 'border-destructive/30 bg-destructive/5 text-destructive' :
    'border-border text-muted-foreground'
  }`}>
    {status === 'checking' && <Loader2 size={14} className="animate-spin" />}
    {status === 'connected' && <CheckCircle size={14} />}
    {status === 'error' && <XCircle size={14} />}
    {status === 'idle' && <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />}
    <span>
      {status === 'idle' && 'Not checked'}
      {status === 'checking' && 'Checking...'}
      {status === 'connected' && 'Connected'}
      {status === 'error' && 'Connection Failed'}
    </span>
  </div>
);

const AdminAPI = () => {
  // Steadfast state
  const [sfStatus, setSfStatus] = useState<ConnectionStatus>('idle');
  const [sfBalance, setSfBalance] = useState<string | null>(null);

  // Pathao state
  const [ptStatus, setPtStatus] = useState<ConnectionStatus>('idle');

  // Tracking state
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingProvider, setTrackingProvider] = useState<'steadfast' | 'pathao'>('steadfast');

  const callSteadfast = async (action: string, data?: any) => {
    const { data: result, error } = await supabase.functions.invoke('steadfast-courier', { body: { action, data } });
    if (error) throw error;
    return result;
  };

  const callPathao = async (action: string, data?: any) => {
    const { data: result, error } = await supabase.functions.invoke('pathao-courier', { body: { action, data } });
    if (error) throw error;
    return result;
  };

  // Steadfast
  const checkSteadfast = async () => {
    setSfStatus('checking');
    try {
      const result = await callSteadfast('check_connection');
      if (result.success) {
        setSfStatus('connected');
        setSfBalance(result.data?.current_balance?.toString() || '0');
        toast.success('Steadfast API connected!');
      } else {
        setSfStatus('error');
        toast.error('Steadfast: ' + (result.error || result.data?.message || 'Invalid credentials'));
      }
    } catch (err: any) {
      setSfStatus('error');
      toast.error('Steadfast: ' + err.message);
    }
  };

  const refreshBalance = async () => {
    try {
      const result = await callSteadfast('check_balance');
      if (result.success) {
        setSfBalance(result.data?.current_balance?.toString() || '0');
        toast.success('Balance updated');
      }
    } catch (err: any) { toast.error(err.message); }
  };

  // Pathao
  const checkPathao = async () => {
    setPtStatus('checking');
    try {
      const result = await callPathao('check_connection');
      if (result.success) {
        setPtStatus('connected');
        toast.success('Pathao API connected!');
      } else {
        setPtStatus('error');
        toast.error('Pathao: ' + (result.error || 'Connection failed'));
      }
    } catch (err: any) {
      setPtStatus('error');
      toast.error('Pathao: ' + err.message);
    }
  };

  // Tracking
  const trackOrder = async () => {
    if (!trackingId.trim()) { toast.error('Enter a consignment ID'); return; }
    setTrackingLoading(true);
    try {
      let result;
      if (trackingProvider === 'steadfast') {
        result = await callSteadfast('check_status', { consignment_id: trackingId.trim() });
      } else {
        result = await callPathao('view_order', { consignment_id: trackingId.trim() });
      }
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
      {/* Steadfast Courier */}
      <div className="border border-border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Plug size={20} />
          <div>
            <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Steadfast Courier API</h3>
            <p className="text-xs text-muted-foreground">Courier delivery integration for Bangladesh</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={sfStatus} />
          <button onClick={checkSteadfast} disabled={sfStatus === 'checking'} className="luxury-button-primary text-[10px] py-2 px-4">
            {sfStatus === 'checking' ? 'Checking...' : 'Check Connection'}
          </button>
        </div>
        {sfStatus === 'connected' && sfBalance !== null && (
          <div className="flex items-center gap-3 p-4 bg-muted/30 border border-border">
            <Wallet size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground tracking-wider uppercase">Current Balance</p>
              <p className="text-lg font-light" style={{ fontFamily: 'var(--font-display)' }}>৳{Number(sfBalance).toLocaleString()}</p>
            </div>
            <button onClick={refreshBalance} className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors underline">Refresh</button>
          </div>
        )}
      </div>

      {/* Pathao Courier */}
      <div className="border border-border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Truck size={20} />
          <div>
            <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Pathao Courier API</h3>
            <p className="text-xs text-muted-foreground">Pathao Merchant delivery integration</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={ptStatus} />
          <button onClick={checkPathao} disabled={ptStatus === 'checking'} className="luxury-button-primary text-[10px] py-2 px-4">
            {ptStatus === 'checking' ? 'Checking...' : 'Check Connection'}
          </button>
        </div>
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
        <div className="flex gap-2 items-center">
          <select
            value={trackingProvider}
            onChange={e => setTrackingProvider(e.target.value as 'steadfast' | 'pathao')}
            className="luxury-input text-xs w-32"
          >
            <option value="steadfast">Steadfast</option>
            <option value="pathao">Pathao</option>
          </select>
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
            {(trackingResult.tracking_code || trackingResult.consignment_id) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tracking Code</span>
                <span>{trackingResult.tracking_code || trackingResult.consignment_id}</span>
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
        <div className="space-y-2 text-xs text-muted-foreground">
          <div>
            <p className="font-medium text-foreground/70 mb-1">Steadfast Courier</p>
            <p>• Base URL: portal.steadfast.com.bd/api/v1</p>
            <p>• Auth: API Key + Secret Key</p>
            <p>• Endpoints: create_order, status_by_cid, get_balance</p>
          </div>
          <div>
            <p className="font-medium text-foreground/70 mb-1">Pathao Courier</p>
            <p>• Base URL: api-hermes.pathao.com</p>
            <p>• Auth: OAuth2 (Client ID, Secret, Username, Password)</p>
            <p>• Endpoints: issue-token, cities, zones, areas, orders</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAPI;
