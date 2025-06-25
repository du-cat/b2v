import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '@/features/notifications/store/NotificationStore';
import { useAuthStore } from '@/features/auth/store/AuthStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import type { Notification, NotificationSeverity } from '@/features/notifications/types';

/**
 * Notification dropdown component following Interface Segregation Principle
 * CRITICAL: Uses specific store subscriptions, no direct store coupling
 */
export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // IMPORTANT: Only subscribe to specific store slices needed
  const user = useAuthStore(state => state.user);
  
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    subscribeToNotifications 
  } = useNotificationStore();
  
  // Fetch notifications and set up real-time subscription
  useEffect(() => {
    if (!user) return;
    
    fetchNotifications(user.id);
    const unsubscribe = subscribeToNotifications(user.id);
    
    return unsubscribe;
  }, [user, fetchNotifications, subscribeToNotifications]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Flash notification bell when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0 && !isOpen) {
      setHasNewNotifications(true);
      const timeout = setTimeout(() => {
        setHasNewNotifications(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [unreadCount, isOpen]);
  
  const getSeverityIcon = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const getSeverityBadge = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="danger" className="text-xs">Critical</Badge>;
      case 'warning':
        return <Badge variant="warning" className="text-xs">Warning</Badge>;
      default:
        return <Badge variant="info" className="text-xs">Info</Badge>;
    }
  };
  
  const getSeverityStyles = (severity: NotificationSeverity, isRead: boolean) => {
    if (isRead) {
      return 'bg-white hover:bg-slate-50';
    }
    
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100';
      case 'warning':
        return 'bg-amber-50 border-l-4 border-l-amber-500 hover:bg-amber-100';
      default:
        return 'bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100';
    }
  };
  
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to events or alerts page
    navigate('/events');
    setIsOpen(false);
  };
  
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllAsRead(user.id);
  };
  
  const truncateText = (text: string, maxLength: number = 60) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors",
          hasNewNotifications && "animate-pulse"
        )}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-4 cursor-pointer transition-colors',
                      getSeverityStyles(notification.severity, notification.is_read)
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getSeverityIcon(notification.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            Security Alert
                          </p>
                          <div className="flex items-center space-x-2">
                            {getSeverityBadge(notification.severity)}
                            {!notification.is_read && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {truncateText(notification.message)}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-slate-600 hover:text-slate-900"
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}