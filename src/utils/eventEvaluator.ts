import { supabase } from '../lib/supabase';
import { useNotificationStore } from '@/features/notifications/store/NotificationStore';
import { useAuthStore } from '@/features/auth/store/AuthStore';
import toast from 'react-hot-toast';

/**
 * Evaluates an event for suspicious activity and creates alerts/notifications
 * This is a client-side implementation that works alongside the Edge Function
 */
export async function evaluateClientEvent(event: {
  id: string;
  store_id: string;
  event_type: string;
  device_id: string;
  timestamp: string;
  amount?: number;
  employee_id?: string;
  metadata?: Record<string, any>;
}) {
  console.log('🔍 Client-side event evaluation for:', event);
  
  try {
    // Check 1: Drawer opened without transaction within ±10 seconds
    if (event.event_type === 'drawer_open') {
      const eventTime = new Date(event.timestamp);
      const fromTime = new Date(eventTime.getTime() - 10_000).toISOString();
      const toTime = new Date(eventTime.getTime() + 10_000).toISOString();

      const { data: txns, error } = await supabase
        .from('events')
        .select('id')
        .eq('store_id', event.store_id)
        .eq('event_type', 'transaction')
        .gte('captured_at', fromTime)
        .lte('captured_at', toTime);

      if (error) {
        console.error('Error checking for transactions:', error);
        return;
      }

      if (!txns?.length) {
        console.log('🚨 ALERT: Drawer opened without a transaction within 10 seconds');
        
        // Create alert in database
        await createAlert({
          event_id: event.id,
          rule: 'drawer_open_no_transaction',
          severity: 'warn',
          message: 'Drawer opened without a transaction within 10 seconds.'
        });
        
        // Show toast notification
        toast.error('Alert: Drawer opened without a transaction', {
          duration: 5000,
          icon: '⚠️'
        });
        
        return true;
      }
    }

    // Check 2: High-value void transaction
    if (event.event_type === 'void' && event.amount && event.amount > 100) {
      console.log('🚨 ALERT: High-value void transaction detected');
      
      await createAlert({
        event_id: event.id,
        rule: 'high_void',
        severity: 'suspicious',
        message: `Void transaction exceeds $100: $${event.amount}`
      });
      
      toast.error(`Alert: High-value void transaction: $${event.amount}`, {
        duration: 5000,
        icon: '🚨'
      });
      
      return true;
    }

    // Check 3: Manual price override
    if (event.event_type === 'price_override') {
      console.log('🚨 ALERT: Manual price override detected');
      
      await createAlert({
        event_id: event.id,
        rule: 'manual_price_override',
        severity: 'warn',
        message: 'Manual price override detected.'
      });
      
      toast.error('Alert: Manual price override detected', {
        duration: 5000,
        icon: '⚠️'
      });
      
      return true;
    }

    // Check 4: Refund processed
    if (event.event_type === 'refund' && event.amount && event.amount > 50) {
      console.log('🚨 ALERT: Large refund issued');
      
      await createAlert({
        event_id: event.id,
        rule: 'large_refund',
        severity: 'warn',
        message: `Large refund issued: $${event.amount}`
      });
      
      toast.error(`Alert: Large refund issued: $${event.amount}`, {
        duration: 5000,
        icon: '⚠️'
      });
      
      return true;
    }

    // Check 5: Event after hours (between 11PM and 5AM)
    const eventHour = new Date(event.timestamp).getHours();
    if (eventHour >= 23 || eventHour < 5) {
      console.log('🚨 ALERT: After hours activity detected');
      
      await createAlert({
        event_id: event.id,
        rule: 'after_hours_activity',
        severity: 'info',
        message: 'Event occurred outside of normal operating hours.'
      });
      
      toast.info('Alert: After hours activity detected', {
        duration: 5000,
        icon: '🕒'
      });
      
      return true;
    }

    // No alerts triggered
    return false;
  } catch (error) {
    console.error('Error evaluating event:', error);
    return false;
  }
}

/**
 * Creates an alert in the database and a notification for the user
 */
async function createAlert({ 
  event_id, 
  rule, 
  severity, 
  message 
}: {
  event_id: string;
  rule: string;
  severity: 'info' | 'warn' | 'suspicious';
  message: string;
}) {
  try {
    // First, update the event severity if needed
    await supabase
      .from('events')
      .update({ 
        severity,
        payload: {
          alert_rule: rule,
          alert_message: message
        }
      })
      .eq('id', event_id);
    
    // Create the alert
    const { data: alertData, error: alertError } = await supabase
      .from('alerts')
      .insert({
        event_id: event_id,
        channels: ['email', 'push'], // Default alert channels
      })
      .select()
      .single();
    
    if (alertError) {
      console.error('Error creating alert:', alertError);
      return false;
    }
    
    console.log('✅ Alert created successfully:', alertData);
    
    // Get the current user to create a notification
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }
    
    // Create a notification
    const notificationSeverity = severity === 'suspicious' ? 'critical' : 
                               severity === 'warn' ? 'warning' : 'info';
    
    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        message: message,
        type: 'event_alert',
        severity: notificationSeverity,
        is_read: false
      })
      .select()
      .single();
    
    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      return false;
    }
    
    console.log('✅ Notification created successfully:', notificationData);
    
    return true;
  } catch (error) {
    console.error('Error creating alert:', error);
    return false;
  }
}

/**
 * Hook to use the event evaluator with store integration
 */
export function useEventEvaluator() {
  const { user } = useAuthStore();
  const { createNotification } = useNotificationStore();
  
  const evaluateEvent = async (event: {
    id: string;
    store_id: string;
    event_type: string;
    device_id: string;
    timestamp: string;
    amount?: number;
    employee_id?: string;
    metadata?: Record<string, any>;
  }) => {
    // First try the client-side evaluation
    const alertCreated = await evaluateClientEvent(event);
    
    // If no alert was created and we have a user, create a notification directly
    if (!alertCreated && user && event.event_type === 'drawer_open') {
      try {
        await createNotification({
          user_id: user.id,
          message: 'Drawer opened without a transaction within 10 seconds.',
          type: 'event_alert',
          severity: 'warning'
        });
        
        toast.warning('Alert: Drawer opened without a transaction', {
          duration: 5000,
          icon: '⚠️'
        });
        
        return true;
      } catch (error) {
        console.error('Error creating notification:', error);
        return false;
      }
    }
    
    return alertCreated;
  };
  
  return { evaluateEvent };
}