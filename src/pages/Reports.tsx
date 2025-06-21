import { useState, useEffect } from 'react';
import { Calendar, Download, FileText, Filter, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { useReportsStore } from '../store/reportsStore';
import { useStoreStore } from '../store/storeStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

export default function Reports() {
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { stores, currentStore } = useStoreStore();
  const { 
    reports, 
    isLoading, 
    error, 
    fetchReports, 
    generateReport, 
    exportReport 
  } = useReportsStore();

  useEffect(() => {
    // Set default date range to last 4 weeks
    const end = endOfWeek(new Date());
    const start = startOfWeek(subWeeks(end, 3));
    
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
    
    if (currentStore) {
      setSelectedStore(currentStore.id);
    }
  }, [currentStore]);

  useEffect(() => {
    fetchReports(selectedStore, startDate, endDate);
  }, [selectedStore, startDate, endDate, fetchReports]);

  const handleGenerateReport = async () => {
    if (!selectedStore || !startDate || !endDate) {
      toast.error('Please select store and date range');
      return;
    }

    setIsGenerating(true);
    try {
      await generateReport(selectedStore, startDate, endDate);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (reportId: string, format: 'csv' | 'pdf') => {
    try {
      const url = await exportReport(reportId, format);
      if (url) {
        window.open(url, '_blank');
        toast.success(`Report exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const storeOptions = [
    { value: '', label: 'All Stores' },
    ...stores.map(store => ({ value: store.id, label: store.name }))
  ];

  const getSeverityColor = (count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    if (percentage > 20) return 'text-red-600';
    if (percentage > 10) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500">
            Weekly security summaries and analytics
          </p>
        </div>
        <Button
          onClick={handleGenerateReport}
          isLoading={isGenerating}
          leftIcon={<FileText className="h-4 w-4" />}
        >
          Generate Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Store"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              options={storeOptions}
            />
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              leftIcon={<Calendar className="h-4 w-4" />}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              leftIcon={<Calendar className="h-4 w-4" />}
            />
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => fetchReports(selectedStore, startDate, endDate)}
                leftIcon={<Filter className="h-4 w-4" />}
                className="w-full"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            <p>Error loading reports: {error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No reports found for the selected criteria</p>
          </div>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {report.store_name} - Weekly Report
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                      {format(new Date(report.period_start), 'MMM d')} - {format(new Date(report.period_end), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {report.dispatched && (
                      <Badge variant="success">Dispatched</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(report.id, 'csv')}
                      leftIcon={<Download className="h-4 w-4" />}
                    >
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(report.id, 'pdf')}
                      leftIcon={<Download className="h-4 w-4" />}
                    >
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  {/* Total Events */}
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-slate-500 mr-2" />
                      <span className="text-sm font-medium text-slate-600">Total Events</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{report.total_events}</div>
                  </div>

                  {/* Suspicious Events */}
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-red-600">Suspicious</span>
                    </div>
                    <div className={cn(
                      'text-2xl font-bold',
                      getSeverityColor(report.suspicious_events, report.total_events)
                    )}>
                      {report.suspicious_events}
                    </div>
                  </div>

                  {/* Warning Events */}
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      <span className="text-sm font-medium text-amber-600">Warnings</span>
                    </div>
                    <div className={cn(
                      'text-2xl font-bold',
                      getSeverityColor(report.warning_events, report.total_events)
                    )}>
                      {report.warning_events}
                    </div>
                  </div>

                  {/* Info Events */}
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-blue-600">Info</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{report.info_events}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Violations */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-3">Most Frequent Rule Violations</h4>
                    <div className="space-y-2">
                      {report.top_violations.length > 0 ? (
                        report.top_violations.map((violation, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700">{violation.rule_name}</span>
                            <Badge variant="outline">{violation.count} times</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 italic">No rule violations recorded</p>
                      )}
                    </div>
                  </div>

                  {/* Top Incidents */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-3">Top Security Incidents</h4>
                    <div className="space-y-2">
                      {report.top_incidents.length > 0 ? (
                        report.top_incidents.map((incident, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-slate-700">{incident.event_type}</span>
                              <p className="text-xs text-slate-500">
                                {format(new Date(incident.timestamp), 'MMM d, h:mm a')}
                              </p>
                            </div>
                            <Badge 
                              variant={
                                incident.severity === 'suspicious' ? 'danger' :
                                incident.severity === 'warn' ? 'warning' : 'info'
                              }
                            >
                              {incident.severity}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 italic">No security incidents recorded</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}