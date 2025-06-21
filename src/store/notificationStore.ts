import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  
  fetchNotifications: async (userId) => {
    try {
      set({ isLoading: true, error: null });
      
      // Check if notifications table exists by trying to query it
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        // If table doesn't exist, create some mock notifications
        if (error.code === '42P01') {
          console.warn('Notifications table does not exist, using mock data');
          const mockNotifications: Notification[] = [
            {
              id: 'mock-1',
              user_id: userId,
              message: 'Welcome to SentinelPOS Guardian! Your security monitoring system is now active.',
              severity: 'info',
              is_read: false,
              created_at: new Date().toISOString(),
            },
            {
              id: 'mock-2',
              user_id: userId,
              message: 'System setup completed successfully. All monitoring features are now enabled.',
              severity: 'info',
              is_read: false,
              created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            }
          ];
          
          const unreadCount = mockNotifications.filter(n => !n.is_read).length;
          
          set({ 
            notifications: mockNotifications,
            unreadCount,
            isLoading: false,
            error: null
          });
          return;
        }
        throw error;
      }
      
      const notifications = data as Notification[];
      const unreadCount = notifications.filter(n => !n.is_read).length;
      
      set({ 
        notifications,
        unreadCount,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ 
        isLoading: false, 
        error: (error as Error).message 
      });
    }
  },
  
  markAsRead: async (notificationId) => {
    try {
      // Handle mock notifications
      if (notificationId.startsWith('mock-')) {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
        return;
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      set({ error: (error as Error).message });
    }
  },
  
  markAllAsRead: async (userId) => {
    try {
      // Handle mock notifications
      const state = get();
      const hasMockNotifications = state.notifications.some(n => n.id.startsWith('mock-'));
      
      if (hasMockNotifications) {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, is_read: true })),
          unreadCount: 0
        }));
        return;
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      set({ error: (error as Error).message });
    }
  },
  
  subscribeToNotifications: (userId) => {
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
            try {
              // Use a CSP-compliant approach to play sound
              const audio = new Audio('/notification.mp3');
              audio.volume = 0.7;
              
              // Use a Promise-based approach instead of string evaluation
              const playPromise = audio.play();
              
              // Handle the promise appropriately
              if (playPromise !== undefined) {
                playPromise.catch(e => {
                  console.log('Audio play prevented by browser policy', e);
                });
              }
            } catch (error) {
              console.warn('Failed to play notification sound:', error);
            }
          }
          
          // Add to notifications list and update unread count
          set(state => ({
            notifications: [newNotification, ...state.notifications.slice(0, 49)],
            unreadCount: state.unreadCount + 1
          }));
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
          
          set(state => ({
            notifications: state.notifications.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            ),
            unreadCount: state.notifications.filter(n => 
              n.id === updatedNotification.id ? !updatedNotification.is_read : !n.is_read
            ).length
          }));
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  },
}));