/*
  # Create notifications system

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `body` (text)
      - `severity` (text, enum: info, warning, critical)
      - `read` (boolean, default false)
      - `created_at` (timestamp, default now())

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for users to read their own notifications
    - Add policies for system to insert notifications

  3. Triggers
    - Auto-create notifications when alerts are inserted
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow system to insert notifications (for triggers)
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to get store owner from alert
CREATE OR REPLACE FUNCTION get_store_owner_from_alert(alert_event_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT s.owner_id INTO owner_id
  FROM events e
  JOIN stores s ON e.store_id = s.id
  WHERE e.id = alert_event_id;
  
  RETURN owner_id;
END;
$$;

-- Create function to create notification from alert
CREATE OR REPLACE FUNCTION create_notification_from_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  owner_id uuid;
  event_data record;
  notification_title text;
  notification_body text;
  notification_severity text;
BEGIN
  -- Get the store owner and event details
  SELECT 
    s.owner_id,
    e.event_type,
    e.severity,
    e.payload,
    s.name as store_name
  INTO owner_id, event_data
  FROM events e
  JOIN stores s ON e.store_id = s.id
  WHERE e.id = NEW.event_id;
  
  -- Create notification title and body based on event
  notification_title := CASE 
    WHEN event_data.severity = 'suspicious' THEN '🚨 Security Alert'
    WHEN event_data.severity = 'warn' THEN '⚠️ Warning'
    ELSE 'ℹ️ Information'
  END;
  
  notification_body := COALESCE(
    event_data.payload->>'description',
    'Event detected: ' || event_data.event_type || ' at ' || event_data.store_name
  );
  
  -- Map event severity to notification severity
  notification_severity := CASE 
    WHEN event_data.severity = 'suspicious' THEN 'critical'
    WHEN event_data.severity = 'warn' THEN 'warning'
    ELSE 'info'
  END;
  
  -- Insert notification
  INSERT INTO notifications (user_id, title, body, severity)
  VALUES (owner_id, notification_title, notification_body, notification_severity);
  
  RETURN NEW;
END;
$$;

-- Create trigger on alerts table
DROP TRIGGER IF EXISTS create_notification_on_alert ON alerts;
CREATE TRIGGER create_notification_on_alert
  AFTER INSERT ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_from_alert();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);