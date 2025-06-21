import { useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import { Button } from './Button';
import { useAuthStore } from '@/features/auth/store/AuthStore';
import { useNotificationStore } from '@/features/notifications/store/NotificationStore';
import toast from 'react-hot-toast';

export function TestNotificationButton() {
  const [isCreating, setIsCreating] = useState(false);
  const user = useAuthStore(state => state.user);
  const createNotification = useNotificationStore(state => state.createNotification);
  
  const handleCreateTestNotification = async () => {
    if (!user) {
      toast.error('You must be logged in to create a notification');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const severities: ('info' | 'warning' | 'critical')[] = ['info', 'warning', 'critical'];
      const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
      
      const messages = {
        info: [
          'System update completed successfully.',
          'Daily backup completed for all systems.',
          'New feature available: Event simulation.',
        ],
        warning: [
          'Multiple failed login attempts detected.',
          'Unusual discount pattern observed on register 2.',
          'After hours access detected at main entrance.',
        ],
        critical: [
          'Suspicious transaction detected: $1,247.00 void without manager approval.',
          'Security breach attempt detected from IP 192.168.1.45.',
          'Cash drawer opened without transaction on register 3.',
        ]
      };
      
      const randomMessage = messages[randomSeverity][Math.floor(Math.random() * messages[randomSeverity].length)];
      
      await createNotification({
        user_id: user.id,
        message: randomMessage,
        type: 'test',
        severity: randomSeverity
      });
      
      toast.success('Test notification created');
    } catch (error) {
      console.error('Failed to create test notification:', error);
      toast.error('Failed to create notification');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCreateTestNotification}
      isLoading={isCreating}
      leftIcon={isCreating ? undefined : <Plus className="h-4 w-4" />}
      className="text-sm"
    >
      {isCreating ? 'Creating...' : 'Test Notification'}
    </Button>
  );
}