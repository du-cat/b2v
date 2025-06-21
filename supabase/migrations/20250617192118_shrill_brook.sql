-- Create a simple heartbeat function that always returns true
-- This function is used to test if the Supabase connection is working
-- It's always publicly accessible and immune to RLS/ACL issues

create or replace function public.heartbeat() 
returns boolean
language sql stable 
security definer
as $$ 
  select true; 
$$;

-- Grant execute permission to anon and authenticated roles
grant execute on function public.heartbeat() to anon, authenticated;

-- Add comment to document the function
comment on function public.heartbeat() is 'Simple heartbeat function to test Supabase connection. Always returns true and is accessible to all roles.';