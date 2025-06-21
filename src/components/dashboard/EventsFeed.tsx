import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, Clock, ArrowRight, Brain, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEventStore } from '../../features/events/store/EventStore';
import { useCurrentStoreId } from '../../shared/contexts/AppContext';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { ErrorBoundary } from '../ErrorBoundary';
import type { EnhancedEvent, Severity } from '../../features/events/types';

/**
 * Pure UI component for events feed
 * CRITICAL: No direct API calls - only uses store actions and context
 */
export function EventsFeed() {
  // IMPORTANT: Subscribe to specific store slices only
  const events = useEventStore(state => state.events);
  const isLoading = useEventStore(state => state.isLoading);
  const error = useEventStore(state => state.error);
  const fetchEvents = useEventStore(state => state.fetchEvents);
  const subscribeToEvents = useEventStore(state => state.subscribeToEvents);
  
  // Use context for store ID (no direct store coupling)
  const currentStoreId = useCurrentStoreId();
  
  useEffect(() => {
    if (!currentStoreId) return;
    
    console.log('🔄 EventsFeed: Fetching events for store:', currentStoreId);
    
    try {
      // Fetch initial events
      fetchEvents(currentStoreId);
      
      // Set up real-time subscription
      const unsubscribe = subscribeToEvents(currentStoreId);
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error in EventsFeed:', error);
    }
  }, [currentStoreId, fetchEvents, subscribeToEvents]);
  
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
  
  return (
    <ErrorBoundary>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Bell className="h-5 w-5 mr-2 text-slate-500" />
              Live Event Feed
              <Brain className="h-4 w-4 ml-2 text-purple-500" title="AI-Enhanced" />
            </CardTitle>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Show loading state */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          )}
          
          {/* Show error state */}
          {error && (
            <div className="text-center py-12 text-red-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Error loading events: {error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => currentStoreId && fetchEvents(currentStoreId)}
              >
                Retry
              </Button>
            </div>
          )}
          
          {/* Show empty state */}
          {!isLoading && !error && (!currentStoreId || events.length === 0) && (
            <div className="text-center py-12 text-slate-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{!currentStoreId ? 'No store selected' : 'No events recorded yet'}</p>
            </div>
          )}
          
          {/* Show events */}
          {!isLoading && !error && events.length > 0 && (
            <div className="space-y-4">
              {events.slice(0, 10).map((event: EnhancedEvent) => (
                <div 
                  key={event.id} 
                  className={cn(
                    "flex items-start p-3 rounded-lg hover:bg-slate-50 transition-colors",
                    event.is_anomaly && "bg-purple-50 border border-purple-200"
                  )}
                >
                  <div className="mr-3 mt-0.5">
                    {getSeverityIcon(event.severity, event.is_anomaly)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {event.event_type}
                      </p>
                      <div className="flex items-center space-x-2">
                        {getSeverityBadge(event.severity, event.is_anomaly, event.anomaly_score)}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-1 truncate">
                      {event.payload.description || 'No description provided'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-slate-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(event.captured_at), { addSuffix: true })}
                      </div>
                      {event.anomaly_score && event.anomaly_score > 0.3 && (
                        <div className="flex items-center text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          <span className={cn('font-medium', getAnomalyScoreColor(event.anomaly_score))}>
                            {Math.round(event.anomaly_score * 100)}% anomaly
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}