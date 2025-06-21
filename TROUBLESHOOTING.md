# Supabase "Failed to Fetch" Troubleshooting Guide

## 🚨 Common Error Messages

### "Failed to fetch"
- **Cause**: Network connectivity issues, CORS problems, or invalid Supabase configuration
- **Solution**: Run RLS Diagnostics (`/rls-diagnostics`) to identify the specific issue

### "Network error: Unable to connect to Supabase"
- **Cause**: Internet connection problems or Supabase service outage
- **Solution**: Check internet connection and Supabase status page

### "CORS error: Please ensure your domain is added to Supabase Auth settings"
- **Cause**: Domain not configured in Supabase Auth settings
- **Solution**: Add your domain to Supabase Auth → URL Configuration

## 🔍 Step-by-Step Debugging

### 1. Check Environment Variables
Navigate to `/rls-diagnostics` and run "Check Environment" test:
- ✅ `VITE_SUPABASE_URL` should start with `https://`
- ✅ `VITE_SUPABASE_ANON_KEY` should start with `ey`
- ❌ If missing, check your `.env` file

### 2. Test Basic Connection
Run "Test Connection" diagnostic:
- Tests DNS resolution
- Verifies SSL certificate
- Checks response times
- Tests auth and database endpoints

### 3. Verify CORS Configuration
In Supabase Dashboard:
1. Go to Authentication → URL Configuration
2. Add your domain to "Site URL"
3. Add your domain to "Redirect URLs"

For localhost development:
- Site URL: `http://localhost:5173`
- Redirect URLs: `http://localhost:5173/**`

For production:
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/**`

### 4. Check Network Issues
Common network problems:
- **Firewall blocking**: Disable firewall temporarily to test
- **VPN interference**: Disconnect VPN and try again
- **Corporate proxy**: May block Supabase requests
- **DNS issues**: Try using different DNS servers (8.8.8.8, 1.1.1.1)

### 5. Browser-Specific Issues
- **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
- **Disable extensions**: Ad blockers may interfere
- **Try incognito mode**: Rules out extension conflicts
- **Check browser console**: Look for detailed error messages

## 🛠️ Quick Fixes

### Fix 1: Environment Variables
Create/update `.env` file in project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Fix 2: CORS Configuration
In Supabase Dashboard → Authentication → URL Configuration:
```
Site URL: http://localhost:5173
Redirect URLs: http://localhost:5173/**
```

### Fix 3: Network Timeout
If requests timeout, check:
- Internet connection stability
- Supabase service status
- Local firewall settings

### Fix 4: Invalid Credentials
Verify in Supabase Dashboard → Settings → API:
- Project URL matches `VITE_SUPABASE_URL`
- Anon key matches `VITE_SUPABASE_ANON_KEY`

## 🔧 Advanced Debugging

### Enable Detailed Logging
The app now includes comprehensive logging. Check browser console for:
- 🌐 Supabase Fetch Request logs
- 📡 Supabase Fetch Response logs
- ❌ Detailed error information

### Manual Connection Test
Test Supabase connection manually:
```javascript
// Open browser console and run:
fetch('https://your-project-id.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
}).then(r => console.log('Status:', r.status))
```

### Check Supabase Status
- Visit [Supabase Status Page](https://status.supabase.com/)
- Check for ongoing incidents or maintenance

## 📞 Getting Help

If diagnostics show all tests passing but login still fails:

1. **Check Browser Console**: Look for detailed error messages
2. **Network Tab**: Inspect actual HTTP requests/responses
3. **Supabase Logs**: Check logs in Supabase Dashboard
4. **Contact Support**: Include diagnostic results and console logs

## 🎯 Prevention

To prevent future issues:
- ✅ Always use HTTPS in production
- ✅ Keep environment variables secure
- ✅ Regularly test connection with diagnostics
- ✅ Monitor Supabase service status
- ✅ Keep dependencies updated