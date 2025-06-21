/*
  # Fix Row-Level Security for stores table - Complete Solution

  1. Security Updates
    - Drop all existing conflicting policies
    - Create comprehensive RLS policies that work correctly
    - Ensure authenticated users can insert stores where owner_id = auth.uid()
    - Add proper SELECT, UPDATE, and DELETE policies
    - Add debugging functions for troubleshooting

  2. Policy Details
    - INSERT: Allow users to create stores for themselves (owner_id = auth.uid())
    - SELECT: Allow users to read their own stores (owner_id = auth.uid())
    - UPDATE: Allow users to update their own stores (owner_id = auth.uid())
    - DELETE: Allow users to delete their own stores (owner_id = auth.uid())

  3. Debugging Functions
    - test_auth_context(): Test if auth.uid() is working
    - debug_store_creation(): Debug store creation permissions
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

-- Grant necessary permissions for auth functions
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;

-- Create a test function to verify auth.uid() is working
CREATE OR REPLACE FUNCTION test_auth_context()
RETURNS TABLE(
  current_user_id uuid,
  current_role text,
  session_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT 
    auth.uid() as current_user_id,
    current_setting('role', true) as current_role,
    (auth.uid() IS NOT NULL) as session_valid;
END;
$$;

-- Create a helper function to debug store creation issues
CREATE OR REPLACE FUNCTION debug_store_creation(test_owner_id uuid)
RETURNS TABLE(
  auth_uid uuid,
  provided_owner_id uuid,
  ids_match boolean,
  can_insert boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_auth_uid uuid;
  test_result boolean;
  error_msg text;
BEGIN
  -- Get current auth.uid()
  current_auth_uid := auth.uid();
  
  -- Test if we can theoretically insert
  test_result := (current_auth_uid IS NOT NULL AND current_auth_uid = test_owner_id);
  
  -- Determine error message
  IF current_auth_uid IS NULL THEN
    error_msg := 'auth.uid() is NULL - user not authenticated';
  ELSIF current_auth_uid != test_owner_id THEN
    error_msg := 'auth.uid() does not match provided owner_id';
  ELSE
    error_msg := 'No issues detected';
  END IF;
  
  RETURN QUERY SELECT 
    current_auth_uid as auth_uid,
    test_owner_id as provided_owner_id,
    (current_auth_uid = test_owner_id) as ids_match,
    test_result as can_insert,
    error_msg as error_message;
END;
$$;

-- Create comprehensive RLS policies for stores table

-- Policy 1: Allow authenticated users to INSERT stores where they are the owner
CREATE POLICY "stores_insert_own"
  ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = owner_id
  );

-- Policy 2: Allow authenticated users to SELECT their own stores
CREATE POLICY "stores_select_own"
  ON stores
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = owner_id
  );

-- Policy 3: Allow authenticated users to UPDATE their own stores
CREATE POLICY "stores_update_own"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = owner_id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = owner_id
  );

-- Policy 4: Allow authenticated users to DELETE their own stores
CREATE POLICY "stores_delete_own"
  ON stores
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = owner_id
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stores_owner_id_performance ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_created_at_performance ON stores(created_at DESC);

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION test_auth_context() TO authenticated;
GRANT EXECUTE ON FUNCTION debug_store_creation(uuid) TO authenticated;

-- Add comment to document the RLS setup
COMMENT ON TABLE stores IS 'Stores table with comprehensive RLS. Users can only access stores they own (owner_id = auth.uid()). Use debug_store_creation() function to troubleshoot issues.';