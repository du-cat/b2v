/*
  # Create integration tables

  1. New Tables
    - `store_integrations` - Stores integration configurations and credentials
    - `integration_logs` - Logs integration events and errors

  2. Security
    - Enable RLS on both tables
    - Add policies for users to access their own store integrations
*/

-- Create store_integrations table
CREATE TABLE IF NOT EXISTS store_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text CHECK (status IN ('connected','error','disconnected','pending')) DEFAULT 'disconnected',
  credentials_encrypted text,
  config jsonb,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, provider)
);

-- Create integration_logs table
CREATE TABLE IF NOT EXISTS integration_logs (
  id bigserial PRIMARY KEY,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  provider text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  level text CHECK (level IN ('info','warn','error')) NOT NULL,
  message text NOT NULL,
  details jsonb
);

-- Enable RLS on store_integrations
ALTER TABLE store_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for store_integrations
CREATE POLICY "Users can manage their own store integrations"
  ON store_integrations
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

-- Enable RLS on integration_logs
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for integration_logs
CREATE POLICY "Users can view logs for their own stores"
  ON integration_logs
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_store_integrations_store_id ON store_integrations(store_id);
CREATE INDEX idx_store_integrations_provider ON store_integrations(provider);
CREATE INDEX idx_store_integrations_status ON store_integrations(status);
CREATE INDEX idx_integration_logs_store_id ON integration_logs(store_id);
CREATE INDEX idx_integration_logs_provider ON integration_logs(provider);
CREATE INDEX idx_integration_logs_timestamp ON integration_logs(timestamp DESC);
CREATE INDEX idx_integration_logs_level ON integration_logs(level);

-- Add comment to document the tables
COMMENT ON TABLE store_integrations IS 'Stores integration configurations and encrypted credentials for POS and back-office systems';
COMMENT ON TABLE integration_logs IS 'Logs integration events, errors, and activities for auditing and troubleshooting';