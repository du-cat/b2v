/*
  # Fix Row-Level Security for stores table

  1. Security Updates
    - Add proper RLS policy for store creation
    - Allow authenticated users to insert stores where owner_id = auth.uid()
    - Ensure existing policies work correctly

  2. Policies
    - "Users can create stores for themselves" - INSERT policy
    - "Users can read their own stores" - SELECT policy  
    - "Users can update their own stores" - UPDATE policy
*/

-- Enable RLS on stores table (if not already enabled)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can create stores for themselves" ON stores;
DROP POLICY IF EXISTS "Users can read their own stores" ON stores;
DROP POLICY IF EXISTS "Users can update their own stores" ON stores;

-- Create INSERT policy for authenticated users to create stores
CREATE POLICY "Users can create stores for themselves"
  ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Create SELECT policy for users to read their own stores
CREATE POLICY "Users can read their own stores"
  ON stores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create UPDATE policy for users to update their own stores
CREATE POLICY "Users can update their own stores"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Create index for better performance on owner_id lookups
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);

-- Verify the policies are working by checking the current user can access stores
-- This is a comment for verification - the policies should now allow:
-- 1. INSERT: Users can create stores where owner_id = their auth.uid()
-- 2. SELECT: Users can read stores where owner_id = their auth.uid()  
-- 3. UPDATE: Users can update stores where owner_id = their auth.uid()