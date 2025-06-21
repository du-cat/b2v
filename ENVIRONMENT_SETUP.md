# Environment Setup Guide

## 🚨 **CRITICAL: Replace Placeholder Values**

Your `.env` file currently contains placeholder values that need to be replaced with your actual Supabase credentials.

## 📋 **Required Steps**

### 1. Get Your Supabase Credentials

1. **Go to Supabase Dashboard**: https://app.supabase.com/
2. **Select Your Project** (or create a new one)
3. **Navigate to Settings → API**
4. **Copy the following values**:
   - **Project URL** (starts with `https://`)
   - **Anon/Public Key** (starts with `ey`)

### 2. Update Your .env File

Replace the placeholder values in your `.env` file:

```env
# BEFORE (Placeholder values - WILL NOT WORK)
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# AFTER (Your actual credentials)
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-key
```

### 3. Verify Environment Variables

The app includes automatic environment validation. After updating your `.env` file:

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Check the browser console** for validation messages:
   - ✅ `Environment validation passed` - You're good to go!
   - ❌ `Environment validation failed` - Check your credentials

3. **Use the built-in diagnostics**:
   - Navigate to `/rls-diagnostics` in your app
   - Run "Check Environment" test
   - This will validate your Supabase configuration

## 🔧 **Environment Variable Validation**

Your app automatically validates environment variables on startup:

```typescript
// This happens automatically in src/lib/envCheck.ts
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Check for placeholder values
  if (supabaseUrl?.includes('your-project-id') || supabaseUrl?.includes('placeholder')) {
    errors.push('VITE_SUPABASE_URL contains placeholder values');
  }
  
  if (supabaseKey?.includes('your-anon-key') || supabaseKey?.includes('placeholder')) {
    errors.push('VITE_SUPABASE_ANON_KEY contains placeholder values');
  }
  
  return { isValid: errors.length === 0, errors };
}
```

## 🛡️ **Supabase Client Configuration**

Your Supabase client is configured in `src/lib/supabase.ts` and automatically:

1. **Validates environment variables** before creating the client
2. **Provides safe fallbacks** if configuration is invalid
3. **Logs detailed status** for debugging

```typescript
// This is already configured in your app
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);
```

## 🔍 **Troubleshooting**

### Issue: "Supabase not configured" errors
**Solution**: Replace placeholder values in `.env` with actual credentials

### Issue: "Failed to fetch" errors
**Solution**: 
1. Verify your Supabase URL is correct
2. Check that your anon key is valid
3. Ensure your project is not paused in Supabase

### Issue: Environment validation fails
**Solution**: 
1. Check `.env` file exists in project root
2. Verify no typos in variable names
3. Ensure values don't contain placeholder text

## 📱 **Testing Your Setup**

After updating your credentials:

1. **Restart the dev server**: `npm run dev`
2. **Check browser console** for validation messages
3. **Navigate to `/rls-diagnostics`** and run tests
4. **Try logging in** with test credentials

## 🔐 **Security Notes**

- **Never commit** your actual `.env` file to version control
- **Use different credentials** for development and production
- **Rotate keys regularly** for security
- **Restrict API access** in Supabase dashboard settings

## ✅ **Success Indicators**

You'll know your setup is correct when:
- ✅ No "Supabase not configured" errors in console
- ✅ Environment validation passes
- ✅ RLS diagnostics show green checkmarks
- ✅ You can successfully log in/sign up
- ✅ Store creation works without errors

---

**Need help?** Check the RLS Diagnostics page (`/rls-diagnostics`) for detailed system health checks and troubleshooting guidance.