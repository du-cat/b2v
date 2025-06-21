/*
  # Fix Row-Level Security for stores table

  1. Security Updates
    - Drop and recreate RLS policies for stores table
    - Simplify policy conditions to ensure they work correctly
    - Add explicit debugging functions

  2. Policy Details
    - INSERT: Allow users to create stores for themselves
    - SELECT: Allow users to read their own stores
    - UPDATE: Allow users to update their own stores
    - DELETE: Allow users to delete their own stores
*/

-- Ensure RLS is enabled on stores table
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start completely fresh
DO $$ 
DECLARE
    policy_name text;
BEGIN
    -- Get all policy names for stores table and drop them
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'stores' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON stores', policy_name);
    END LOOP;
END $$;

-- Create simplified RLS policies for stores table with clearer names

-- Policy 1: Allow authenticated users to INSERT stores where they are the owner
CREATE POLICY "stores_insert_policy"
  ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Policy 2: Allow authenticated users to SELECT their own stores
CREATE POLICY "stores_select_policy"
  ON stores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Policy 3: Allow authenticated users to UPDATE their own stores
CREATE POLICY "stores_update_policy"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Policy 4: Allow authenticated users to DELETE their own stores
CREATE POLICY "stores_delete_policy"
  ON stores
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create a simple test function to verify auth.uid() is working
CREATE OR REPLACE FUNCTION test_auth_uid()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION test_auth_uid() TO authenticated, anon;

-- Add comment to document the RLS setup
COMMENT ON TABLE stores IS 'Stores table with RLS enabled. Users can only access stores they own (owner_id = auth.uid())';