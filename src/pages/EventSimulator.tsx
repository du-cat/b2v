import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Send, AlertTriangle, Plus, Store } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { useStoreStore } from '@/features/stores/store/StoreStore';
import { useDevicesStore } from '@/shared/stores';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface SimulatedEvent {
  id: string;
  store_id: string;
  event_type: string;
  timestamp: string;
  device_id: string;
  employee_id?: string;
  amount?: number;
  metadata?: Record<string, any>;
}

export default function EventSimulator() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(2000); // ms between events
  const [selectedEventType, setSelectedEventType] = useState('transaction');
  const [customAmount, setCustomAmount] = useState('');
  const [recentEvents, setRecentEvents] = useState<SimulatedEvent[]>([]);
  
  const { currentStore, stores } = useStoreStore();
  const { devices, fetchDevices } = useDevicesStore();
  
  // Fetch devices when store changes
  useEffect(() => {
    if (currentStore) {
      fetchDevices(currentStore.id);
    }
  }, [currentStore, fetchDevices]);
  
  const eventTypes = [
    { value: 'transaction', label: 'Transaction' },
    { value: 'void', label: 'Void Transaction' },
    { value: 'refund', label: 'Refund' },
    { value: 'drawer_open', label: 'Cash Drawer Open' },
    { value: 'login_failure', label: 'Login Failure' },
    { value: 'price_override', label: 'Price Override' },
    { value: 'after_hours_access', label: 'After Hours Access' },
  ];
  
  const speedOptions = [
    { value: '500', label: 'Very Fast (0.5s)' },
    { value: '1000', label: 'Fast (1s)' },
    { value: '2000', label: 'Normal (2s)' },
    { value: '5000', label: 'Slow (5s)' },
    { value: '10000', label: 'Very Slow (10s)' },
  ];
  
  const generateRandomEvent = (): SimulatedEvent => {
    const eventType = selectedEventType === 'random' 
      ? eventTypes[Math.floor(Math.random() * eventTypes.length)].value
      : selectedEventType;
    
    const deviceId = devices.length > 0 
      ? devices[Math.floor(Math.random() * devices.length)].id
      : 'device-001';
    
    let amount: number | undefined;
    let metadata: Record<string, any> = {};
    
    // Generate realistic amounts and metadata based on event type
    switch (eventType) {
      case 'transaction':
        amount = customAmount ? parseFloat(customAmount) : Math.random() * 200 + 5;
        metadata = {
          payment_method: ['cash', 'card', 'mobile'][Math.floor(Math.random() * 3)],
          items_count: Math.floor(Math.random() * 10) + 1,
          description: `Transaction processed for $${amount.toFixed(2)}`
        };
        break;
      case 'void':
        amount = customAmount ? parseFloat(customAmount) : Math.random() * 150 + 10;
        metadata = { 
          reason: 'customer_request', 
          original_transaction_id: `txn_${Date.now()}`,
          description: `Void transaction for $${amount.toFixed(2)}`
        };
        break;
      case 'refund':
        amount = customAmount ? parseFloat(customAmount) : Math.random() * 100 + 5;
        metadata = { 
          reason: 'defective_item', 
          receipt_number: `rcpt_${Date.now()}`,
          description: `Refund processed for $${amount.toFixed(2)}`
        };
        break;
      case 'drawer_open':
        metadata = { 
          reason: Math.random() > 0.7 ? 'no_sale' : 'transaction',
          description: `Cash drawer opened (${Math.random() > 0.7 ? 'no sale' : 'transaction'})`
        };
        break;
      case 'login_failure':
        metadata = { 
          username: `user_${Math.floor(Math.random() * 100)}`,
          attempt_count: Math.floor(Math.random() * 5) + 1,
          description: `Failed login attempt for user_${Math.floor(Math.random() * 100)}`
        };
        break;
      case 'price_override':
        amount = customAmount ? parseFloat(customAmount) : Math.random() * 50 + 5;
        metadata = { 
          original_price: amount ? amount * 1.2 : 25,
          override_reason: 'manager_discount',
          description: `Price override: $${(amount * 1.2).toFixed(2)} → $${amount?.toFixed(2)}`
        };
        break;
      case 'after_hours_access':
        metadata = { 
          access_type: 'badge_scan',
          employee_badge: `badge_${Math.floor(Math.random() * 1000)}`,
          description: `After hours access detected via badge scan`
        };
        break;
    }
    
    return {
      id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      store_id: currentStore?.id || 'store-001',
      event_type: eventType,
      timestamp: new Date().toISOString(),
      device_id: deviceId,
      employee_id: `emp_${Math.floor(Math.random() * 50) + 1}`,
      amount: amount ? Math.round(amount * 100) / 100 : undefined,
      metadata,
    };
  };
  
  const sendEvent = async (event: SimulatedEvent) => {
    try {
      // Create the event directly in the database
      const { data, error } = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          id: event.id,
          store_id: event.store_id,
          device_id: event.device_id,
          event_type: event.event_type,
          severity: 'info', // Default severity
          payload: {
            employee_id: event.employee_id,
            amount: event.amount,
            ...event.metadata
          },
          captured_at: event.timestamp
        })
      }).then(res => res.json());
      
      if (error) {
        throw new Error(error.message);
      }
      
      setRecentEvents(prev => [event, ...prev.slice(0, 9)]);
      setEventCount(prev => prev + 1);
      toast.success(`Event sent: ${event.event_type}`);
      
      return true;
    } catch (error) {
      console.error('Error sending event:', error);
      toast.error('Failed to send event');
      return false;
    }
  };
  
  const sendSingleEvent = async () => {
    if (!currentStore) {
      toast.error('Please select a store first');
      return;
    }
    
    const event = generateRandomEvent();
    await sendEvent(event);
  };
  
  const startSimulation = () => {
    if (!currentStore) {
      toast.error('Please select a store first');
      return;
    }
    
    setIsSimulating(true);
    setEventCount(0);
    
    const interval = setInterval(async () => {
      const event = generateRandomEvent();
      await sendEvent(event);
    }, simulationSpeed);
    
    // Store interval ID for cleanup
    (window as any).simulationInterval = interval;
  };
  
  const stopSimulation = () => {
    setIsSimulating(false);
    if ((window as any).simulationInterval) {
      clearInterval((window as any).simulationInterval);
      (window as any).simulationInterval = null;
    }
  };
  
  const resetSimulation = () => {
    stopSimulation();
    setEventCount(0);
    setRecentEvents([]);
  };
  
  const getEventBadge = (eventType: string) => {
    const badges: Record<string, string> = {
      transaction: 'success',
      void: 'warning',
      refund: 'warning',
      drawer_open: 'info',
      login_failure: 'danger',
      price_override: 'warning',
      after_hours_access: 'danger',
    };
    
    return <Badge variant={badges[eventType] as any || 'default'}>{eventType}</Badge>;
  };
  
  // If no stores exist, show a message to create a store
  if (stores.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Event Simulator</h1>
          <p className="text-slate-500">
            Generate and send test POS events to your store
          </p>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <Store className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-3">No Stores Available</h2>
            <p className="text-slate-600 mb-6">
              You need to create a store before you can use the event simulator.
            </p>
            <Link to="/setup">
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                Create Your First Store
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If no store is selected but stores exist, show a message to select a store
  if (!currentStore && stores.length > 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Event Simulator</h1>
          <p className="text-slate-500">
            Generate and send test POS events to your store
          </p>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <Store className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-3">Select a Store</h2>
            <p className="text-slate-600 mb-6">
              Please select a store from the dropdown in the navigation bar to use the event simulator.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                You have {stores.length} store{stores.length !== 1 ? 's' : ''} available.
              </p>
              <p className="text-sm text-amber-600 font-medium">
                Click on the store selector in the top navigation bar to choose a store.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Event Simulator</h1>
        <p className="text-slate-500">
          Generate and send test POS events {currentStore ? `to ${currentStore.name}` : ''}
        </p>
      </div>
      
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Simulation Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Event Type"
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              options={[
                { value: 'random', label: 'Random Events' },
                ...eventTypes
              ]}
            />
            
            <Select
              label="Simulation Speed"
              value={simulationSpeed.toString()}
              onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
              options={speedOptions}
            />
            
            <Input
              label="Custom Amount ($)"
              type="number"
              step="0.01"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Leave empty for random"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={sendSingleEvent}
              leftIcon={<Send className="h-4 w-4" />}
              variant="outline"
              disabled={!currentStore}
            >
              Send Single Event
            </Button>
            
            {!isSimulating ? (
              <Button
                onClick={startSimulation}
                leftIcon={<Play className="h-4 w-4" />}
                disabled={!currentStore}
              >
                Start Simulation
              </Button>
            ) : (
              <Button
                onClick={stopSimulation}
                leftIcon={<Pause className="h-4 w-4" />}
                variant="danger"
              >
                Stop Simulation
              </Button>
            )}
            
            <Button
              onClick={resetSimulation}
              leftIcon={<RotateCcw className="h-4 w-4" />}
              variant="outline"
            >
              Reset
            </Button>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <span>Events sent: <strong>{eventCount}</strong></span>
            {isSimulating && (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Simulation running</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No events sent yet</p>
              {!currentStore && (
                <p className="text-sm mt-2">Select a store to start sending events</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getEventBadge(event.event_type)}
                    <div>
                      <p className="font-medium text-slate-900">
                        {event.event_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                        {event.amount && ` • $${event.amount.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {event.id.slice(-8)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}