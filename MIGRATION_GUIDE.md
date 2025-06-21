# Migration Guide: Legacy to Feature-Based Architecture

## 🎯 Overview

This guide helps migrate from the current tightly-coupled architecture to the new feature-based modular architecture.

## 📋 Migration Checklist

### Phase 1: Foundation (✅ Complete)
- [x] Create feature-based folder structure
- [x] Implement centralized error handling
- [x] Set up service layer pattern
- [x] Create shared utilities and hooks
- [x] Implement app context for global state

### Phase 2: Core Features (🔄 In Progress)
- [x] Migrate authentication (AuthService, AuthStore, LoginForm)
- [x] Migrate store management (StoreService, StoreStore)
- [x] Migrate event monitoring (EventService, EventStore)
- [ ] Migrate device management
- [ ] Migrate rules management
- [ ] Migrate notifications

### Phase 3: UI Components (📋 Planned)
- [ ] Refactor layout components
- [ ] Update navigation components
- [ ] Migrate form components
- [ ] Update dashboard components

### Phase 4: Cleanup (📋 Planned)
- [ ] Remove legacy store files
- [ ] Update all imports to use barrel exports
- [ ] Remove unused dependencies
- [ ] Update documentation

## 🔧 How to Migrate a Feature

### Step 1: Create Feature Structure
```bash
src/features/[feature-name]/
├── types.ts              # Feature-specific types
├── services/
│   └── [Feature]Service.ts  # Business logic & API calls
├── store/
│   └── [Feature]Store.ts    # State management
└── components/
    └── [Feature]Component.tsx # UI components
```

### Step 2: Extract Types
Move feature-specific types from `src/types/index.ts` to `src/features/[feature]/types.ts`:

```typescript
// Before: src/types/index.ts
export interface Device { ... }

// After: src/features/devices/types.ts
export interface Device { ... }
export interface DeviceState { ... }
export interface CreateDeviceData { ... }
```

### Step 3: Create Service Layer
Extract business logic from stores to services:

```typescript
// Before: Logic mixed in store
const { data, error } = await supabase.from('devices').select('*');

// After: Clean service method
export class DeviceService {
  static async fetchDevices(storeId: string): Promise<{ devices: Device[]; error: string | null }> {
    try {
      const result = await safeSupabaseCall(/* ... */);
      return { devices: result.data, error: null };
    } catch (error) {
      return { devices: [], error: ErrorHandler.handle(error, context) };
    }
  }
}
```

### Step 4: Refactor Store
Simplify store to only manage state:

```typescript
// Before: Mixed concerns
export const useDevicesStore = create((set, get) => ({
  devices: [],
  fetchDevices: async (storeId) => {
    // API logic mixed with state management
  }
}));

// After: Pure state management
export const useDeviceStore = create<DeviceStore>((set, get) => ({
  devices: [],
  isLoading: false,
  error: null,
  
  fetchDevices: async (storeId: string) => {
    set({ isLoading: true, error: null });
    const result = await DeviceService.fetchDevices(storeId);
    set({ devices: result.devices, error: result.error, isLoading: false });
  }
}));
```

### Step 5: Create Pure UI Components
Extract UI logic from mixed components:

```typescript
// Before: Mixed UI and business logic
export function DeviceList() {
  const { devices, fetchDevices } = useDevicesStore();
  
  useEffect(() => {
    // Business logic mixed with UI
    fetchDevices(currentStore.id);
  }, []);
  
  return (/* JSX */);
}

// After: Pure UI component
export function DeviceList() {
  const { devices, isLoading, error } = useDeviceStore();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (/* Pure JSX */);
}
```

### Step 6: Update Barrel Exports
Add to shared exports:

```typescript
// src/shared/services/index.ts
export { DeviceService } from '../../features/devices/services/DeviceService';

// src/shared/stores/index.ts
export { useDeviceStore } from '../../features/devices/store/DeviceStore';
```

## 🔄 Migration Examples

### Example 1: Migrating Rules Feature

#### Before (Legacy)
```typescript
// src/store/rulesStore.ts - Mixed concerns
export const useRulesStore = create((set, get) => ({
  rules: [],
  isLoading: false,
  error: null,
  
  fetchRules: async (storeId) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .eq('store_id', storeId);
      
      if (error) throw error;
      set({ rules: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  }
}));
```

#### After (Feature-Based)
```typescript
// src/features/rules/types.ts
export interface Rule { ... }
export interface RuleState { ... }

// src/features/rules/services/RuleService.ts
export class RuleService {
  static async fetchRules(storeId: string): Promise<{ rules: Rule[]; error: string | null }> {
    // Clean business logic
  }
}

// src/features/rules/store/RuleStore.ts
export const useRuleStore = create<RuleStore>((set, get) => ({
  // Pure state management
}));
```

### Example 2: Migrating Components

#### Before (Mixed Concerns)
```typescript
// src/components/dashboard/EventsFeed.tsx
export function EventsFeed() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentStore } = useStoreStore();
  
  useEffect(() => {
    // Business logic mixed with UI
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('store_id', currentStore.id);
        
        if (error) throw error;
        setEvents(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [currentStore]);
  
  return (/* JSX */);
}
```

#### After (Separated Concerns)
```typescript
// src/features/events/components/EventsFeed.tsx
export function EventsFeed() {
  const { events, isLoading, error, fetchEvents } = useEventStore();
  const { currentStore } = useStoreStore();
  
  useEffect(() => {
    if (currentStore) {
      fetchEvents(currentStore.id);
    }
  }, [currentStore, fetchEvents]);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (/* Pure JSX */);
}
```

## 🚨 Common Migration Pitfalls

### 1. Don't Mix Business Logic in Components
```typescript
// ❌ Wrong: Business logic in component
const handleSubmit = async (data) => {
  const { error } = await supabase.from('table').insert(data);
  if (error) setError(error.message);
};

// ✅ Correct: Use service layer
const handleSubmit = async (data) => {
  await createItem(data); // Store action calls service
};
```

### 2. Don't Put UI Logic in Services
```typescript
// ❌ Wrong: UI concerns in service
static async createDevice(data) {
  const result = await api.create(data);
  toast.success('Device created!'); // UI concern
  return result;
}

// ✅ Correct: Keep services pure
static async createDevice(data) {
  return await api.create(data); // Pure business logic
}
```

### 3. Don't Create Circular Dependencies
```typescript
// ❌ Wrong: Store importing another store directly
import { useAuthStore } from '../auth/store/AuthStore';

// ✅ Correct: Use context or props
const { user } = useAppContext();
```

## 📊 Progress Tracking

### Completed Migrations
- ✅ Authentication (AuthService, AuthStore, LoginForm)
- ✅ Store Management (StoreService, StoreStore)
- ✅ Event Monitoring (EventService, EventStore)
- ✅ Error Handling (ErrorHandler, useAsyncOperation)
- ✅ App Context (AppProvider, ProtectedRoute)

### In Progress
- 🔄 Device Management
- 🔄 Rules Management
- 🔄 Notifications

### Pending
- 📋 Reports
- 📋 Camera Management
- 📋 Settings
- 📋 Layout Components

## 🧪 Testing Migration

### Before Deploying
1. **Test all existing functionality** - Ensure nothing breaks
2. **Test error scenarios** - Verify error handling works
3. **Test edge cases** - Check boundary conditions
4. **Performance testing** - Ensure no performance regression

### Validation Checklist
- [ ] All pages load without errors
- [ ] Authentication flow works
- [ ] Store creation/selection works
- [ ] Event monitoring functions
- [ ] Error messages are user-friendly
- [ ] Loading states display correctly

## 🔄 Rollback Strategy

If issues arise during migration:

1. **Identify the problem scope** - Is it a specific feature or global?
2. **Revert specific changes** - Use git to revert problematic commits
3. **Fallback to legacy code** - Temporarily use old imports
4. **Fix and re-deploy** - Address issues and migrate again

### Emergency Rollback
```bash
# Revert to last known good state
git revert <commit-hash>

# Or reset to specific commit
git reset --hard <commit-hash>
```

This migration guide ensures a smooth transition from the legacy architecture to the new feature-based modular architecture while maintaining system stability.