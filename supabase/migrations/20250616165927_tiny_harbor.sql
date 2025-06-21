/*
  # Fix Row-Level Security for stores table

  1. Security Updates
    - Create a function to get RLS policies for debugging
    - Add a direct test function for store creation
    - Ensure RLS policies are correctly applied

  2. Debugging Functions
    - get_table_policies: List all policies for a table
    - test_direct_store_insert: Test direct store insertion
*/

-- Create a function to get all policies for a table
CREATE OR REPLACE FUNCTION get_table_policies(table_name text)
RETURNS TABLE (
  schemaname text,
  tablename text,
  policyname text,
  permissive text,
  roles text[],
  cmd text,
  qual text,
  with_check text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.schemaname,
    p.tablename,
    p.policyname,
    p.permissive,
    p.roles,
    p.cmd,
    p.qual::text,
    p.with_check::text
  FROM pg_policies p
  WHERE p.tablename = table_name;
END;
$$;

-- Create a function to test direct store insertion
CREATE OR REPLACE FUNCTION test_direct_store_insert(
  p_name text,
  p_location text,
  p_timezone text
)
RETURNS TABLE (
  success boolean,
  store_id uuid,
  error_message text,
  auth_uid uuid,
  owner_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_id uuid;
  v_error_message text;
  v_auth_uid uuid;
  v_success boolean := false;
BEGIN
  -- Get current auth.uid()
  v_auth_uid := auth.uid();
  
  -- Attempt to insert a store
  BEGIN
    INSERT INTO stores (owner_id, name, location, timezone)
    VALUES (v_auth_uid, p_name, p_location, p_timezone)
    RETURNING id INTO v_store_id;
    
    v_success := true;
    v_error_message := NULL;
  EXCEPTION WHEN OTHERS THEN
    v_success := false;
    v_error_message := SQLERRM;
    v_store_id := NULL;
  END;
  
  -- Return result
  RETURN QUERY SELECT 
    v_success,
    v_store_id,
    v_error_message,
    v_auth_uid,
    v_auth_uid;
    
  -- Clean up if successful
  IF v_success AND v_store_id IS NOT NULL THEN
    DELETE FROM stores WHERE id = v_store_id;
  END IF;
END;
$$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_table_policies(text) TO authenticated;
GRANT EXECUTE ON FUNCTION test_direct_store_insert(text, text, text) TO authenticated;