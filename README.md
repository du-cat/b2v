# SentinelPOS Guardian

A comprehensive security monitoring platform for Point of Sale (POS) systems built with React, TypeScript, and Supabase.

## 🚀 Features

- **Real-time Event Monitoring** - Monitor POS events with AI-enhanced anomaly detection
- **Store Management** - Multi-store support with centralized monitoring
- **Rule Engine** - Configurable security rules and alerts
- **Live Address Autocomplete** - Google Places API integration for accurate store addresses
- **Comprehensive Reporting** - Weekly security reports and analytics
- **Device Management** - Track and monitor connected POS devices
- **Camera Integration** - Security camera feed monitoring
- **Event Simulation** - Test security scenarios with built-in simulator

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- Supabase account
- Google Maps API key (optional, for live address autocomplete)

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OpenCage Data API (Optional - for live address autocomplete)
# Get your API key from: https://opencagedata.com/
VITE_OPENCAGE_API_KEY=your-opencage-api-key-here

# Development Settings
VITE_APP_ENV=development
```

You can copy the `.env.example` file as a starting point:

```bash
cp .env.example .env
```

Then update with your actual Supabase credentials from the [Supabase Dashboard](https://app.supabase.com/) under Settings → API.

### Google Places API Setup

1. **Get API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the "Places API (New)"
   - Create credentials → API Key
   - Copy the API key (starts with "AIza")

2. **Configure API Key**:
   - Add to `.env` file as `VITE_GOOGLE_MAPS_API_KEY`
   - Restrict the key to your domain for security
   - Set usage quotas to control costs

3. **API Key Restrictions** (Recommended):
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: 
     - `http://localhost:5173/*` (development)
     - `https://yourdomain.com/*` (production)
   - **API restrictions**: Places API

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Architecture

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation

### Backend Stack
- **Supabase** - Database, authentication, real-time subscriptions
- **PostgreSQL** - Database with Row-Level Security (RLS)
- **Edge Functions** - Serverless functions for event processing

## 🔧 Configuration

### Supabase Setup

1. **Create Supabase Project**:
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Create new project
   - Copy Project URL and Anon Key

2. **Database Schema**:
   - Run migrations in `supabase/migrations/`
   - Tables: users, stores, devices, events, rules, alerts, notifications

3. **Row-Level Security**:
   - RLS policies ensure users only access their own data
   - Policies defined in migration files

## 🧪 Testing & Diagnostics

### RLS Diagnostics
Navigate to `/rls-diagnostics` to run comprehensive tests:
- Environment variable validation
- Supabase connection testing
- Authentication context verification
- Row-Level Security policy testing
- Network diagnostics

### Event Simulator
Use `/simulator` to test security scenarios:
- Generate realistic POS events
- Test rule engine responses
- Validate alert systems
- Simulate different event types

## 📱 Usage

### Store Setup
1. **Create Account**: Sign up with email/password
2. **Store Creation**: Add store details with address autocomplete
3. **Device Registration**: Connect POS devices and cameras
4. **Rule Configuration**: Set up security monitoring rules

### Daily Operations
1. **Dashboard**: Monitor real-time events and alerts
2. **Events**: Review security events with AI anomaly detection
3. **Reports**: Generate weekly security summaries
4. **Notifications**: Receive alerts via email, push, or SMS

## 🔒 Security

### Data Protection
- **Row-Level Security**: Database-level access control
- **Session Management**: Secure authentication with auto-refresh
- **API Key Security**: Environment-based configuration
- **CORS Protection**: Restricted API access

## 🚀 Deployment

### Environment Setup
```bash
# Production environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-production-api-key
VITE_APP_ENV=production
```

### Build & Deploy
```bash
# Build for production
npm run build

# Deploy to your hosting provider
# (Netlify, Vercel, etc.)
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

Built with ❤️ using React, TypeScript, Supabase, and Google Places API.