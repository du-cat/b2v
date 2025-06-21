export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type?: string;
  severity: NotificationSeverity;
  is_read: boolean;
  created_at: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface CreateNotificationData {
  user_id: string;
  message: string;
  type?: string;
  severity: NotificationSeverity;
}