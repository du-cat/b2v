/*
  # Update devices and reports tables

  1. Updates to Tables
    - Update `devices` table to include name and last_ping
    - Ensure `weekly_reports` table has proper structure
    - Add indexes for performance

  2. Security
    - Enable RLS on updated tables
    - Add proper policies for CRUD operations

  3. Sample Data
    - Add some sample data for testing
*/

-- Update devices table to include name and last_ping if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'name'
  ) THEN
    ALTER TABLE devices ADD COLUMN name text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'last_ping'
  ) THEN
    ALTER TABLE devices ADD COLUMN last_ping timestamptz;
  END IF;
END $$;

-- Update devices table constraints
ALTER TABLE devices ALTER COLUMN name SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_store_id ON devices(store_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_ping ON devices(last_ping DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_store_id ON weekly_reports(store_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_period ON weekly_reports(period_start, period_end);

-- Enable RLS on devices if not already enabled
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Create policies for devices
DROP POLICY IF EXISTS "Users can manage devices in their stores" ON devices;
CREATE POLICY "Users can manage devices in their stores"
  ON devices
  FOR ALL
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Enable RLS on weekly_reports if not already enabled
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for weekly_reports
DROP POLICY IF EXISTS "Users can view reports for their stores" ON weekly_reports;
CREATE POLICY "Users can view reports for their stores"
  ON weekly_reports
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Function to generate sample weekly reports
CREATE OR REPLACE FUNCTION generate_sample_reports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  store_record record;
  week_start date;
  week_end date;
BEGIN
  -- Generate reports for the last 4 weeks for each store
  FOR store_record IN SELECT id FROM stores LOOP
    FOR i IN 0..3 LOOP
      week_start := date_trunc('week', CURRENT_DATE - (i * 7));
      week_end := week_start + interval '6 days';
      
      INSERT INTO weekly_reports (store_id, period_start, period_end, dispatched)
      VALUES (
        store_record.id,
        week_start,
        week_end,
        i > 0 -- Mark older reports as dispatched
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

-- Generate sample reports
SELECT generate_sample_reports();