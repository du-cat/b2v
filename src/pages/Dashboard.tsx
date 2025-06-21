import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, ShieldCheck, Clock, PieChart, Store, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EventsFeed } from '../components/dashboard/EventsFeed';
import { KpiCard } from '../components/dashboard/KpiCard';
import { useStoreStore } from '@/features/stores/store/StoreStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { StoreRequiredBanner } from '../components/ui/StoreRequiredBanner';
import { format, startOfDay, subDays, parseISO } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todaySuspicious: { count: 0, loading: true },
    weekSuspicious: { count: 0, loading: true },
    openAlerts: { count: 0, loading: true },
    activeRules: { count: 0, loading: true },
  });
  
  // IMPORTANT: Only subscribe to specific store slices needed
  const currentStore = useStoreStore(state => state.currentStore);
  const hasStores = useStoreStore(state => state.stores.length > 0);
  
  useEffect(() => {
    // Only fetch stats if we have a current store
    if (!currentStore) {
      console.log('ℹ️ Dashboard: No current store, skipping stats fetch');
      setStats(prev => ({
        todaySuspicious: { count: 0, loading: false },
        weekSuspicious: { count: 0, loading: false },
        openAlerts: { count: 0, loading: false },
        activeRules: { count: 0, loading: false },
      }));
      return;
    }
    
    const fetchStats = async () => {
      try {
        // Get today's date range
        const today = startOfDay(new Date());
        const todayStr = format(today, "yyyy-MM-dd'T'HH:mm:ss'Z'");
        
        // Get week start date
        const weekStartDate = subDays(today, 7);
        const weekStartStr = format(weekStartDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
        
        // Today's suspicious events
        const { data: todaySuspicious, error: todayError } = await supabase
          .from('events')
          .select('id', { count: 'exact' })
          .eq('store_id', currentStore.id)
          .eq('severity', 'suspicious')
          .gte('captured_at', todayStr);
          
        if (todayError) throw todayError;
        
        // Week's suspicious events
        const { data: weekSuspicious, error: weekError } = await supabase
          .from('events')
          .select('id', { count: 'exact' })
          .eq('store_id', currentStore.id)
          .eq('severity', 'suspicious')
          .gte('captured_at', weekStartStr);
          
        if (weekError) throw weekError;
        
        // Open alerts (no sent_at date)
        const { data: alerts, error: alertsError } = await supabase
          .from('alerts')
          .select('alerts.id, events!inner(store_id)')
          .is('sent_at', null)
          .eq('events.store_id', currentStore.id);
          
        if (alertsError) throw alertsError;
        
        // Active rules
        const { data: rules, error: rulesError } = await supabase
          .from('rules')
          .select('id', { count: 'exact' })
          .eq('store_id', currentStore.id)
          .eq('is_active', true);
          
        if (rulesError) throw rulesError;
        
        setStats({
          todaySuspicious: { count: todaySuspicious.length, loading: false },
          weekSuspicious: { count: weekSuspicious.length, loading: false },
          openAlerts: { count: alerts.length, loading: false },
          activeRules: { count: rules.length, loading: false },
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({
          ...prev,
          todaySuspicious: { ...prev.todaySuspicious, loading: false },
          weekSuspicious: { ...prev.weekSuspicious, loading: false },
          openAlerts: { ...prev.openAlerts, loading: false },
          activeRules: { ...prev.activeRules, loading: false },
        }));
      }
    };
    
    fetchStats();
  }, [currentStore]);
  
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            {currentStore ? `Monitoring ${currentStore.name}` : 'Security monitoring dashboard'}
          </p>
        </div>
        
        {/* Show banner if no stores exist */}
        <StoreRequiredBanner 
          message="Create your first store to enable full monitoring capabilities."
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Today's Suspicious"
            value={stats.todaySuspicious.count}
            icon={<AlertTriangle className="h-5 w-5" />}
            change={12}
            changeLabel="vs. yesterday"
            inverseTrend={true}
            loading={stats.todaySuspicious.loading}
          />
          <KpiCard
            title="Week's Suspicious"
            value={stats.weekSuspicious.count}
            icon={<PieChart className="h-5 w-5" />}
            change={-5}
            changeLabel="vs. last week"
            inverseTrend={true}
            loading={stats.weekSuspicious.loading}
          />
          <KpiCard
            title="Open Alerts"
            value={stats.openAlerts.count}
            icon={<Clock className="h-5 w-5" />}
            loading={stats.openAlerts.loading}
          />
          <KpiCard
            title="Active Rules"
            value={stats.activeRules.count}
            icon={<ShieldCheck className="h-5 w-5" />}
            loading={stats.activeRules.loading}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Chart placeholder - to be implemented */}
            <Card>
              <CardContent className="p-6">
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg">
                  <p className="text-slate-400">Event trend chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <EventsFeed />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}