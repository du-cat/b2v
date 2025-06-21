# Google Places API Setup Guide

## 🎯 Overview

This guide walks you through setting up Google Places API for live address autocomplete in SentinelPOS Guardian.

## 📋 Prerequisites

- Google Cloud Platform account
- Credit card for billing (Google provides $200 free credit monthly)
- Basic understanding of API keys and environment variables

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create New Project**:
   - Click "Select a project" dropdown
   - Click "New Project"
   - Enter project name: `sentinelpos-guardian`
   - Click "Create"

3. **Select Your Project**:
   - Ensure your new project is selected in the dropdown

### Step 2: Enable Places API

1. **Navigate to APIs & Services**:
   - In the left sidebar, click "APIs & Services" → "Library"

2. **Search for Places API**:
   - Search for "Places API (New)"
   - Click on "Places API (New)" (not the legacy version)

3. **Enable the API**:
   - Click "Enable" button
   - Wait for activation (usually takes 1-2 minutes)

### Step 3: Create API Key

1. **Go to Credentials**:
   - Click "APIs & Services" → "Credentials"

2. **Create Credentials**:
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key (starts with "AIza")
   - Click "Close"

3. **Secure Your API Key** (Important):
   - Click on your newly created API key to edit it
   - Add a descriptive name: "SentinelPOS Address Autocomplete"

### Step 4: Restrict API Key (Security)

#### Application Restrictions
1. **Set HTTP Referrers**:
   - Select "HTTP referrers (web sites)"
   - Add these referrers:
     ```
     http://localhost:5173/*
     https://yourdomain.com/*
     ```

#### API Restrictions
1. **Restrict to Places API**:
   - Select "Restrict key"
   - Check only "Places API (New)"
   - Click "Save"

### Step 5: Configure Billing (Required)

1. **Enable Billing**:
   - Go to "Billing" in the left sidebar
   - Link a credit card or billing account
   - Google provides $200 free credit monthly for Maps Platform

2. **Set Usage Quotas** (Optional but Recommended):
   - Go to "APIs & Services" → "Quotas"
   - Search for "Places API"
   - Set daily quotas to control costs

### Step 6: Add API Key to Your Project

1. **Update Environment Variables**:
   ```env
   # Add to your .env file
   VITE_GOOGLE_MAPS_API_KEY=AIza...your-39-character-key-here
   ```

2. **Restart Development Server**:
   ```bash
   npm run dev
   ```

3. **Test the Integration**:
   - Go to store setup page
   - Start typing an address
   - You should see live Google Places suggestions

## 🔧 Configuration Options

### API Key Restrictions

#### For Development
```
HTTP Referrers:
- http://localhost:5173/*
- http://localhost:3000/*
- http://127.0.0.1:5173/*
```

#### For Production
```
HTTP Referrers:
- https://yourdomain.com/*
- https://www.yourdomain.com/*
```

### Usage Quotas (Cost Control)

Set these quotas to control costs:
- **Autocomplete requests**: 1,000 per day
- **Place Details requests**: 100 per day
- **Geocoding requests**: 100 per day

## 💰 Pricing Information

### Google Places API Pricing (as of 2024)
- **Autocomplete**: $2.83 per 1,000 requests
- **Place Details**: $17 per 1,000 requests
- **Free Tier**: $200 credit monthly (covers ~70,000 autocomplete requests)

### Cost Optimization Tips
1. **Use Autocomplete Only**: Don't fetch place details unless needed
2. **Set Quotas**: Limit daily usage to prevent unexpected charges
3. **Cache Results**: Store frequently used addresses locally
4. **Debounce Requests**: Wait for user to stop typing (already implemented)

## 🧪 Testing Your Setup

### 1. Check API Key Format
Your API key should:
- Be exactly 39 characters long
- Start with "AIza"
- Contain only alphanumeric characters

### 2. Test in Application
1. Navigate to store setup page
2. Click in the address field
3. Type "123 main" 
4. You should see live Google suggestions

### 3. Verify in Browser Console
Look for these log messages:
```
✅ Google Maps API key validated
🔄 Fetching Google Places suggestions for: 123 main
✅ Google Places API returned 5 suggestions
```

### 4. Use RLS Diagnostics
Navigate to `/rls-diagnostics` and run the "Environment Check" test to verify your API key is properly configured.

## 🚨 Troubleshooting

### Common Issues

#### "Invalid API Key Format"
- **Cause**: API key doesn't start with "AIza" or isn't 39 characters
- **Solution**: Double-check you copied the complete key

#### "CORS Error"
- **Cause**: Domain not added to HTTP referrers
- **Solution**: Add your domain to API key restrictions

#### "API Key Not Found"
- **Cause**: Environment variable not set or misspelled
- **Solution**: Check `.env` file has `VITE_GOOGLE_MAPS_API_KEY`

#### "Quota Exceeded"
- **Cause**: Hit daily usage limits
- **Solution**: Increase quotas or wait until next day

#### "Billing Not Enabled"
- **Cause**: No billing account linked
- **Solution**: Add credit card to Google Cloud project

### Debug Steps

1. **Check Environment Variables**:
   ```bash
   # In browser console
   console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
   ```

2. **Test API Key Manually**:
   ```bash
   curl "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=123+main&key=YOUR_API_KEY"
   ```

3. **Check Browser Network Tab**:
   - Look for requests to `maps.googleapis.com`
   - Check response status and error messages

## 🔒 Security Best Practices

### 1. Restrict Your API Key
- **Never** use unrestricted API keys
- Always set HTTP referrer restrictions
- Limit to only required APIs

### 2. Monitor Usage
- Set up billing alerts
- Review usage reports monthly
- Set reasonable quotas

### 3. Rotate Keys Regularly
- Generate new API keys quarterly
- Delete old unused keys
- Update environment variables

### 4. Environment Security
- Never commit API keys to version control
- Use different keys for development/production
- Store keys in secure environment variable systems

## 📊 Monitoring & Analytics

### Google Cloud Console
- **APIs & Services** → **Dashboard**: View usage statistics
- **Billing**: Monitor costs and usage
- **Quotas**: Track quota usage and limits

### Application Monitoring
- Check browser console for API errors
- Monitor address autocomplete success rates
- Track user experience metrics

## 🆘 Support Resources

### Google Documentation
- [Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Billing and Pricing](https://developers.google.com/maps/billing-and-pricing)

### Community Support
- [Google Maps Platform Community](https://developers.google.com/maps/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-places-api)

### Application Support
- Use `/rls-diagnostics` for system health checks
- Check browser console for detailed error messages
- Review network requests in browser dev tools

---

🎉 **Congratulations!** You now have live address autocomplete powered by Google Places API. Your users will enjoy accurate, real-time address suggestions as they type.