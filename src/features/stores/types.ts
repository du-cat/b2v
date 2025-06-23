export interface Store {
  id: string;
  owner_id: string;
  name: string;
  location: string | null;
  timezone: string | null;
  created_at: string;
}

export interface CreateStoreData {
  owner_id: string;
  name: string;
  location: string;
  timezone: string;
}

export interface StoreState {
  stores: Store[];
  currentStore: Store | null;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  hasAttemptedStoreInit: boolean;
  // Methods
  fetchStores: (userId: string) => Promise<Store[]>;
  setCurrentStore: (storeId: string) => void;
  createStore: (storeData: CreateStoreData) => Promise<Store | null>;
  updateStore: (storeId: string, storeData: Partial<CreateStoreData>) => Promise<Store | null>;
  initializeStoreContext: (userId: string) => Promise<void>;
  clearError: () => void;
  resetRetryCount: () => void;
  resetAttemptedStoreInit: () => void;
  checkSessionValidity: () => Promise<boolean>;
}