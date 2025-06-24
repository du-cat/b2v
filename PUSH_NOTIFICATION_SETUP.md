# Push Notification Setup Guide

## 🚀 Overview

This guide walks you through setting up Firebase Cloud Messaging (FCM) for push notifications in SentinelPOS Guardian.

## 📋 Prerequisites

- Firebase account (free tier is sufficient)
- Supabase project (already set up)
- Basic understanding of Firebase Cloud Messaging

## 🔧 Step-by-Step Setup

### Step 1: Create a Firebase Project

1. **Go to Firebase Console**:
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create New Project**:
   - Click "Add project"
   - Enter project name: `sentinelpos-guardian`
   - Follow the setup wizard (you can disable Google Analytics if not needed)
   - Click "Create project"

### Step 2: Add a Web App to Your Firebase Project

1. **Register Web App**:
   - From the project overview, click the web icon (</>) to add a web app
   - Register app with nickname: "SentinelPOS Guardian Web"
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Copy Firebase Config**:
   - Save the Firebase configuration object shown
   - You'll need these values for your `.env` file

### Step 3: Set Up Cloud Messaging

1. **Navigate to Cloud Messaging**:
   - In Firebase Console, go to "Engage" → "Messaging"
   - Click "Get started"

2. **Generate Web Push Certificates**:
   - Go to "Project settings" → "Cloud Messaging" tab
   - Under "Web configuration" section, click "Generate key pair"
   - Copy the generated "Web Push certificate" (VAPID key)

### Step 4: Create a Firebase Service Account

1. **Generate Service Account Key**:
   - Go to "Project settings" → "Service accounts" tab
   - Click "Generate new private key"
   - Save the JSON file securely

2. **Add to Supabase Secrets**:
   - In Supabase Dashboard, go to "Settings" → "API"
   - Under "Project API keys", find your service role key
   - Go to "Edge Functions" → "Secrets"
   - Add a new secret named `FIREBASE_SERVICE_ACCOUNT`
   - Paste the entire JSON content of your service account key file

### Step 5: Update Environment Variables

Add these variables to your `.env` file:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

### Step 6: Update Service Worker

1. **Edit the Service Worker File**:
   - Open `public/firebase-messaging-sw.js`
   - Replace the placeholder Firebase config with your actual config

```javascript
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
  measurementId: 'YOUR_MEASUREMENT_ID'
});
```

### Step 7: Deploy the Edge Function

The Edge Function for sending push notifications is already created in your project. You just need to deploy it:

1. **Deploy the Edge Function**:
   - In Supabase Dashboard, go to "Edge Functions"
   - Find the "push-notifications" function
   - Click "Deploy"

## 🧪 Testing Push Notifications

1. **Enable Push Notifications**:
   - Go to "Settings" → "Notifications"
   - Toggle on "Push Notifications"
   - Grant permission when prompted

2. **Send a Test Notification**:
   - Click "Send Test Notification" button
   - You should receive a push notification

3. **Test Background Notifications**:
   - Close the app or browser tab
   - Create a test notification from another device/browser
   - You should receive a push notification on your device

## 🔍 Troubleshooting

### Common Issues

#### "Notification permission denied"
- **Cause**: User denied notification permission
- **Solution**: Reset permissions in browser settings

#### "Failed to register service worker"
- **Cause**: Service worker registration failed
- **Solution**: Check if service worker file is accessible and properly configured

#### "Error sending push notification"
- **Cause**: Firebase configuration issue or network problem
- **Solution**: Verify Firebase credentials and check network connection

### Debug Steps

1. **Check Browser Console**:
   - Look for errors related to Firebase or service worker

2. **Verify Service Worker Registration**:
   - In browser console, run:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(console.log)
   ```

3. **Test FCM Token Generation**:
   - In browser console, run:
   ```javascript
   firebase.messaging().getToken().then(console.log).catch(console.error)
   ```

## 📱 Browser Compatibility

Push notifications are supported in:
- Chrome (desktop and Android)
- Firefox (desktop and Android)
- Edge (desktop)
- Safari (macOS and iOS with limitations)

## 🔒 Security Best Practices

1. **Never expose your Firebase service account key** in client-side code
2. **Use HTTPS** for all production environments
3. **Validate user identity** before sending notifications
4. **Implement rate limiting** to prevent notification spam
5. **Regularly rotate** your Firebase service account keys

## 📊 Analytics and Monitoring

Firebase provides built-in analytics for push notifications:
- Delivery rates
- Open rates
- Conversion tracking

Access these metrics in Firebase Console under "Engage" → "Messaging" → "Reporting".

---

🎉 **Congratulations!** You've successfully set up push notifications for SentinelPOS Guardian. Your users will now receive important security alerts even when the app is closed.