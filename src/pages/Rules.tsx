import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, PowerOff, Search, Filter } from 'lucide-react';
import { useRulesStore } from '../store/rulesStore';
import { useStoreStore } from '../store/storeStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { StoreRequiredBanner } from '../components/ui/StoreRequiredBanner';
import { cn } from '../utils/cn';
import type { Rule, RuleKind, Severity } from '../types';
import toast from 'react-hot-toast';

interface RuleFormData {
  name: string;
  kind: RuleKind;
  event_type: string;
  severity: Severity;
  threshold_value: string;
  time_window: string;
  device_type: string;
}

export default function Rules() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    kind: 'threshold',
    event_type: '',
    severity: 'warn',
    threshold_value: '',
    time_window: '60',
    device_type: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<RuleFormData>>({});

  const { currentStore } = useStoreStore();
  const { 
    rules, 
    isLoading, 
    error, 
    fetchRules, 
    createRule, 
    updateRule, 
    deleteRule, 
    toggleRuleStatus 
  } = useRulesStore();

  useEffect(() => {
    // Only fetch rules if we have a current store
    if (currentStore) {
      fetchRules(currentStore.id);
    } else {
      // Clear rules if no store is selected
      console.log('ℹ️ Rules: No current store, skipping rules fetch');
    }
  }, [currentStore, fetchRules]);

  const eventTypeOptions = [
    { value: '', label: 'Select event type' },
    { value: 'transaction_anomaly', label: 'Transaction Anomaly' },
    { value: 'login_failure', label: 'Login Failure' },
    { value: 'after_hours_access', label: 'After Hours Access' },
    { value: 'cash_drawer_open', label: 'Cash Drawer Open' },
    { value: 'void_transaction', label: 'Void Transaction' },
    { value: 'discount_applied', label: 'Discount Applied' },
    { value: 'refund_processed', label: 'Refund Processed' },
  ];

  const deviceTypeOptions = [
    { value: '', label: 'Any device' },
    { value: 'pos', label: 'POS Terminal' },
    { value: 'camera', label: 'Security Camera' },
    { value: 'cash_drawer', label: 'Cash Drawer' },
    { value: 'pi', label: 'Raspberry Pi' },
  ];

  const ruleKindOptions = [
    { value: 'threshold', label: 'Threshold' },
    { value: 'pattern', label: 'Pattern' },
    { value: 'ml', label: 'Machine Learning' },
  ];

  const severityOptions = [
    { value: 'info', label: 'Info' },
    { value: 'warn', label: 'Warning' },
    { value: 'suspicious', label: 'Suspicious' },
  ];

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.kind.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && rule.is_active) ||
                         (filterStatus === 'inactive' && !rule.is_active);
    return matchesSearch && matchesStatus;
  });

  const validateForm = (): boolean => {
    const errors: Partial<RuleFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Rule name is required';
    }

    if (!formData.event_type) {
      errors.event_type = 'Event type is required';
    }

    if (formData.kind === 'threshold' && !formData.threshold_value) {
      errors.threshold_value = 'Threshold value is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentStore) return;

    const ruleData = {
      store_id: currentStore.id,
      name: formData.name,
      kind: formData.kind,
      parameters: {
        event_type: formData.event_type,
        severity: formData.severity,
        threshold_value: formData.threshold_value ? parseInt(formData.threshold_value) : null,
        time_window: parseInt(formData.time_window),
        device_type: formData.device_type || null,
      },
      is_active: true,
    };

    try {
      if (editingRule) {
        await updateRule(editingRule.id, ruleData);
        toast.success('Rule updated successfully');
      } else {
        await createRule(ruleData);
        toast.success('Rule created successfully');
      }
      
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to save rule');
    }
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      kind: rule.kind,
      event_type: rule.parameters?.event_type || '',
      severity: rule.parameters?.severity || 'warn',
      threshold_value: rule.parameters?.threshold_value?.toString() || '',
      time_window: rule.parameters?.time_window?.toString() || '60',
      device_type: rule.parameters?.device_type || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await deleteRule(ruleId);
        toast.success('Rule deleted successfully');
      } catch (error) {
        toast.error('Failed to delete rule');
      }
    }
  };

  const handleToggleStatus = async (ruleId: string, currentStatus: boolean) => {
    try {
      await toggleRuleStatus(ruleId, !currentStatus);
      toast.success(`Rule ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update rule status');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
    setFormData({
      name: '',
      kind: 'threshold',
      event_type: '',
      severity: 'warn',
      threshold_value: '',
      time_window: '60',
      device_type: '',
    });
    setFormErrors({});
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'suspicious':
        return <Badge variant="danger">Suspicious</Badge>;
      case 'warn':
        return <Badge variant="warning">Warning</Badge>;
      default:
        return <Badge variant="info">Info</Badge>;
    }
  };

  const getRuleKindBadge = (kind: RuleKind) => {
    switch (kind) {
      case 'threshold':
        return <Badge variant="secondary">Threshold</Badge>;
      case 'pattern':
        return <Badge variant="outline">Pattern</Badge>;
      case 'ml':
        return <Badge variant="default">ML</Badge>;
      default:
        return <Badge variant="secondary">{kind}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rules</h1>
          <p className="text-slate-500">
            {currentStore 
              ? `Manage alert rules for ${currentStore.name}`
              : 'Manage security alert rules'
            }
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Rule
        </Button>
      </div>

      {/* Show banner if no stores exist */}
      <StoreRequiredBanner 
        message="Create a store to define security rules specific to your business."
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                options={[
                  { value: 'all', label: 'All Rules' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'inactive', label: 'Inactive Only' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>Error loading rules: {error}</p>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>
                {searchTerm || filterStatus !== 'all' 
                  ? 'No rules match your filters' 
                  : !currentStore
                    ? 'Select a store to view rules'
                    : 'No rules created yet'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRules.map((rule) => (
                <div key={rule.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-slate-900">
                          {rule.name}
                        </h3>
                        {getRuleKindBadge(rule.kind)}
                        {getSeverityBadge(rule.parameters?.severity || 'info')}
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(checked) => handleToggleStatus(rule.id, rule.is_active)}
                            size="sm"
                          />
                          <span className={cn(
                            'text-sm font-medium',
                            rule.is_active ? 'text-green-600' : 'text-slate-400'
                          )}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>
                          <span className="font-medium">Event Type:</span> {rule.parameters?.event_type || 'Any'}
                        </p>
                        {rule.parameters?.threshold_value && (
                          <p>
                            <span className="font-medium">Threshold:</span> {rule.parameters.threshold_value} 
                            {rule.parameters?.time_window && ` in ${rule.parameters.time_window} minutes`}
                          </p>
                        )}
                        {rule.parameters?.device_type && (
                          <p>
                            <span className="font-medium">Device Type:</span> {rule.parameters.device_type}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                        leftIcon={<Edit className="h-4 w-4" />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRule ? 'Edit Rule' : 'Create New Rule'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Rule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                placeholder="Enter rule name"
                required
              />
            </div>

            <Select
              label="Rule Type"
              value={formData.kind}
              onChange={(e) => setFormData({ ...formData, kind: e.target.value as RuleKind })}
              options={ruleKindOptions}
            />

            <Select
              label="Event Type"
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              options={eventTypeOptions}
              error={formErrors.event_type}
            />

            <Select
              label="Severity Level"
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as Severity })}
              options={severityOptions}
            />

            <Select
              label="Device Type"
              value={formData.device_type}
              onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
              options={deviceTypeOptions}
            />

            {formData.kind === 'threshold' && (
              <>
                <Input
                  label="Threshold Value"
                  type="number"
                  value={formData.threshold_value}
                  onChange={(e) => setFormData({ ...formData, threshold_value: e.target.value })}
                  error={formErrors.threshold_value}
                  placeholder="Enter threshold value"
                />

                <Input
                  label="Time Window (minutes)"
                  type="number"
                  value={formData.time_window}
                  onChange={(e) => setFormData({ ...formData, time_window: e.target.value })}
                  placeholder="Enter time window"
                />
              </>
            )}
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!currentStore}
            >
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}