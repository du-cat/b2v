export interface User {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  created_at: string;
}

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  full_name: string;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  // Methods
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (signupData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}