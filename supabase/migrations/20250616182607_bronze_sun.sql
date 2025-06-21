/*
  # Create notifications table with proper schema

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `user_id` (uuid, references auth.users, not null)
      - `message` (text, not null)
      - `type` (text, optional, default 'general')
      - `severity` (text, not null, default 'info', check constraint)
      - `is_read` (boolean, default false)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for users to read their own notifications
    - Add policy for users to insert their own notifications
    - Add policy for users to update their own notifications (for marking as read)

  3. Indexes
    - Add index on `user_id` for efficient user-specific queries
    - Add index on `created_at` for chronological ordering
    - Add composite index on `user_id` and `is_read` for unread queries
*/

-- Drop table if it exists (to handle any existing incomplete table)
DROP TABLE IF EXISTS notifications;

-- Create notifications table with proper schema
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text DEFAULT 'general',
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own notifications
CREATE POLICY "Users can insert their own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Add comment to document the table
COMMENT ON TABLE notifications IS 'User notifications with RLS enabled. Users can only access their own notifications (user_id = auth.uid())';