import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Download, Brain, TrendingUp, AlertTriangle, Info, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useStoreStore } from '@/features/stores/store/StoreStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { StoreRequiredBanner } from '../components/ui/StoreRequiredBanner';
import { cn } from '../utils/cn';
import type { Event, Severity } from '../types';

interface EnhancedEvent extends Event {
  anomaly_score?: number;
  is_anomaly?: boolean;
}

export default function Events() {
  const [events, setEvents] = useState<EnhancedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity | 'anomaly'>('all');
  const [dateFilter, setDateFilter] = useState('');
  
  // IMPORTANT: Only subscribe to specific store slices needed
  const currentStore = useStoreStore(state => state.currentStore);
  
  // AI Anomaly Detection Function
  const calculateAnomalyScore = (event: Event, allEvents: Event[]): number => {
    let score = 0;
    
    // Time-based anomaly (events outside business hours)
    const eventHour = new Date(event.captured_at).getHours();
    if (eventHour < 6 || eventHour > 22) {
      score += 0.3;
    }
    
    // Frequency-based anomaly
    const recentEvents = allEvents.filter(e => 
      e.event_type === event.event_type &&
      new Date(e.captured_at).getTime() > Date.now() - 3600000 // Last hour
    );
    if (recentEvents.length > 5) {
      score += 0.4;
    }
    
    // Severity-based scoring
    if (event.severity === 'suspicious') {
      score += 0.5;
    } else if (event.severity === 'warn') {
      score += 0.2;
    }
    
    // Pattern-based anomaly (unusual event types)
    const unusualEvents = ['void_transaction', 'after_hours_access', 'multiple_failed_logins'];
    if (unusualEvents.includes(event.event_type)) {
      score += 0.3;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  };
  
  useEffect(() => {
    // We can still fetch events if we have a current store
    if (!currentStore) {
      setLoading(false);
      setEvents([]);
      return;
    }
    
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('store_id', currentStore.id)
          .order('captured_at', { ascending: false })
          .limit(100);
          
        if (error) throw error;
        
        const eventsData = data as Event[];
        
        // Apply AI anomaly detection
        const enhancedEvents: EnhancedEvent[] = eventsData.map(event => {
          const anomalyScore = calculateAnomalyScore(event, eventsData);
          return {
            ...event,
            anomaly_score: anomalyScore,
            is_anomaly: anomalyScore > 0.6
          };
        });
        
        setEvents(enhancedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [currentStore]);
  
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.payload.description && event.payload.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSeverity = severityFilter === 'all' || 
                           (severityFilter === 'anomaly' && event.is_anomaly) ||
                           (severityFilter !== 'anomaly' && event.severity === severityFilter);
    
    const matchesDate = !dateFilter || 
                       format(new Date(event.captured_at), 'yyyy-MM-dd') === dateFilter;
    
    return matchesSearch && matchesSeverity && matchesDate;
  });
  
  const getSeverityIcon = (severity: Severity, isAnomaly?: boolean) => {
    if (isAnomaly) {
      return <Brain className="h-5 w-5 text-purple-500" />;
    }
    
    switch (severity) {
      case 'suspicious':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getSeverityBadge = (severity: Severity, isAnomaly?: boolean, anomalyScore?: number) => {
    if (isAnomaly) {
      return (
        <div className="flex items-center space-x-1">
          <Badge variant="default" className="bg-purple-100 text-purple-800">
            AI Anomaly
          </Badge>
          {anomalyScore && (
            <span className="text-xs text-purple-600 font-medium">
              {Math.round(anomalyScore * 100)}%
            </span>
          )}
        </div>
      );
    }
    
    switch (severity) {
      case 'suspicious':
        return <Badge variant="danger">Suspicious</Badge>;
      case 'warn':
        return <Badge variant="warning">Warning</Badge>;
      default:
        return <Badge variant="info">Info</Badge>;
    }
  };
  
  const getAnomalyScoreColor = (score: number) => {
    if (score > 0.8) return 'text-red-600';
    if (score > 0.6) return 'text-purple-600';
    if (score > 0.4) return 'text-amber-600';
    return 'text-green-600';
  };
  
  const exportEvents = () => {
    const csvContent = [
      ['Timestamp', 'Event Type', 'Severity', 'Anomaly Score', 'Description'].join(','),
      ...filteredEvents.map(event => [
        event.captured_at,
        event.event_type,
        event.severity,
        event.anomaly_score?.toFixed(2) || '0.00',
        event.payload.description || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            Events
            <Brain className="h-6 w-6 ml-2 text-purple-500" title="AI-Enhanced Detection" />
          </h1>
          <p className="text-slate-500">
            {currentStore 
              ? `Monitor security events for ${currentStore.name} with AI anomaly detection`
              : 'Monitor security events with AI anomaly detection'
            }
          </p>
        </div>
        <Button
          onClick={exportEvents}
          leftIcon={<Download className="h-4 w-4" />}
          disabled={filteredEvents.length === 0}
        >
          Export CSV
        </Button>
      </div>
      
      {/* Show banner if no stores exist */}
      <StoreRequiredBanner 
        message="Create a store to see events specific to your business."
      />
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              options={[
                { value: 'all', label: 'All Severities' },
                { value: 'anomaly', label: 'AI Anomalies' },
                { value: 'suspicious', label: 'Suspicious' },
                { value: 'warn', label: 'Warning' },
                { value: 'info', label: 'Info' },
              ]}
            />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              leftIcon={<Calendar className="h-4 w-4" />}
            />
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSeverityFilter('all');
                setDateFilter('');
              }}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Events List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>
                {!currentStore 
                  ? 'Select a store to view events'
                  : 'No events match your filters'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEvents.map((event) => (
                <div 
                  key={event.id} 
                  className={cn(
                    "p-6 hover:bg-slate-50 transition-colors",
                    event.is_anomaly && "bg-purple-50 border-l-4 border-l-purple-500"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="mt-1">
                        {getSeverityIcon(event.severity, event.is_anomaly)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-slate-900">
                            {event.event_type}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {getSeverityBadge(event.severity, event.is_anomaly, event.anomaly_score)}
                          </div>
                        </div>
                        <p className="text-slate-600 mb-3">
                          {event.payload.description || 'No description provided'}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-slate-400">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              {formatDistanceToNow(new Date(event.captured_at), { addSuffix: true })}
                            </span>
                            <span className="mx-2">•</span>
                            <span>
                              {format(new Date(event.captured_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          {event.anomaly_score && event.anomaly_score > 0.3 && (
                            <div className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              <span className={cn('font-medium', getAnomalyScoreColor(event.anomaly_score))}>
                                Anomaly Score: {Math.round(event.anomaly_score * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                        {event.payload && Object.keys(event.payload).length > 1 && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-md">
                            <h4 className="text-sm font-medium text-slate-700 mb-2">Event Details:</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {Object.entries(event.payload).map(([key, value]) => (
                                key !== 'description' && (
                                  <div key={key}>
                                    <span className="font-medium text-slate-600">{key}:</span>
                                    <span className="ml-1 text-slate-800">{String(value)}</span>
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}