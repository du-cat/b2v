-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'event_alert',
  severity text CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Create comprehensive policies
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_severity ON notifications(severity);

-- Insert test notifications for the current user
INSERT INTO notifications (user_id, message, type, severity, is_read)
SELECT 
  auth.uid(),
  'Welcome to SentinelPOS Guardian! Your security monitoring system is now active.',
  'welcome',
  'info',
  false
WHERE 
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = auth.uid() 
    AND message = 'Welcome to SentinelPOS Guardian! Your security monitoring system is now active.'
  )
ON CONFLICT DO NOTHING;

-- Insert a test warning notification
INSERT INTO notifications (user_id, message, type, severity, is_read)
SELECT 
  auth.uid(),
  'Your store has 3 security events that require attention.',
  'alert',
  'warning',
  false
WHERE 
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = auth.uid() 
    AND message = 'Your store has 3 security events that require attention.'
  )
ON CONFLICT DO NOTHING;

-- Insert a test critical notification
INSERT INTO notifications (user_id, message, type, severity, is_read)
SELECT 
  auth.uid(),
  'Suspicious login attempt detected from unknown location.',
  'security',
  'critical',
  false
WHERE 
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = auth.uid() 
    AND message = 'Suspicious login attempt detected from unknown location.'
  )
ON CONFLICT DO NOTHING;