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
}