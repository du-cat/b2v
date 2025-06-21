/*
  # Fix Row-Level Security for stores table

  1. Security Updates
    - Drop and recreate RLS policies for stores table
    - Ensure authenticated users can insert stores where owner_id = auth.uid()
    - Add proper SELECT, UPDATE, and DELETE policies
    - Add indexes for performance

  2. Policy Details
    - INSERT: Allow users to create stores for themselves
    - SELECT: Allow users to read their own stores
    - UPDATE: Allow users to update their own stores
    - DELETE: Allow users to delete their own stores (optional)
*/

-- Ensure RLS is enabled on stores table
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can create stores for themselves" ON stores;
DROP POLICY IF EXISTS "Users can read their own stores" ON stores;
DROP POLICY IF EXISTS "Users can update their own stores" ON stores;
DROP POLICY IF EXISTS "Users can delete their own stores" ON stores;
DROP POLICY IF EXISTS "Allow store inserts for owner" ON stores;
DROP POLICY IF EXISTS "Allow store reads for owner" ON stores;
DROP POLICY IF EXISTS "Allow store updates for owner" ON stores;

-- Create comprehensive RLS policies for stores table

-- Policy 1: Allow authenticated users to INSERT stores where they are the owner
CREATE POLICY "authenticated_users_can_insert_own_stores"
  ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Policy 2: Allow authenticated users to SELECT their own stores
CREATE POLICY "authenticated_users_can_select_own_stores"
  ON stores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Policy 3: Allow authenticated users to UPDATE their own stores
CREATE POLICY "authenticated_users_can_update_own_stores"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy 4: Allow authenticated users to DELETE their own stores (optional)
CREATE POLICY "authenticated_users_can_delete_own_stores"
  ON stores
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stores_owner_id_created ON stores(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);

-- Verify the auth.uid() function is working by creating a test function
CREATE OR REPLACE FUNCTION test_auth_uid()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;

-- Add a comment to document the RLS setup
COMMENT ON TABLE stores IS 'Stores table with RLS enabled. Users can only access stores they own (owner_id = auth.uid())';