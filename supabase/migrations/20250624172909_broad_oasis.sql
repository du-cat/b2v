/*
  # Add Push Notification Support

  1. Updates to Tables
    - Add `push_sent` column to notifications table
    - Add `device_tokens` table for storing FCM tokens

  2. Security
    - Enable RLS on device_tokens table
    - Add policies for users to manage their own device tokens

  3. Triggers
    - Create trigger to send push notifications for new alerts
*/

-- Add push_sent column to notifications table if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS push_sent BOOLEAN DEFAULT false;

-- Create device_tokens table for storing FCM tokens
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, token)
);

-- Enable RLS on device_tokens table
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for device_tokens table
CREATE POLICY "Users can manage their own device tokens"
  ON device_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_notifications_push_sent ON notifications(user_id, push_sent) WHERE push_sent = false;

-- Create function to queue push notifications
CREATE OR REPLACE FUNCTION queue_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set push_sent to false for new notifications
  NEW.push_sent := false;
  RETURN NEW;
END;
$$;

-- Create trigger to queue push notifications for new notifications
DROP TRIGGER IF EXISTS queue_push_notification_trigger ON notifications;
CREATE TRIGGER queue_push_notification_trigger
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION queue_push_notification();

-- Add comment to document the tables
COMMENT ON TABLE device_tokens IS 'Stores FCM tokens for push notifications with RLS enabled. Users can only access their own tokens.';
COMMENT ON TABLE notifications IS 'User notifications with push notification support. The push_sent column tracks whether a push notification has been sent.';