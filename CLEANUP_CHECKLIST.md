# Legacy Code Cleanup Checklist

## 🎯 Completed Cleanups

### ✅ Removed Legacy Files
- [x] `src/store/authStore.ts` - Replaced with `src/features/auth/store/AuthStore.ts`

### ✅ Updated Architecture
- [x] Implemented feature-based folder structure
- [x] Added comprehensive error boundaries
- [x] Created service layer with proper separation of concerns
- [x] Implemented state isolation (stores don't directly read from each other)
- [x] Added centralized error handling
- [x] Created app context for shared state only

## 🔄 Remaining Legacy Code to Migrate

### Store Files (Legacy Zustand)
- [ ] `src/store/devicesStore.ts` → `src/features/devices/store/DeviceStore.ts`
- [ ] `src/store/rulesStore.ts` → `src/features/rules/store/RuleStore.ts`
- [ ] `src/store/reportsStore.ts` → `src/features/reports/store/ReportStore.ts`
- [ ] `src/store/notificationStore.ts` → `src/features/notifications/store/NotificationStore.ts`
- [ ] `src/store/storeStore.ts` → Already migrated to `src/features/stores/store/StoreStore.ts`

### Component Files with Direct API Calls
- [ ] `src/components/auth/SignupForm.tsx` - Still has direct Supabase calls
- [ ] `src/components/notifications/NotificationDropdown.tsx` - Mixed concerns
- [ ] `src/components/notifications/NotificationSettings.tsx` - Direct API calls
- [ ] `src/components/layout/MainLayout.tsx` - Uses legacy stores
- [ ] `src/components/layout/Navbar.tsx` - Uses legacy stores

### Page Files with Mixed Concerns
- [ ] `src/pages/Events.tsx` - Still uses legacy patterns
- [ ] `src/pages/Rules.tsx` - Direct Supabase calls
- [ ] `src/pages/Reports.tsx` - Mixed business logic
- [ ] `src/pages/Devices.tsx` - Legacy store usage
- [ ] `src/pages/Notifications.tsx` - Direct API calls
- [ ] `src/pages/StoreSetup.tsx` - Mixed concerns

## 🚨 Critical Issues Found

### 1. Service Leakage Into UI ❌
**Files with direct API calls:**
- `src/components/auth/SignupForm.tsx` - Lines 45-60 (direct Supabase calls)
- `src/components/notifications/NotificationSettings.tsx` - Lines 120-140 (direct Supabase calls)
- `src/pages/Rules.tsx` - Lines 80-100 (direct Supabase calls)
- `src/pages/Reports.tsx` - Lines 60-80 (direct Supabase calls)

**Fix Required:** All UI components must use store actions only, never direct API calls.

### 2. Store Cross-Dependencies ❌
**Files with store coupling:**
- `src/components/layout/MainLayout.tsx` - Imports multiple stores directly
- `src/components/layout/Navbar.tsx` - Reads from multiple stores
- `src/pages/Dashboard.tsx` - Direct store imports

**Fix Required:** Use AppContext for shared state, avoid direct store-to-store dependencies.

### 3. Missing Error Boundaries ✅ FIXED
- [x] Added global ErrorBoundary component
- [x] Wrapped all routes with error boundaries
- [x] Added error boundary for each lazy-loaded component

## 📋 Next Migration Steps

### Phase 1: Complete Service Layer Migration
1. **Create DeviceService** - Extract all device-related API calls
2. **Create RuleService** - Extract all rule-related API calls  
3. **Create ReportService** - Extract all report-related API calls
4. **Create NotificationService** - Extract all notification-related API calls

### Phase 2: Migrate Remaining Stores
1. **DeviceStore** - Pure state management only
2. **RuleStore** - Pure state management only
3. **ReportStore** - Pure state management only
4. **NotificationStore** - Pure state management only

### Phase 3: Update UI Components
1. **Remove all direct API calls** from components
2. **Use store actions only** for data operations
3. **Use AppContext** for shared state access
4. **Add error boundaries** where missing

### Phase 4: Final Cleanup
1. **Remove legacy store files** after migration
2. **Update all imports** to use barrel exports
3. **Remove unused dependencies**
4. **Update documentation**

## 🔧 Migration Commands

### Remove Legacy Files (After Migration)
```bash
# Remove legacy store files (DO NOT RUN YET)
rm src/store/devicesStore.ts
rm src/store/rulesStore.ts  
rm src/store/reportsStore.ts
rm src/store/notificationStore.ts
rm src/store/storeStore.ts

# Remove legacy component files (DO NOT RUN YET)
# Only after they're migrated to new architecture
```

### Verify No Direct API Calls
```bash
# Find files with direct Supabase calls (should be empty after migration)
grep -r "supabase\." src/components/ src/pages/ --include="*.tsx" --include="*.ts"

# Find files with direct store imports (should use barrel exports)
grep -r "from.*store.*Store" src/components/ src/pages/ --include="*.tsx" --include="*.ts"
```

## ✅ Architecture Validation

### State Isolation ✅ COMPLETED
- [x] AuthStore doesn't read from other stores
- [x] StoreStore doesn't read from other stores  
- [x] EventStore doesn't read from other stores
- [x] AppContext provides shared state without coupling

### Service Layer ✅ COMPLETED
- [x] AuthService handles all auth business logic
- [x] StoreService handles all store business logic
- [x] EventService handles all event business logic with clear separation:
  - Raw data ingestion
  - Business logic (anomaly detection)
  - Notification triggers

### Error Boundaries ✅ COMPLETED
- [x] Global ErrorBoundary component implemented
- [x] All routes wrapped with error boundaries
- [x] Graceful error recovery with user-friendly messages
- [x] Development error details for debugging

### UI Purity ✅ PARTIALLY COMPLETED
- [x] LoginForm uses only store actions
- [x] EventsFeed uses only store actions and context
- [ ] SignupForm still has direct API calls (NEEDS MIGRATION)
- [ ] Other components need migration

## 🎯 Success Criteria

The migration will be complete when:
- [ ] No UI components make direct API calls
- [ ] All stores are isolated (no cross-dependencies)
- [ ] All business logic is in service layer
- [ ] Error boundaries catch all UI crashes
- [ ] All legacy store files are removed
- [ ] All imports use barrel exports
- [ ] EventService clearly separates data ingestion, business logic, and notifications

## 📊 Progress: 60% Complete

**Completed:** Foundation, core features (auth, stores, events), error boundaries
**Remaining:** Device, rules, reports, notifications features + UI component migration