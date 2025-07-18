import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from './supabase';
import toast from 'react-hot-toast';

// Firebase config loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get messaging instance
let messaging: any = null;

// Check if the browser supports notifications and service workers
const isSupported = () => {
  return 'Notification' in window && 
         'serviceWorker' in navigator && 
         'PushManager' in window;
};

/**
 * Request permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    if (!isSupported()) {
      console.log('Push notifications are not supported in this browser');
      return null;
    }

    // Initialize messaging if not already done
    if (!messaging) {
      messaging = getMessaging(app);
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    console.log('Notification permission granted');

    // Get registration token
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });

    if (currentToken) {
      console.log('FCM registration token obtained');
      return currentToken;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

/**
 * Save FCM token to Supabase
 */
export const saveDeviceToken = async (userId: string, token: string): Promise<boolean> => {
  try {
    const deviceInfo = {
      name: navigator.userAgent,
      type: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        ? 'mobile' 
        : 'desktop'
    };

    const { error } = await supabase
      .from('device_tokens')
      .upsert({
        user_id: userId,
        token: token,
        device_name: deviceInfo.name.substring(0, 255), // Truncate if too long
        device_type: deviceInfo.type,
        last_used: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'user_id, token',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error saving device token:', error);
      return false;
    }

    console.log('Device token saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving device token:', error);
    return false;
  }
};

/**
 * Initialize push notifications
 */
export const initializePushNotifications = async (userId: string): Promise<boolean> => {
  try {
    if (!isSupported()) {
      console.log('Push notifications are not supported in this browser');
      return false;
    }

    const token = await requestNotificationPermission();
    if (!token) {
      return false;
    }

    // Save token to database
    const saved = await saveDeviceToken(userId, token);
    if (!saved) {
      return false;
    }

    // Set up foreground message handler
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        
        // Show toast notification without using JSX
        toast(
          (t) => {
            // Create elements programmatically instead of using JSX
            const title = payload.notification?.title || 'New Notification';
            const body = payload.notification?.body || '';
            
            return toast.message(
              `${title}\n${body}`,
              {
                icon: getSeverityIcon(payload.data?.severity as string)
              }
            );
          },
          {
            duration: 6000,
            icon: getSeverityIcon(payload.data?.severity as string),
          }
        );
      });
    }

    return true;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return false;
  }
};

/**
 * Get icon based on severity
 */
const getSeverityIcon = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'warning':
      return '⚠️';
    default:
      return 'ℹ️';
  }
};

/**
 * Send a test push notification
 */
export const sendTestPushNotification = async (userId: string): Promise<boolean> => {
  try {
    // Get the user's device tokens
    const { data: deviceTokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (tokensError || !deviceTokens || deviceTokens.length === 0) {
      console.error('No active device tokens found:', tokensError);
      return false;
    }

    // Create a test notification
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message: 'This is a test push notification',
        type: 'test',
        severity: 'info',
        is_read: false
      })
      .select()
      .single();

    if (notificationError || !notification) {
      console.error('Error creating test notification:', notificationError);
      return false;
    }

    // Send push notification for each device token
    const token = deviceTokens[0].token;
    
    // Call the Supabase Edge Function to send the push notification
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        notification_id: notification.id,
        user_id: userId,
        token: token
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      console.error('Error sending push notification:', result.error);
      return false;
    }

    console.log('Test push notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending test push notification:', error);
    return false;
  }
};