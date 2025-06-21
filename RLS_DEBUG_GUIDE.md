# RLS Debugging Guide

## 🚨 Current Issue
User getting: "new row violates row-level security policy for table 'stores'"

## 🔍 Step 1: Run RLS Diagnostics
1. Navigate to `/rls-diagnostics` in your app
2. Click "Run All Diagnostics" 
3. Look for any failed tests, especially:
   - **Auth Context Test** - Verifies `auth.uid()` is working
   - **Store Creation Debug** - Tests RLS policy compliance
   - **Stores INSERT Policy** - Tests actual store creation

## 🔍 Step 2: Check Specific Tests
If any tests fail, run these individual tests:

### Test Auth Context
```sql
SELECT * FROM test_auth_context();
```
Expected result: Should return your user ID, role, and session_valid = true

### Test Store Creation Debug
```sql
SELECT * FROM debug_store_creation('YOUR_USER_ID_HERE');
```
Expected result: can_insert = true, error_message = 'No issues detected'

### Manual RLS Test
```sql
-- This should work if RLS is properly configured
INSERT INTO stores (owner_id, name, location, timezone) 
VALUES (auth.uid(), 'Test Store', 'Test Location', 'America/New_York');
```

## 🔍 Step 3: Common Issues & Solutions

### Issue 1: auth.uid() returns NULL
**Symptoms:** Auth Context Test fails
**Solution:** User not properly authenticated
- Check if user is logged in
- Verify session is valid
- Try logging out and back in

### Issue 2: RLS Policy Not Applied
**Symptoms:** Policy Coverage Check fails
**Solution:** RLS policies missing or incorrect
- Check if all policies exist: INSERT, SELECT, UPDATE, DELETE
- Verify policy conditions match `auth.uid() = owner_id`

### Issue 3: Session Mismatch
**Symptoms:** Store Creation Debug shows ID mismatch
**Solution:** Session/user ID inconsistency
- Clear browser storage
- Log out and back in
- Check for multiple browser tabs

### Issue 4: Database Permissions
**Symptoms:** Permission denied errors
**Solution:** Database role/permission issues
- Verify user has `authenticated` role
- Check if RLS is enabled on stores table
- Ensure auth schema permissions are granted

## 🔍 Step 4: Manual Verification

If diagnostics pass but store creation still fails, check:

1. **Browser Console Logs** - Look for detailed error messages
2. **Network Tab** - Check the actual request/response
3. **Supabase Dashboard** - Verify RLS policies in the dashboard
4. **Database Logs** - Check Supabase logs for detailed errors

## 🔍 Step 5: Emergency Fixes

If all else fails, try these emergency fixes:

### Temporarily Disable RLS (NOT RECOMMENDED FOR PRODUCTION)
```sql
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
```

### Recreate RLS Policies
```sql
-- Drop all policies
DROP POLICY IF EXISTS "stores_insert_own" ON stores;
DROP POLICY IF EXISTS "stores_select_own" ON stores;
DROP POLICY IF EXISTS "stores_update_own" ON stores;
DROP POLICY IF EXISTS "stores_delete_own" ON stores;

-- Recreate with simpler conditions
CREATE POLICY "stores_insert_own" ON stores
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "stores_select_own" ON stores
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);
```

## 📊 Expected Diagnostic Results

All tests should show:
- ✅ Auth Context Test: `session_valid = true`, `current_user_id = your_user_id`
- ✅ Session Validation: Valid session with correct user ID
- ✅ Store Creation Debug: `can_insert = true`, `ids_match = true`
- ✅ Stores INSERT Policy: Test store created and cleaned up successfully
- ✅ All other tests: Passed

If any test fails, the error message will guide you to the specific issue.