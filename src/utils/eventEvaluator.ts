import { supabase } from '../lib/supabase';
import { useNotificationStore } from '@/features/notifications/store/NotificationStore';
import { useAuthStore } from '@/features/auth/store/AuthStore';
import toast from 'react-hot-toast';
import { playSoundSafely } from './soundUtils';

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
        
        // Play alert sound
        playAlertSound('warning');
        
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
      
      // Play alert sound
      playAlertSound('critical');
      
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
      
      // Play alert sound
      playAlertSound('warning');
      
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
      
      // Play alert sound
      playAlertSound('warning');
      
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
      
      // Play alert sound
      playAlertSound('info');
      
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
        payload: supabase.rpc('jsonb_deep_merge', {
          target: supabase.from('events').select('payload').eq('id', event_id).single(),
          source: {
            alert_rule: rule,
            alert_message: message
          }
        })
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
 * Play appropriate sound based on alert severity
 */
function playAlertSound(severity: 'info' | 'warning' | 'critical') {
  try {
    let soundFile = '/sounds/default.mp3';
    
    switch (severity) {
      case 'critical':
        soundFile = '/sounds/alert.mp3';
        break;
      case 'warning':
        soundFile = '/sounds/chime.mp3';
        break;
      case 'info':
      default:
        soundFile = '/sounds/default.mp3';
        break;
    }
    
    // Try to play the sound file
    playSoundSafely(soundFile, 0.7).catch(error => {
      console.warn('Failed to play alert sound:', error);
      
      // Fallback to Web Audio API if file playback fails
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        createSoundByType(severity, audioContext);
      } catch (fallbackError) {
        console.warn('Failed to play fallback sound:', fallbackError);
      }
    });
  } catch (error) {
    console.warn('Error playing alert sound:', error);
  }
}

/**
 * Create different sound types using Web Audio API
 * This is a CSP-compliant alternative to playing audio files
 */
function createSoundByType(type: string, audioContext: AudioContext): void {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Configure different sounds based on type
  switch (type) {
    case 'warning':
      // Warning chime - multiple tones
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
      break;
      
    case 'critical':
      // Urgent alert - rapid beeps
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      
      // Create rapid beeping pattern
      for (let i = 0; i < 3; i++) {
        const startTime = audioContext.currentTime + (i * 0.3);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + 0.15);
      }
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
      break;
      
    case 'info':
    default:
      // Simple notification beep
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      break;
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
        
        // Play alert sound
        playAlertSound('warning');
        
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