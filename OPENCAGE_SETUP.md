# OpenCage Data API Setup Guide

## 🎯 Overview

This guide walks you through setting up OpenCage Data API for live address autocomplete in SentinelPOS Guardian. OpenCage provides accurate geocoding and reverse geocoding services with a generous free tier.

## 📋 Prerequisites

- Email address for account creation
- Basic understanding of API keys and environment variables

## 🚀 Step-by-Step Setup

### Step 1: Create OpenCage Account

1. **Go to OpenCage Data**:
   - Visit [https://opencagedata.com/](https://opencagedata.com/)
   - Click "Sign Up" in the top right

2. **Create Account**:
   - Enter your email address
   - Choose a password
   - Verify your email address

3. **Access Dashboard**:
   - Log in to your account
   - Navigate to the Dashboard

### Step 2: Get Your API Key

1. **Navigate to API Keys**:
   - In the Dashboard, click "API Keys" in the sidebar
   - You'll see your default API key

2. **Copy Your API Key**:
   - Copy the API key (typically 32 characters, alphanumeric)
   - Keep this secure - don't share it publicly

3. **Optional: Create Additional Keys**:
   - You can create multiple API keys for different projects
   - Click "Add a new API key" if needed

### Step 3: Configure Your Application

1. **Update Environment Variables**:
   ```env
   # Add to your .env file
   VITE_OPENCAGE_API_KEY=your_actual_api_key_here
   ```

2. **Restart Development Server**:
   ```bash
   npm run dev
   ```

3. **Test the Integration**:
   - Go to store setup page
   - Start typing an address
   - You should see live OpenCage suggestions

## 🔧 Configuration Options

### API Key Restrictions

#### For Development
```
Allowed domains:
- localhost:5173
- localhost:3000
- 127.0.0.1:5173
```

#### For Production
```
Allowed domains:
- yourdomain.com
- www.yourdomain.com
```

### Usage Quotas (Cost Control)

OpenCage offers generous free tier limits:
- **Free Tier**: 2,500 requests per day
- **Paid Plans**: Start at $50/month for 10,000 requests/day

## 💰 Pricing Information

### OpenCage Data Pricing (as of 2024)
- **Free Tier**: 2,500 requests/day (no credit card required)
- **Starter**: $50/month for 10,000 requests/day
- **Pro**: $150/month for 100,000 requests/day
- **Enterprise**: Custom pricing for higher volumes

### Cost Optimization Tips
1. **Use Debouncing**: Wait for user to stop typing (already implemented - 300ms)
2. **Limit Results**: Only fetch top 5 results (already implemented)
3. **Cache Results**: Store frequently used addresses locally
4. **Monitor Usage**: Check dashboard regularly for usage patterns

## 🧪 Testing Your Setup

### 1. Check API Key Format
Your API key should:
- Be approximately 32 characters long
- Contain only alphanumeric characters
- Not contain any special characters or spaces

### 2. Test in Application
1. Navigate to store setup page
2. Click in the address field
3. Type "123 main street" 
4. You should see live OpenCage suggestions

### 3. Verify in Browser Console
Look for these log messages:
```
✅ OpenCage API key validated
🔄 Fetching OpenCage suggestions for: 123 main street
✅ OpenCage API returned 5 suggestions
```

### 4. Use Demo Mode for Testing
If you don't have an API key yet, the system automatically falls back to demo mode with realistic mock data.

## 🚨 Troubleshooting

### Common Issues

#### "Invalid API Key Format"
- **Cause**: API key format is incorrect
- **Solution**: Verify you copied the complete key from OpenCage dashboard

#### "API Quota Exceeded"
- **Cause**: Hit daily usage limits
- **Solution**: Upgrade plan or wait until next day

#### "API Key Invalid"
- **Cause**: API key is incorrect or expired
- **Solution**: Generate new API key in OpenCage dashboard

#### "Network Error"
- **Cause**: Network connectivity issues
- **Solution**: Check internet connection and try again

#### "CORS Error"
- **Cause**: Domain not allowed for API key
- **Solution**: Add your domain to API key restrictions in OpenCage dashboard

### Debug Steps

1. **Check Environment Variables**:
   ```bash
   # In browser console
   console.log(import.meta.env.VITE_OPENCAGE_API_KEY)
   ```

2. **Test API Key Manually**:
   ```bash
   curl "https://api.opencagedata.com/geocode/v1/json?q=123+main+street&key=YOUR_API_KEY&limit=1"
   ```

3. **Check Browser Network Tab**:
   - Look for requests to `api.opencagedata.com`
   - Check response status and error messages

## 🔒 Security Best Practices

### 1. Restrict Your API Key
- **Always** set domain restrictions in OpenCage dashboard
- Never use unrestricted API keys in production
- Limit to only required domains

### 2. Monitor Usage
- Set up usage alerts in OpenCage dashboard
- Review usage reports monthly
- Set reasonable quotas to prevent unexpected charges

### 3. Rotate Keys Regularly
- Generate new API keys quarterly
- Delete old unused keys
- Update environment variables when rotating

### 4. Environment Security
- Never commit API keys to version control
- Use different keys for development/production
- Store keys in secure environment variable systems

## 📊 Monitoring & Analytics

### OpenCage Dashboard
- **Usage Statistics**: View daily/monthly request counts
- **Billing**: Monitor costs and usage
- **Quotas**: Track quota usage and limits
- **API Keys**: Manage and rotate keys

### Application Monitoring
- Check browser console for API errors
- Monitor address autocomplete success rates
- Track user experience metrics

## 🆘 Support Resources

### OpenCage Documentation
- [OpenCage API Documentation](https://opencagedata.com/api)
- [API Reference](https://opencagedata.com/api#forward-geocoding)
- [Rate Limits and Quotas](https://opencagedata.com/api#rate-limiting)

### Community Support
- [OpenCage Support](https://opencagedata.com/contact)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/opencage)

### Application Support
- Use `/rls-diagnostics` for system health checks
- Check browser console for detailed error messages
- Review network requests in browser dev tools

---

🎉 **Congratulations!** You now have live address autocomplete powered by OpenCage Data API. Your users will enjoy accurate, real-time address suggestions as they type.