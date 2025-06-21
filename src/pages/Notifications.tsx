import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, Info, AlertCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '@/features/notifications/store/NotificationStore';
import { useAuthStore } from '@/features/auth/store/AuthStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { cn } from '../utils/cn';
import type { NotificationSeverity } from '@/features/notifications/types';

export default function Notifications() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'warning' | 'info'>('all');
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationStore();
  
  useEffect(() => {
    if (!user) return;
    console.log('🔄 Fetching notifications for user:', user.id);
    fetchNotifications(user.id);
  }, [user, fetchNotifications]);
  
  const getSeverityIcon = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getSeverityBadge = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="danger">Critical</Badge>;
      case 'warning':
        return <Badge variant="warning">Warning</Badge>;
      default:
        return <Badge variant="info">Info</Badge>;
    }
  };
  
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.is_read;
      case 'critical':
      case 'warning':
      case 'info':
        return notification.severity === filter;
      default:
        return true;
    }
  });
  
  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllAsRead(user.id);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            leftIcon={<CheckCheck className="h-4 w-4" />}
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { key: 'all', label: 'All', count: notifications.length },
          { key: 'unread', label: 'Unread', count: unreadCount },
          { key: 'critical', label: 'Critical', count: notifications.filter(n => n.severity === 'critical').length },
          { key: 'warning', label: 'Warning', count: notifications.filter(n => n.severity === 'warning').length },
          { key: 'info', label: 'Info', count: notifications.filter(n => n.severity === 'info').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors',
              filter === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {tab.label} {tab.count > 0 && <span className="ml-1 text-xs">({tab.count})</span>}
          </button>
        ))}
      </div>
      
      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>
                {filter === 'all' 
                  ? 'No notifications yet' 
                  : `No ${filter} notifications`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-6 hover:bg-slate-50 transition-colors',
                    !notification.is_read && 'bg-blue-50 border-l-4 border-l-blue-500'
                  )}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(notification.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-slate-900">
                          Security Alert
                        </h3>
                        <div className="flex items-center space-x-2">
                          {getSeverityBadge(notification.severity)}
                          {!notification.is_read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-600 mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span>
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          <span>
                            {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                            leftIcon={<Check className="h-4 w-4" />}
                          >
                            Mark as read
                          </Button>
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