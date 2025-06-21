import { supabase, safeSupabaseCall } from '../../../lib/supabase';
import { playSoundSafely } from '../../../utils/soundUtils';
import type { Event, EnhancedEvent } from '../types';

/**
 * Event service following Single Responsibility Principle
 * Separated concerns: Data ingestion, Business logic, Store updates
 */
export class EventService {
  /**
   * RAW DATA INGESTION
   * Fetch events from Supabase without any processing
   */
  static async fetchRawEvents(storeId: string, limit: number = 100): Promise<{ events: Event[]; error: string | null }> {
    try {
      console.log('🔄 EventService: Fetching raw events for store:', storeId);
      
      const result = await safeSupabaseCall(
        async () => {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('store_id', storeId)
            .order('captured_at', { ascending: false })
            .limit(limit);
          return { data, error };
        },
        { data: [], error: new Error('Supabase not configured') },
        'Fetch raw events'
      );
      
      if (result.error) {
        throw result.error;
      }
      
      console.log(`✅ EventService: Successfully fetched ${result.data.length} raw events`);
      return { events: result.data as Event[], error: null };
    } catch (error) {
      console.error('❌ EventService: Fetch raw events failed:', error);
      return { events: [], error: (error as Error).message };
    }
  }

  /**
   * BUSINESS LOGIC - ANOMALY DETECTION
   * Process events to flag suspicious activity
   */
  static processEventsForAnomalies(events: Event[]): EnhancedEvent[] {
    console.log('🧠 EventService: Processing events for anomaly detection...');
    
    return events.map(event => {
      const anomalyScore = this.calculateAnomalyScore(event, events);
      const isAnomaly = anomalyScore > 0.6;
      
      // Log anomalies clearly
      if (isAnomaly) {
        console.log(`🚨 ANOMALY DETECTED: ${event.event_type} (Score: ${Math.round(anomalyScore * 100)}%)`, {
          eventId: event.id,
          eventType: event.event_type,
          severity: event.severity,
          anomalyScore,
          timestamp: event.captured_at,
          reasons: this.getAnomalyReasons(event, events)
        });
      }
      
      return {
        ...event,
        anomaly_score: anomalyScore,
        is_anomaly: isAnomaly
      };
    });
  }

  /**
   * COMPLETE EVENT PROCESSING PIPELINE
   * Combines data ingestion and business logic
   */
  static async fetchEvents(storeId: string, limit: number = 100): Promise<{ events: EnhancedEvent[]; error: string | null }> {
    try {
      // Step 1: Raw data ingestion
      const { events: rawEvents, error } = await this.fetchRawEvents(storeId, limit);
      
      if (error) {
        return { events: [], error };
      }
      
      // Step 2: Business logic processing
      const enhancedEvents = this.processEventsForAnomalies(rawEvents);
      
      // Step 3: Trigger notifications for anomalies (but don't update store here)
      this.triggerAnomalyNotifications(enhancedEvents.filter(e => e.is_anomaly));
      
      return { events: enhancedEvents, error: null };
    } catch (error) {
      console.error('❌ EventService: Complete event processing failed:', error);
      return { events: [], error: (error as Error).message };
    }
  }

  /**
   * REAL-TIME SUBSCRIPTION
   * Subscribe to new events and process them
   */
  static subscribeToEvents(storeId: string, onEventReceived: (event: EnhancedEvent) => void): () => void {
    console.log('🔄 EventService: Setting up real-time subscription for store:', storeId);
    
    const subscription = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const newEvent = payload.new as Event;
          
          // Process single event for anomalies
          const enhancedEvent = this.processEventsForAnomalies([newEvent])[0];
          
          // Trigger notifications if needed
          if (enhancedEvent.is_anomaly || enhancedEvent.severity !== 'info') {
            this.triggerEventNotification(enhancedEvent);
          }
          
          onEventReceived(enhancedEvent);
        }
      )
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * PRIVATE METHODS - BUSINESS LOGIC IMPLEMENTATION
   */
  
  /**
   * Calculate anomaly score for an event
   */
  private static calculateAnomalyScore(event: Event, allEvents: Event[]): number {
    let score = 0;
    const reasons: string[] = [];
    
    // Time-based anomaly (events outside business hours)
    const eventHour = new Date(event.captured_at).getHours();
    if (eventHour < 6 || eventHour > 22) {
      score += 0.3;
      reasons.push('Outside business hours');
    }
    
    // Frequency-based anomaly
    const recentEvents = allEvents.filter(e => 
      e.event_type === event.event_type &&
      new Date(e.captured_at).getTime() > Date.now() - 3600000 // Last hour
    );
    if (recentEvents.length > 5) {
      score += 0.4;
      reasons.push(`High frequency: ${recentEvents.length} events in last hour`);
    }
    
    // Severity-based scoring
    if (event.severity === 'suspicious') {
      score += 0.5;
      reasons.push('Already marked as suspicious');
    } else if (event.severity === 'warn') {
      score += 0.2;
      reasons.push('Warning level event');
    }
    
    // Pattern-based anomaly (unusual event types)
    const unusualEvents = ['void_transaction', 'after_hours_access', 'multiple_failed_logins'];
    if (unusualEvents.includes(event.event_type)) {
      score += 0.3;
      reasons.push('Unusual event type');
    }
    
    // Amount-based anomaly (for transaction events)
    if (event.event_type === 'transaction' && event.payload.amount) {
      const amount = parseFloat(event.payload.amount);
      if (amount > 1000) {
        score += 0.2;
        reasons.push(`High value transaction: $${amount}`);
      }
      if (amount % 100 === 0 && amount >= 500) {
        score += 0.1;
        reasons.push('Round number transaction');
      }
    }
    
    // Store reasons for debugging
    (event as any)._anomalyReasons = reasons;
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Get human-readable anomaly reasons
   */
  private static getAnomalyReasons(event: Event, allEvents: Event[]): string[] {
    return (event as any)._anomalyReasons || [];
  }

  /**
   * NOTIFICATION TRIGGERS
   * Handle user notifications for anomalies (separate from store updates)
   */
  
  /**
   * Trigger notifications for multiple anomalies
   */
  private static triggerAnomalyNotifications(anomalies: EnhancedEvent[]): void {
    if (anomalies.length === 0) return;
    
    console.log(`🔔 EventService: Triggering notifications for ${anomalies.length} anomalies`);
    
    anomalies.forEach(event => {
      this.triggerEventNotification(event);
    });
  }

  /**
   * Trigger notification for a single event
   */
  private static triggerEventNotification(event: EnhancedEvent): void {
    // Play sound notification
    this.playNotificationSound(event.severity);
    
    // Log notification trigger
    console.log('🔔 EventService: Notification triggered for event:', {
      eventId: event.id,
      eventType: event.event_type,
      severity: event.severity,
      isAnomaly: event.is_anomaly,
      anomalyScore: event.anomaly_score
    });
    
    // In a real app, you might also:
    // - Send push notifications
    // - Create database notification records
    // - Send emails for critical events
    // - Update notification store
  }

  /**
   * Play notification sound based on severity
   */
  private static playNotificationSound(severity: string): void {
    try {
      let soundFile = '/notification.mp3'; // Default
      
      switch (severity) {
        case 'suspicious':
          soundFile = '/sounds/alert.mp3';
          break;
        case 'warn':
          soundFile = '/sounds/chime.mp3';
          break;
        default:
          soundFile = '/sounds/default.mp3';
          break;
      }
      
      // Use the safe play method that doesn't use string evaluation
      playSoundSafely(soundFile).catch(error => {
        console.warn('Failed to play notification sound:', error);
      });
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }
}