# SentinelPOS Guardian - Architecture Documentation

## 🏗️ Architecture Overview

This project follows a **feature-based modular architecture** with **SOLID principles** to ensure maintainability, testability, and scalability.

## 📁 Folder Structure

```
src/
├── features/                    # Feature-based modules
│   ├── auth/                   # Authentication feature
│   │   ├── types.ts           # Auth-specific types
│   │   ├── services/          # Business logic
│   │   │   └── AuthService.ts # Auth API calls & logic
│   │   ├── store/             # State management
│   │   │   └── AuthStore.ts   # Zustand store for auth
│   │   └── components/        # UI components
│   │       └── LoginForm.tsx  # Pure UI component
│   ├── stores/                # Store management feature
│   ├── events/                # Event monitoring feature
│   └── [other-features]/     # Additional features
├── shared/                     # Shared utilities
│   ├── services/              # Service barrel exports
│   ├── stores/                # Store barrel exports
│   ├── utils/                 # Utility functions
│   ├── hooks/                 # Reusable hooks
│   └── contexts/              # React contexts
├── components/                 # Global UI components
│   ├── ui/                    # Base UI components
│   └── layout/                # Layout components
├── lib/                       # External service configs
├── utils/                     # Global utilities
└── types/                     # Global type definitions
```

## 🧱 SOLID Principles Applied

### 1. Single Responsibility Principle (SRP)
- **Services**: Handle only business logic and API calls
- **Stores**: Manage only state, no business logic
- **Components**: Handle only UI presentation
- **Types**: Define only data structures

### 2. Open/Closed Principle (OCP)
- **Services**: Extend functionality by adding new service methods
- **Stores**: Add new state slices without modifying existing ones
- **Components**: Compose new features without changing base components

### 3. Liskov Substitution Principle (LSP)
- **Service interfaces**: All services follow consistent patterns
- **Store interfaces**: All stores implement similar action patterns
- **Component props**: Consistent prop interfaces across similar components

### 4. Interface Segregation Principle (ISP)
- **Service methods**: Each method has a single, focused purpose
- **Store actions**: Actions are granular and specific
- **Component props**: Components only receive props they actually use

### 5. Dependency Inversion Principle (DIP)
- **High-level components**: Depend on service abstractions, not implementations
- **Services**: Use dependency injection patterns
- **Stores**: Don't directly import other stores, use context when needed

## 🔄 Data Flow Architecture

```
UI Component → Store Action → Service Method → API Call → Store Update → UI Re-render
```

### Example: User Login Flow
1. **LoginForm.tsx** (UI) calls `login()` action
2. **AuthStore.ts** (State) calls `AuthService.login()`
3. **AuthService.ts** (Logic) makes Supabase API call
4. **AuthService.ts** returns result to store
5. **AuthStore.ts** updates state
6. **LoginForm.tsx** re-renders with new state

## 🏪 State Management Strategy

### Global State (Zustand)
- **AuthStore**: User authentication state
- **StoreStore**: Store management state
- **EventStore**: Event monitoring state

### Local State (React useState)
- Form inputs
- UI toggles
- Component-specific state

### Context API (Sparingly)
- **AppContext**: Deep app-wide state (user session, app readiness)
- Feature-specific contexts only when needed

## 🛡️ Error Handling Strategy

### Centralized Error Handling
- **ErrorHandler class**: Consistent error processing
- **useAsyncOperation hook**: Standardized async error handling
- **Service layer**: All API calls wrapped with error handling

### Error Boundaries
- **App level**: Catch and display critical errors
- **Feature level**: Isolate feature-specific errors
- **Component level**: Graceful degradation

## 🔧 Service Layer Pattern

### Service Responsibilities
- API calls to Supabase
- Business logic processing
- Data transformation
- Error handling

### Service Structure
```typescript
export class FeatureService {
  static async operation(): Promise<{ data: T | null; error: string | null }> {
    try {
      // Business logic here
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: ErrorHandler.handle(error, context) };
    }
  }
}
```

## 📦 Component Architecture

### Component Types
1. **Pure UI Components**: No business logic, only presentation
2. **Container Components**: Connect UI to stores/services
3. **Layout Components**: Handle page structure
4. **Guard Components**: Handle route protection and access control

### Component Patterns
- **Props drilling**: Avoided using context or stores
- **Composition**: Prefer composition over inheritance
- **Memoization**: Use React.memo for expensive components
- **Error boundaries**: Wrap components that might fail

## 🔌 Integration Patterns

### Supabase Integration
- **Safe wrappers**: All Supabase calls wrapped with error handling
- **Session management**: Centralized in AuthService
- **Real-time subscriptions**: Managed in service layer

### External APIs
- **Google Maps**: Wrapped in AddressService
- **Error handling**: Consistent across all external calls
- **Fallback strategies**: Mock data when APIs unavailable

## 🧪 Testing Strategy

### Unit Testing
- **Services**: Test business logic in isolation
- **Stores**: Test state management
- **Components**: Test UI behavior
- **Utils**: Test utility functions

### Integration Testing
- **Service + Store**: Test data flow
- **Component + Store**: Test user interactions
- **API integration**: Test external service calls

## 🚀 Performance Optimizations

### Code Splitting
- **Lazy loading**: Non-critical pages loaded on demand
- **Feature bundles**: Features loaded independently
- **Dynamic imports**: Reduce initial bundle size

### State Optimization
- **Selective subscriptions**: Components only subscribe to needed state
- **Memoization**: Prevent unnecessary re-renders
- **State normalization**: Efficient data structures

### Network Optimization
- **Request batching**: Combine related API calls
- **Caching**: Cache frequently accessed data
- **Optimistic updates**: Update UI before API confirmation

## 📋 Development Guidelines

### Adding New Features
1. Create feature folder in `src/features/`
2. Define types in `types.ts`
3. Implement service in `services/`
4. Create store in `store/`
5. Build components in `components/`
6. Export from `shared/services/` and `shared/stores/`

### Modifying Existing Features
1. Identify the appropriate layer (service, store, or component)
2. Make changes following SRP
3. Update types if data structures change
4. Test changes in isolation
5. Update documentation

### Best Practices
- **One responsibility per file**
- **Consistent naming conventions**
- **Comprehensive error handling**
- **Type safety everywhere**
- **Documentation for complex logic**

## 🔍 Debugging and Monitoring

### Development Tools
- **Console logging**: Structured logging with context
- **Error tracking**: Centralized error collection
- **State inspection**: Zustand devtools integration
- **Network monitoring**: Request/response logging

### Production Monitoring
- **Error boundaries**: Catch and report runtime errors
- **Performance metrics**: Track component render times
- **User analytics**: Monitor feature usage
- **Health checks**: Monitor service availability

## 🔄 Migration Strategy

### Legacy Code Migration
1. **Identify tightly coupled code**
2. **Extract business logic to services**
3. **Move state to feature stores**
4. **Refactor components to be pure UI**
5. **Add proper error handling**
6. **Update imports to use barrel exports**

### Gradual Adoption
- **Start with new features**: Use new architecture for all new code
- **Refactor on touch**: Update legacy code when modifying
- **Critical path first**: Prioritize high-impact areas
- **Maintain compatibility**: Ensure old code continues working

This architecture ensures that fixing one issue won't break another, provides clear boundaries between concerns, and makes the codebase maintainable and extensible.