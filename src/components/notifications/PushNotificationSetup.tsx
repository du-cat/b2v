import { useState, useEffect } from 'react';
import { Bell, BellOff, AlertCircle, CheckCircle, Smartphone, Info } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/AuthStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Badge } from '../ui/Badge';
import { 
  requestNotificationPermission, 
  saveDeviceToken, 
  initializePushNotifications,
  sendTestPushNotification
} from '../../lib/firebase';
import toast from 'react-hot-toast';

export function PushNotificationSetup() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  
  const { user } = useAuthStore();

  // Check if push notifications are supported and get current permission status
  useEffect(() => {
    const checkPermission = async () => {
      if (!('Notification' in window)) {
        setPermissionStatus('unsupported');
        return;
      }

      setPermissionStatus(Notification.permission);
      
      // Check if push is already enabled in localStorage
      const enabled = localStorage.getItem('pushNotificationsEnabled') === 'true';
      setPushEnabled(enabled);
      
      // If already enabled and permission is granted, initialize
      if (enabled && Notification.permission === 'granted' && user) {
        initializePushNotifications(user.id);
      }
    };

    checkPermission();
  }, [user]);

  const handleRequestPermission = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        const saved = await saveDeviceToken(user.id, token);
        if (saved) {
          setPermissionStatus('granted');
          setPushEnabled(true);
          localStorage.setItem('pushNotificationsEnabled', 'true');
          toast.success('Push notifications enabled successfully');
        } else {
          toast.error('Failed to save device token');
        }
      } else if (Notification.permission === 'denied') {
        setPermissionStatus('denied');
        toast.error('Notification permission denied. Please enable notifications in your browser settings.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePushNotifications = async (enabled: boolean) => {
    if (!user) return;
    
    if (enabled) {
      // Enable push notifications
      handleRequestPermission();
    } else {
      // Disable push notifications
      setPushEnabled(false);
      localStorage.setItem('pushNotificationsEnabled', 'false');
      toast.success('Push notifications disabled');
    }
  };

  const handleTestNotification = async () => {
    if (!user) return;
    
    setIsTestingNotification(true);
    try {
      const success = await sendTestPushNotification(user.id);
      if (success) {
        toast.success('Test notification sent successfully');
      } else {
        toast.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setIsTestingNotification(false);
    }
  };

  const getPermissionStatusInfo = () => {
    switch (permissionStatus) {
      case 'granted':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          title: 'Notifications Allowed',
          description: 'You will receive push notifications when important events occur.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'denied':
        return {
          icon: <BellOff className="h-5 w-5 text-red-500" />,
          title: 'Notifications Blocked',
          description: 'Please enable notifications in your browser settings to receive alerts.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'default':
        return {
          icon: <Bell className="h-5 w-5 text-amber-500" />,
          title: 'Notifications Not Set Up',
          description: 'Enable push notifications to stay informed about security events.',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
      case 'unsupported':
        return {
          icon: <AlertCircle className="h-5 w-5 text-slate-500" />,
          title: 'Notifications Not Supported',
          description: 'Your browser does not support push notifications.',
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200'
        };
      default:
        return {
          icon: <Info className="h-5 w-5 text-blue-500" />,
          title: 'Checking Notification Status',
          description: 'Please wait while we check your notification settings.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
    }
  };

  const statusInfo = getPermissionStatusInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Banner */}
        <div className={`p-4 rounded-lg border ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
          <div className="flex items-start space-x-3">
            {statusInfo.icon}
            <div>
              <h3 className={`font-medium ${statusInfo.color}`}>{statusInfo.title}</h3>
              <p className="text-sm mt-1">{statusInfo.description}</p>
              
              {permissionStatus === 'denied' && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  <p className="font-medium">How to enable notifications:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Click the lock/info icon in your browser's address bar</li>
                    <li>Find "Notifications" in the site settings</li>
                    <li>Change the setting from "Block" to "Allow"</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Push Notifications</p>
            <p className="text-sm text-slate-500">
              Receive alerts even when the app is closed
            </p>
          </div>
          <Switch
            checked={pushEnabled}
            onCheckedChange={handleTogglePushNotifications}
            disabled={isLoading || permissionStatus === 'unsupported'}
          />
        </div>

        {/* Device Information */}
        {permissionStatus === 'granted' && (
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Smartphone className="h-5 w-5 text-slate-500" />
              <h3 className="font-medium text-slate-700">Current Device</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Device Type:</span>
                <Badge variant="outline">
                  {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                    ? 'Mobile' 
                    : 'Desktop'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Browser:</span>
                <span className="text-slate-800">
                  {navigator.userAgent.match(/(chrome|safari|firefox|msie|trident|edg|opera)/i)?.[0] || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Status:</span>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Notification Button */}
        {permissionStatus === 'granted' && (
          <Button
            onClick={handleTestNotification}
            isLoading={isTestingNotification}
            disabled={isTestingNotification || !pushEnabled}
            className="w-full"
          >
            Send Test Notification
          </Button>
        )}

        {/* Request Permission Button */}
        {permissionStatus === 'default' && (
          <Button
            onClick={handleRequestPermission}
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            Enable Push Notifications
          </Button>
        )}

        {/* Information Note */}
        <div className="text-xs text-slate-500">
          <p className="font-medium mb-1">About Push Notifications:</p>
          <ul className="space-y-1">
            <li>• Receive alerts for security events even when the app is closed</li>
            <li>• Notifications are sent securely through Firebase Cloud Messaging</li>
            <li>• You can disable notifications at any time</li>
            <li>• Your device token is stored securely in our database</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}