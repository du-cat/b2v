/*
  # Create notifications table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `user_id` (uuid, indexed, not null)
      - `title` (text, not null)
      - `message` (text, optional)
      - `created_at` (timestamp, default now())

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for users to insert their own notifications
    - Add policy for users to select their own notifications

  3. Indexes
    - Add index on `user_id` for efficient user-specific queries
    - Add index on `created_at` for chronological ordering
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to insert their own notifications
CREATE POLICY "Users can insert their own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to select their own notifications
CREATE POLICY "Users can select their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Add comment to document the table
COMMENT ON TABLE notifications IS 'User notifications with RLS enabled. Users can only access their own notifications (user_id = auth.uid())';