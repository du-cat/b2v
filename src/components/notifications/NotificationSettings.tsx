import { useState, useEffect, useRef } from 'react';
import { Bell, Volume2, VolumeX, Smartphone, Mail, MessageSquare, Plus } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/AuthStore';
import { useNotificationStore } from '@/features/notifications/store/NotificationStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { createSoundByType } from '../../utils/soundUtils';
import { PushNotificationSetup } from './PushNotificationSetup';
import toast from 'react-hot-toast';

interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  sound_enabled: boolean;
  sound_type: 'default' | 'chime' | 'alert' | 'none';
  severity_filter: 'all' | 'warning_and_critical' | 'critical_only';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  muted_event_types: string[];
}

const defaultPreferences: NotificationPreferences = {
  email_enabled: true,
  push_enabled: true,
  sms_enabled: false,
  sound_enabled: true,
  sound_type: 'default',
  severity_filter: 'warning_and_critical',
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '06:00',
  muted_event_types: [],
};

const eventTypes = [
  'transaction_anomaly',
  'login_failure',
  'after_hours_access',
  'cash_drawer_open',
  'void_transaction',
  'discount_applied',
  'refund_processed',
];

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [testSound, setTestSound] = useState(false);
  const [creatingMockNotification, setCreatingMockNotification] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  const { user } = useAuthStore();
  const { createNotification } = useNotificationStore();
  
  useEffect(() => {
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem(`notification_prefs_${user?.id}`);
    if (savedPrefs) {
      try {
        const parsedPrefs = JSON.parse(savedPrefs);
        setPreferences({ ...defaultPreferences, ...parsedPrefs });
      } catch (error) {
        console.error('Failed to parse saved preferences:', error);
      }
    }
  }, [user]);

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContext) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          setAudioContext(ctx);
        } catch (error) {
          console.error('Failed to create AudioContext:', error);
        }
      }
    };

    // Add event listeners for user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, initAudioContext, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, initAudioContext);
      });
    };
  }, [audioContext]);
  
  const savePreferences = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Save to localStorage (in a real app, this would be saved to the database)
      localStorage.setItem(`notification_prefs_${user.id}`, JSON.stringify(preferences));
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };
  
  const playTestSound = async () => {
    if (preferences.sound_type === 'none') {
      toast.info('Sound is disabled');
      return;
    }
    
    setTestSound(true);
    
    try {
      // Resume AudioContext if it's suspended (required by browser policies)
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Try to play the selected audio file first
      let audioSrc = '/notification.mp3'; // Default fallback
      
      switch (preferences.sound_type) {
        case 'chime':
          audioSrc = '/sounds/chime.mp3';
          break;
        case 'alert':
          audioSrc = '/sounds/alert.mp3';
          break;
        case 'default':
          audioSrc = '/sounds/default.mp3';
          break;
        default:
          audioSrc = '/notification.mp3';
      }
      
      // Check if the audio file exists
      const checkAudioFile = async (src: string): Promise<boolean> => {
        try {
          const response = await fetch(src, { method: 'HEAD' });
          return response.ok;
        } catch {
          return false;
        }
      };

      const fileExists = await checkAudioFile(audioSrc);
      
      if (fileExists) {
        // Try to play the audio file
        const audio = new Audio(audioSrc);
        audio.volume = 0.7;
        
        // Use a Promise-based approach instead of string evaluation
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            toast.success(`${preferences.sound_type} sound played successfully`);
          }).catch((error) => {
            console.error('Audio play failed:', error);
            // Fallback to generated sound
            if (audioContext) {
              createSoundByType(preferences.sound_type, audioContext);
              toast.success(`${preferences.sound_type} sound played (generated)`);
            } else {
              toast.error('Unable to play sound - browser restrictions');
            }
          });
        }
      } else {
        // File doesn't exist, use Web Audio API
        if (audioContext) {
          createSoundByType(preferences.sound_type, audioContext);
          toast.success(`${preferences.sound_type} sound played (generated)`);
        } else {
          toast.error('Unable to play sound - audio files not found and Web Audio not available');
        }
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      toast.error('Unable to play sound - check browser permissions');
    } finally {
      setTimeout(() => setTestSound(false), 1000);
    }
  };
  
  const createMockNotification = async () => {
    if (!user) return;
    
    setCreatingMockNotification(true);
    try {
      const mockNotifications = [
        {
          message: 'Suspicious transaction detected at register 3 - unusual discount pattern observed',
          severity: 'critical',
        },
        {
          message: 'Multiple failed login attempts detected from terminal POS-001',
          severity: 'warning',
        },
        {
          message: 'Daily backup completed successfully for all systems',
          severity: 'info',
        },
        {
          message: 'After hours access detected in main store - employee badge scan at 11:45 PM',
          severity: 'critical',
        },
        {
          message: 'Cash drawer opened without transaction on register 2',
          severity: 'warning',
        },
        {
          message: 'Large refund processed: $247.50 - requires manager approval',
          severity: 'warning',
        },
        {
          message: 'System maintenance scheduled for tonight at 2:00 AM',
          severity: 'info',
        },
      ];
      
      const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
      
      await createNotification({
        user_id: user.id,
        message: randomNotification.message,
        type: 'test',
        severity: randomNotification.severity as any
      });
      
      toast.success('Mock notification created successfully');
    } catch (error) {
      console.error('Error creating mock notification:', error);
      toast.error('Failed to create mock notification');
    } finally {
      setCreatingMockNotification(false);
    }
  };
  
  const toggleMutedEventType = (eventType: string) => {
    setPreferences(prev => ({
      ...prev,
      muted_event_types: prev.muted_event_types.includes(eventType)
        ? prev.muted_event_types.filter(type => type !== eventType)
        : [...prev.muted_event_types, eventType]
    }));
  };
  
  const soundOptions = [
    { value: 'default', label: 'Default Beep' },
    { value: 'chime', label: 'Pleasant Chime' },
    { value: 'alert', label: 'Urgent Alert' },
    { value: 'none', label: 'Silent' },
  ];
  
  const severityOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'warning_and_critical', label: 'Warning & Critical Only' },
    { value: 'critical_only', label: 'Critical Only' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Notification Settings</h2>
          <p className="text-slate-500">Customize how and when you receive notifications</p>
        </div>
        <Button
          onClick={createMockNotification}
          isLoading={creatingMockNotification}
          leftIcon={<Plus className="h-4 w-4" />}
          variant="outline"
        >
          Create Test Notification
        </Button>
      </div>
      
      {/* Push Notification Setup */}
      <PushNotificationSetup />
      
      {/* Audio Permission Notice */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 text-sm">
            <Volume2 className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-slate-700">Audio Playback Notice</p>
              <p className="text-slate-600 mt-1">
                Different sound types will play unique audio patterns. If audio files are not available, 
                generated sounds will be used instead. Click anywhere on the page first to enable audio if needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Delivery Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-slate-500">Receive alerts via email</p>
              </div>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, email_enabled: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-slate-500">Browser and mobile push notifications</p>
              </div>
            </div>
            <Switch
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, push_enabled: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-slate-500">Text message alerts for critical events</p>
              </div>
            </div>
            <Switch
              checked={preferences.sms_enabled}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, sms_enabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="h-5 w-5 mr-2" />
            Sound Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sound Notifications</p>
              <p className="text-sm text-slate-500">Play sound for new notifications</p>
            </div>
            <Switch
              checked={preferences.sound_enabled}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, sound_enabled: checked }))}
            />
          </div>
          
          {preferences.sound_enabled && (
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Select
                  label="Sound Type"
                  value={preferences.sound_type}
                  onChange={(e) => setPreferences(prev => ({ ...prev, sound_type: e.target.value as any }))}
                  options={soundOptions}
                />
              </div>
              <Button
                variant="outline"
                onClick={playTestSound}
                disabled={testSound || preferences.sound_type === 'none'}
                className="mt-6"
                leftIcon={<Volume2 className="h-4 w-4" />}
              >
                {testSound ? 'Playing...' : 'Test Sound'}
              </Button>
            </div>
          )}
          
          {preferences.sound_enabled && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-medium text-slate-700 mb-1">Sound Descriptions:</p>
              <ul className="space-y-1 text-slate-600">
                <li><strong>Default Beep:</strong> Simple notification tone</li>
                <li><strong>Pleasant Chime:</strong> Melodic three-tone sequence</li>
                <li><strong>Urgent Alert:</strong> Rapid beeping for critical alerts</li>
                <li><strong>Silent:</strong> No sound notifications</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Filtering */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Filtering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Severity Filter"
            value={preferences.severity_filter}
            onChange={(e) => setPreferences(prev => ({ ...prev, severity_filter: e.target.value as any }))}
            options={severityOptions}
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Muted Event Types
            </label>
            <div className="grid grid-cols-2 gap-2">
              {eventTypes.map((eventType) => (
                <button
                  key={eventType}
                  type="button"
                  onClick={() => toggleMutedEventType(eventType)}
                  className={`p-2 text-sm rounded-md border transition-colors ${
                    preferences.muted_event_types.includes(eventType)
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{eventType.replace(/_/g, ' ')}</span>
                    {preferences.muted_event_types.includes(eventType) && (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Quiet Hours</p>
              <p className="text-sm text-slate-500">Reduce notifications during specified hours</p>
            </div>
            <Switch
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, quiet_hours_enabled: checked }))}
            />
          </div>
          
          {preferences.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_start}
                  onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_end}
                  onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={savePreferences}
          isLoading={isLoading}
          className="px-8"
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
}