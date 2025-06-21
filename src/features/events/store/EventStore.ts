import { create } from 'zustand';
import { EventService } from '../services/EventService';
import type { EventState, EnhancedEvent, EventFilters } from '../types';

/**
 * Event store following Single Responsibility Principle
 * Manages event state only - no business logic
 */
interface EventStore extends EventState {
  // Actions
  fetchEvents: (storeId: string) => Promise<void>;
  subscribeToEvents: (storeId: string) => () => void;
  addEvent: (event: EnhancedEvent) => void;
  updateFilters: (filters: Partial<EventFilters>) => void;
  clearError: () => void;
  getFilteredEvents: () => EnhancedEvent[];
}

export const useEventStore = create<EventStore>((set, get) => ({
  // State
  events: [],
  isLoading: false,
  error: null,
  filters: {
    searchTerm: '',
    severityFilter: 'all',
    dateFilter: '',
  },

  // Actions
  fetchEvents: async (storeId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await EventService.fetchEvents(storeId);
      
      if (result.error) {
        set({ 
          events: [], 
          isLoading: false, 
          error: result.error 
        });
        return;
      }
      
      set({ 
        events: result.events, 
        isLoading: false, 
        error: null 
      });
    } catch (error) {
      console.error('❌ EventStore: Fetch events failed:', error);
      set({ 
        events: [],
        isLoading: false, 
        error: (error as Error).message
      });
    }
  },

  subscribeToEvents: (storeId: string) => {
    return EventService.subscribeToEvents(storeId, (newEvent) => {
      set(state => ({
        events: [newEvent, ...state.events.slice(0, 99)] // Keep only latest 100
      }));
    });
  },

  addEvent: (event: EnhancedEvent) => {
    set(state => ({
      events: [event, ...state.events.slice(0, 99)]
    }));
  },

  updateFilters: (newFilters: Partial<EventFilters>) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  getFilteredEvents: () => {
    const { events, filters } = get();
    
    return events.filter(event => {
      const matchesSearch = event.event_type.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           (event.payload.description && event.payload.description.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      
      const matchesSeverity = filters.severityFilter === 'all' || 
                             (filters.severityFilter === 'anomaly' && event.is_anomaly) ||
                             (filters.severityFilter !== 'anomaly' && event.severity === filters.severityFilter);
      
      const matchesDate = !filters.dateFilter || 
                         new Date(event.captured_at).toDateString() === new Date(filters.dateFilter).toDateString();
      
      return matchesSearch && matchesSeverity && matchesDate;
    });
  },
}));