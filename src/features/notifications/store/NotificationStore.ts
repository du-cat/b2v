import { create } from 'zustand';
import { NotificationService } from '../services/NotificationService';
import type { NotificationState, Notification, CreateNotificationData } from '../types';

/**
 * Notification store following Single Responsibility Principle
 * Manages notification state only - no business logic
 */
interface NotificationStore extends NotificationState {
  // Actions
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  createNotification: (notificationData: CreateNotificationData) => Promise<void>;
  subscribeToNotifications: (userId: string) => () => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (notification: Notification) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  // Actions
  fetchNotifications: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await NotificationService.fetchNotifications(userId);
      
      if (result.error) {
        set({ 
          notifications: [], 
          unreadCount: 0,
          isLoading: false, 
          error: result.error 
        });
        return;
      }
      
      const unreadCount = result.notifications.filter(n => !n.is_read).length;
      
      set({ 
        notifications: result.notifications, 
        unreadCount,
        isLoading: false, 
        error: null 
      });
    } catch (error) {
      console.error('❌ NotificationStore: Fetch notifications failed:', error);
      set({ 
        notifications: [],
        unreadCount: 0,
        isLoading: false, 
        error: (error as Error).message
      });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const result = await NotificationService.markAsRead(notificationId);
      
      if (result.error) {
        set({ error: result.error });
        return;
      }
      
      // Update local state
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('❌ NotificationStore: Mark as read failed:', error);
      set({ error: (error as Error).message });
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      const result = await NotificationService.markAllAsRead(userId);
      
      if (result.error) {
        set({ error: result.error });
        return;
      }
      
      // Update local state
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('❌ NotificationStore: Mark all as read failed:', error);
      set({ error: (error as Error).message });
    }
  },

  createNotification: async (notificationData: CreateNotificationData) => {
    try {
      const result = await NotificationService.createNotification(notificationData);
      
      if (result.error) {
        set({ error: result.error });
        return;
      }
      
      if (result.notification) {
        // Add to notifications list and update unread count
        set(state => ({
          notifications: [result.notification!, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }));
      }
    } catch (error) {
      console.error('❌ NotificationStore: Create notification failed:', error);
      set({ error: (error as Error).message });
    }
  },

  subscribeToNotifications: (userId: string) => {
    return NotificationService.subscribeToNotifications(userId, (notification) => {
      if (notification.is_read) {
        get().updateNotification(notification);
      } else {
        get().addNotification(notification);
      }
    });
  },

  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  updateNotification: (notification: Notification) => {
    set(state => {
      const wasUnread = state.notifications.find(n => n.id === notification.id)?.is_read === false;
      const isNowRead = notification.is_read;
      const unreadDelta = wasUnread && isNowRead ? -1 : 0;
      
      return {
        notifications: state.notifications.map(n => 
          n.id === notification.id ? notification : n
        ),
        unreadCount: Math.max(0, state.unreadCount + unreadDelta)
      };
    });
  },

  clearError: () => {
    set({ error: null });
  }
}));