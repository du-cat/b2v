/*
  # Create notifications system

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `message` (text)
      - `type` (text)
      - `severity` (text, enum: info, warning, critical)
      - `store_id` (uuid, foreign key to stores, nullable)
      - `is_read` (boolean, default false)
      - `created_at` (timestamp, default now())

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for users to read their own notifications
    - Add policies for system to insert notifications

  3. Triggers
    - Auto-create notifications when alerts are inserted
*/

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
  event_type text;
  event_severity text;
  event_payload jsonb;
  store_name text;
  store_id uuid;
  notification_message text;
  notification_type text;
  notification_severity text;
BEGIN
  -- Get the store owner and event details
  -- FIXED: Split the SELECT INTO to separate scalar and record variables
  SELECT s.owner_id INTO owner_id
  FROM events e
  JOIN stores s ON e.store_id = s.id
  WHERE e.id = NEW.event_id;
  
  -- Get the event details separately
  SELECT 
    e.event_type, 
    e.severity, 
    e.payload, 
    s.name, 
    e.store_id
  INTO 
    event_type, 
    event_severity, 
    event_payload, 
    store_name, 
    store_id
  FROM events e
  JOIN stores s ON e.store_id = s.id
  WHERE e.id = NEW.event_id;
  
  -- Create notification message based on event
  notification_message := CASE 
    WHEN event_severity = 'suspicious' THEN '🚨 Security Alert: '
    WHEN event_severity = 'warn' THEN '⚠️ Warning: '
    ELSE 'ℹ️ Information: '
  END || COALESCE(
    event_payload->>'description',
    'Event detected: ' || event_type || ' at ' || store_name
  );
  
  -- Set notification type
  notification_type := 'event_alert';
  
  -- Map event severity to notification severity
  notification_severity := CASE 
    WHEN event_severity = 'suspicious' THEN 'critical'
    WHEN event_severity = 'warn' THEN 'warning'
    ELSE 'info'
  END;
  
  -- Insert notification
  INSERT INTO notifications (user_id, message, type, severity, store_id)
  VALUES (owner_id, notification_message, notification_type, notification_severity, store_id);
  
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
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);