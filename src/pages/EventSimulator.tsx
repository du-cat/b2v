import { useState } from 'react';
import { Play, Pause, RotateCcw, Send, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { useStoreStore } from '../store/storeStore';
import { useDevicesStore } from '../store/devicesStore';
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
  
  const { currentStore } = useStoreStore();
  const { devices } = useDevicesStore();
  
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
        };
        break;
      case 'void':
        amount = customAmount ? parseFloat(customAmount) : Math.random() * 150 + 10;
        metadata = { reason: 'customer_request', original_transaction_id: `txn_${Date.now()}` };
        break;
      case 'refund':
        amount = customAmount ? parseFloat(customAmount) : Math.random() * 100 + 5;
        metadata = { reason: 'defective_item', receipt_number: `rcpt_${Date.now()}` };
        break;
      case 'drawer_open':
        metadata = { reason: Math.random() > 0.7 ? 'no_sale' : 'transaction' };
        break;
      case 'login_failure':
        metadata = { 
          username: `user_${Math.floor(Math.random() * 100)}`,
          attempt_count: Math.floor(Math.random() * 5) + 1 
        };
        break;
      case 'price_override':
        amount = customAmount ? parseFloat(customAmount) : Math.random() * 50 + 5;
        metadata = { 
          original_price: amount ? amount * 1.2 : 25,
          override_reason: 'manager_discount' 
        };
        break;
      case 'after_hours_access':
        metadata = { 
          access_type: 'badge_scan',
          employee_badge: `badge_${Math.floor(Math.random() * 1000)}` 
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/event-processor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(event),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setRecentEvents(prev => [event, ...prev.slice(0, 9)]);
        setEventCount(prev => prev + 1);
        toast.success(`Event sent: ${event.event_type}`);
      } else {
        toast.error(`Failed to send event: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending event:', error);
      toast.error('Failed to send event');
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
    const badges = {
      transaction: 'success',
      void: 'warning',
      refund: 'warning',
      drawer_open: 'info',
      login_failure: 'danger',
      price_override: 'warning',
      after_hours_access: 'danger',
    };
    
    return <Badge variant={badges[eventType as keyof typeof badges] as any}>{eventType}</Badge>;
  };
  
  if (!currentStore) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No store selected</h2>
        <p className="text-slate-500">Please select a store to use the event simulator.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Event Simulator</h1>
        <p className="text-slate-500">
          Generate and send test POS events to {currentStore.name}
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
            >
              Send Single Event
            </Button>
            
            {!isSimulating ? (
              <Button
                onClick={startSimulation}
                leftIcon={<Play className="h-4 w-4" />}
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
                        {event.amount && ` • $${event.amount}`}
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