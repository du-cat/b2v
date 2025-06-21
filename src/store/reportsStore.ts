import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { WeeklyReport } from '../types';

interface ReportData {
  id: string;
  store_name: string;
  period_start: string;
  period_end: string;
  total_events: number;
  suspicious_events: number;
  warning_events: number;
  info_events: number;
  top_violations: Array<{
    rule_name: string;
    count: number;
  }>;
  top_incidents: Array<{
    event_type: string;
    timestamp: string;
    severity: string;
  }>;
  dispatched: boolean;
}

interface ReportsState {
  reports: ReportData[];
  weeklyReports: WeeklyReport[];
  isLoading: boolean;
  error: string | null;
  
  fetchReports: (storeId?: string, startDate?: string, endDate?: string) => Promise<void>;
  generateReport: (storeId: string, startDate: string, endDate: string) => Promise<ReportData | null>;
  exportReport: (reportId: string, format: 'csv' | 'pdf') => Promise<string | null>;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  reports: [],
  weeklyReports: [],
  isLoading: false,
  error: null,
  
  fetchReports: async (storeId, startDate, endDate) => {
    try {
      set({ isLoading: true, error: null });
      
      // Build query
      let query = supabase
        .from('weekly_reports')
        .select(`
          *,
          stores!inner(name)
        `)
        .order('period_start', { ascending: false });
      
      if (storeId) {
        query = query.eq('store_id', storeId);
      }
      
      if (startDate) {
        query = query.gte('period_start', startDate);
      }
      
      if (endDate) {
        query = query.lte('period_end', endDate);
      }
      
      const { data: weeklyReportsData, error: reportsError } = await query;
      
      if (reportsError) throw reportsError;
      
      // Generate detailed report data for each weekly report
      const detailedReports: ReportData[] = [];
      
      for (const report of weeklyReportsData || []) {
        // Get events for this period
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('store_id', report.store_id)
          .gte('captured_at', report.period_start)
          .lte('captured_at', report.period_end);
        
        if (eventsError) {
          console.error('Error fetching events for report:', eventsError);
          continue;
        }
        
        // Calculate statistics
        const totalEvents = events?.length || 0;
        const suspiciousEvents = events?.filter(e => e.severity === 'suspicious').length || 0;
        const warningEvents = events?.filter(e => e.severity === 'warn').length || 0;
        const infoEvents = events?.filter(e => e.severity === 'info').length || 0;
        
        // Get top violations (mock data for now)
        const topViolations = [
          { rule_name: 'Unusual Transaction Pattern', count: Math.floor(Math.random() * 10) + 1 },
          { rule_name: 'After Hours Activity', count: Math.floor(Math.random() * 8) + 1 },
          { rule_name: 'Multiple Failed Logins', count: Math.floor(Math.random() * 5) + 1 },
        ].sort((a, b) => b.count - a.count).slice(0, 3);
        
        // Get top incidents
        const topIncidents = events
          ?.filter(e => e.severity === 'suspicious')
          .slice(0, 5)
          .map(e => ({
            event_type: e.event_type,
            timestamp: e.captured_at,
            severity: e.severity,
          })) || [];
        
        detailedReports.push({
          id: report.id,
          store_name: (report as any).stores.name,
          period_start: report.period_start,
          period_end: report.period_end,
          total_events: totalEvents,
          suspicious_events: suspiciousEvents,
          warning_events: warningEvents,
          info_events: infoEvents,
          top_violations: topViolations,
          top_incidents: topIncidents,
          dispatched: report.dispatched || false,
        });
      }
      
      set({ 
        reports: detailedReports,
        weeklyReports: weeklyReportsData as WeeklyReport[],
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      set({ 
        isLoading: false, 
        error: (error as Error).message 
      });
    }
  },
  
  generateReport: async (storeId, startDate, endDate) => {
    try {
      set({ isLoading: true, error: null });
      
      // Create new weekly report entry
      const { data: newReport, error: reportError } = await supabase
        .from('weekly_reports')
        .insert([{
          store_id: storeId,
          period_start: startDate,
          period_end: endDate,
          dispatched: false,
        }])
        .select(`
          *,
          stores!inner(name)
        `)
        .single();
      
      if (reportError) throw reportError;
      
      // Generate detailed report data
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('store_id', storeId)
        .gte('captured_at', startDate)
        .lte('captured_at', endDate);
      
      if (eventsError) throw eventsError;
      
      const totalEvents = events?.length || 0;
      const suspiciousEvents = events?.filter(e => e.severity === 'suspicious').length || 0;
      const warningEvents = events?.filter(e => e.severity === 'warn').length || 0;
      const infoEvents = events?.filter(e => e.severity === 'info').length || 0;
      
      const topViolations = [
        { rule_name: 'Unusual Transaction Pattern', count: Math.floor(Math.random() * 10) + 1 },
        { rule_name: 'After Hours Activity', count: Math.floor(Math.random() * 8) + 1 },
        { rule_name: 'Multiple Failed Logins', count: Math.floor(Math.random() * 5) + 1 },
      ].sort((a, b) => b.count - a.count).slice(0, 3);
      
      const topIncidents = events
        ?.filter(e => e.severity === 'suspicious')
        .slice(0, 5)
        .map(e => ({
          event_type: e.event_type,
          timestamp: e.captured_at,
          severity: e.severity,
        })) || [];
      
      const reportData: ReportData = {
        id: newReport.id,
        store_name: (newReport as any).stores.name,
        period_start: newReport.period_start,
        period_end: newReport.period_end,
        total_events: totalEvents,
        suspicious_events: suspiciousEvents,
        warning_events: warningEvents,
        info_events: infoEvents,
        top_violations: topViolations,
        top_incidents: topIncidents,
        dispatched: false,
      };
      
      set(state => ({ 
        reports: [reportData, ...state.reports],
        weeklyReports: [newReport as WeeklyReport, ...state.weeklyReports],
        isLoading: false 
      }));
      
      return reportData;
    } catch (error) {
      console.error('Error generating report:', error);
      set({ 
        isLoading: false, 
        error: (error as Error).message 
      });
      return null;
    }
  },
  
  exportReport: async (reportId, format) => {
    try {
      // This would typically call an edge function or API endpoint
      // For now, return a mock URL
      const mockUrl = `https://example.com/reports/${reportId}.${format}`;
      return mockUrl;
    } catch (error) {
      console.error('Error exporting report:', error);
      set({ error: (error as Error).message });
      return null;
    }
  },
}));