import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Rule } from '../types';

interface RulesState {
  rules: Rule[];
  isLoading: boolean;
  error: string | null;
  
  fetchRules: (storeId: string) => Promise<void>;
  createRule: (ruleData: Partial<Rule>) => Promise<Rule | null>;
  updateRule: (ruleId: string, ruleData: Partial<Rule>) => Promise<Rule | null>;
  deleteRule: (ruleId: string) => Promise<boolean>;
  toggleRuleStatus: (ruleId: string, isActive: boolean) => Promise<boolean>;
}

export const useRulesStore = create<RulesState>((set, get) => ({
  rules: [],
  isLoading: false,
  error: null,
  
  fetchRules: async (storeId) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ 
        rules: data as Rule[],
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching rules:', error);
      set({ 
        isLoading: false, 
        error: (error as Error).message 
      });
    }
  },
  
  createRule: async (ruleData) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('rules')
        .insert([ruleData])
        .select()
        .single();
      
      if (error) throw error;
      
      const newRule = data as Rule;
      set(state => ({ 
        rules: [newRule, ...state.rules],
        isLoading: false 
      }));
      
      return newRule;
    } catch (error) {
      console.error('Error creating rule:', error);
      set({ 
        isLoading: false, 
        error: (error as Error).message 
      });
      return null;
    }
  },
  
  updateRule: async (ruleId, ruleData) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('rules')
        .update(ruleData)
        .eq('id', ruleId)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedRule = data as Rule;
      set(state => ({ 
        rules: state.rules.map(rule => 
          rule.id === ruleId ? updatedRule : rule
        ),
        isLoading: false 
      }));
      
      return updatedRule;
    } catch (error) {
      console.error('Error updating rule:', error);
      set({ 
        isLoading: false, 
        error: (error as Error).message 
      });
      return null;
    }
  },
  
  deleteRule: async (ruleId) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', ruleId);
      
      if (error) throw error;
      
      set(state => ({ 
        rules: state.rules.filter(rule => rule.id !== ruleId),
        isLoading: false 
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting rule:', error);
      set({ 
        isLoading: false, 
        error: (error as Error).message 
      });
      return false;
    }
  },
  
  toggleRuleStatus: async (ruleId, isActive) => {
    try {
      const { error } = await supabase
        .from('rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);
      
      if (error) throw error;
      
      set(state => ({ 
        rules: state.rules.map(rule => 
          rule.id === ruleId ? { ...rule, is_active: isActive } : rule
        )
      }));
      
      return true;
    } catch (error) {
      console.error('Error toggling rule status:', error);
      set({ error: (error as Error).message });
      return false;
    }
  },
}));