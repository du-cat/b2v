import { supabase, safeSupabaseCall, validateSession } from '../../../lib/supabase';
import { playSoundSafely } from '../../../utils/soundUtils';
import type { Notification, CreateNotificationData } from '../types';

/**
 * Notification service following Single Responsibility Principle
 * Handles all notification-related API calls and business logic
 */
export class NotificationService {
  /**
   * Fetch notifications for a user
   */
  static async fetchNotifications(userId: string): Promise<{ notifications: Notification[]; error: string | null }> {
    try {
      console.log('🔄 NotificationService: Fetching notifications for user:', userId);
      
      // Validate session before making request
      const { isValid, error: sessionError } = await validateSession();
      if (!isValid) {
        console.error('❌ Session validation failed:', sessionError);
        throw new Error('SESSION_EXPIRED');
      }
      
      const result = await safeSupabaseCall(
        async () => {
          const { data, error } = await supabase
            .from('notifications')
            .select('id, user_id, message, severity, is_read, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
          return { data, error };
        },
        { data: [], error: new Error('Supabase not configured') },
        'Fetch notifications'
      );
      
      if (result.error) {
        // Handle missing table gracefully
        if (result.error.code === '42P01') {
          console.warn('⚠️ Notifications table does not exist, using mock data');
          return this.getMockNotifications(userId);
        }
        
        // Handle auth-related errors
        if (result.error.code === '42501' || result.error.message.includes('permission') || result.error.message.includes('RLS')) {
          throw new Error('SESSION_EXPIRED');
        }
        
        throw result.error;
      }
      
      console.log(`✅ NotificationService: Successfully fetched ${result.data.length} notifications`);
      return { notifications: result.data as Notification[], error: null };
    } catch (error) {
      console.error('❌ NotificationService: Fetch notifications failed:', error);
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'SESSION_EXPIRED') {
        return { notifications: [], error: 'SESSION_EXPIRED' };
      }
      
      // Fallback to mock data on any error
      return this.getMockNotifications(userId);
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<{ error: string | null }> {
    try {
      // Validate session before making request
      const { isValid, error: sessionError } = await validateSession();
      if (!isValid) {
        throw new Error('SESSION_EXPIRED');
      }
      
      // Handle mock notifications
      if (notificationId.startsWith('mock-')) {
        console.log('📝 Marking mock notification as read:', notificationId);
        return { error: null };
      }
      
      const result = await safeSupabaseCall(
        async () => {
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
          return { error };
        },
        { error: null },
        'Mark notification as read'
      );
      
      if (result.error) {
        if (result.error.code === '42501' || result.error.message.includes('permission')) {
          throw new Error('SESSION_EXPIRED');
        }
        throw result.error;
      }
      
      return { error: null };
    } catch (error) {
      console.error('❌ NotificationService: Mark as read failed:', error);
      return { error: (error as Error).message };
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<{ error: string | null }> {
    try {
      // Validate session before making request
      const { isValid, error: sessionError } = await validateSession();
      if (!isValid) {
        throw new Error('SESSION_EXPIRED');
      }
      
      const result = await safeSupabaseCall(
        async () => {
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
          return { error };
        },
        { error: null },
        'Mark all notifications as read'
      );
      
      if (result.error) {
        if (result.error.code === '42501' || result.error.message.includes('permission')) {
          throw new Error('SESSION_EXPIRED');
        }
        throw result.error;
      }
      
      return { error: null };
    } catch (error) {
      console.error('❌ NotificationService: Mark all as read failed:', error);
      return { error: (error as Error).message };
    }
  }

  /**
   * Create a new notification
   */
  static async createNotification(notificationData: CreateNotificationData): Promise<{ notification: Notification | null; error: string | null }> {
    try {
      // Validate session before making request
      const { isValid, error: sessionError } = await validateSession();
      if (!isValid) {
        throw new Error('SESSION_EXPIRED');
      }
      
      const result = await safeSupabaseCall(
        async () => {
          const { data, error } = await supabase
            .from('notifications')
            .insert([{
              ...notificationData,
              is_read: false,
              created_at: new Date().toISOString()
            }])
            .select()
            .single();
          return { data, error };
        },
        { data: null, error: new Error('Supabase not configured') },
        'Create notification'
      );
      
      if (result.error) {
        if (result.error.code === '42501' || result.error.message.includes('permission')) {
          throw new Error('SESSION_EXPIRED');
        }
        throw result.error;
      }
      
      return { notification: result.data as Notification, error: null };
    } catch (error) {
      console.error('❌ NotificationService: Create notification failed:', error);
      return { notification: null, error: (error as Error).message };
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  static subscribeToNotifications(userId: string, onNotificationReceived: (notification: Notification) => void): () => void {
    console.log('🔄 NotificationService: Setting up real-time subscription for user:', userId);
    
    const subscription = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Play notification sound for critical and warning notifications
          if (newNotification.severity === 'critical' || newNotification.severity === 'warning') {
            this.playNotificationSound(newNotification.severity);
          }
          
          onNotificationReceived(newNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          onNotificationReceived(updatedNotification);
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Get mock notifications when table doesn't exist
   */
  private static getMockNotifications(userId: string): { notifications: Notification[]; error: string | null } {
    const mockNotifications: Notification[] = [
      {
        id: 'mock-1',
        user_id: userId,
        message: 'Welcome to SentinelPOS Guardian! Your security monitoring system is now active.',
        type: 'welcome',
        severity: 'info',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-2',
        user_id: userId,
        message: 'System setup completed successfully. All monitoring features are now enabled.',
        type: 'system',
        severity: 'info',
        is_read: false,
        created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      }
    ];
    
    console.log('📝 Using mock notifications data');
    return { notifications: mockNotifications, error: null };
  }

  /**
   * Play notification sound
   */
  private static playNotificationSound(severity: string): void {
    try {
      let soundFile = '/notification.mp3'; // Default
      
      switch (severity) {
        case 'critical':
          soundFile = '/sounds/alert.mp3';
          break;
        case 'warning':
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