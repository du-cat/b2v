import { useState, useEffect, useCallback } from 'react';
import { Heart, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from './Button';

export function HeartbeatStatus() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  
  const checkHeartbeat = useCallback(async () => {
    setStatus('checking');
    
    try {
      const startTime = performance.now();
      const { data, error } = await supabase.rpc('heartbeat');
      const endTime = performance.now();
      
      setResponseTime(Math.round(endTime - startTime));
      setLastChecked(new Date());
      
      if (error) {
        console.error('Heartbeat error:', error);
        setStatus('error');
      } else if (data === true) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Heartbeat check failed:', error);
      setStatus('error');
      setLastChecked(new Date());
    }
  }, []);
  
  useEffect(() => {
    checkHeartbeat();
    
    // Set up interval to check heartbeat every 30 seconds
    const interval = setInterval(checkHeartbeat, 30000);
    
    return () => clearInterval(interval);
  }, [checkHeartbeat]);
  
  return (
    <div className="flex items-center space-x-2">
      {status === 'checking' ? (
        <div className="animate-pulse">
          <Heart className="h-4 w-4 text-blue-500" />
        </div>
      ) : status === 'success' ? (
        <Heart className="h-4 w-4 text-green-500" />
      ) : (
        <Heart className="h-4 w-4 text-red-500" />
      )}
      
      <span className="text-xs text-slate-600">
        {status === 'checking' ? 'Checking...' : 
         status === 'success' ? `Healthy (${responseTime}ms)` : 
         'Connection issue'}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={checkHeartbeat}
        className="p-1"
      >
        <RefreshCw className="h-3 w-3 text-slate-400" />
      </Button>
    </div>
  );
}