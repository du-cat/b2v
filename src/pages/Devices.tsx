import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Wifi, WifiOff, Search, Monitor, Camera, Smartphone, HardDrive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDevicesStore } from '../store/devicesStore';
import { useStoreStore } from '../store/storeStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { cn } from '../utils/cn';
import type { Device, DeviceType } from '../types';
import toast from 'react-hot-toast';

interface DeviceFormData {
  name: string;
  type: DeviceType;
  identifier: string;
}

export default function Devices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<DeviceType | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    type: 'pos',
    identifier: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<DeviceFormData>>({});

  const { currentStore } = useStoreStore();
  const { 
    devices, 
    isLoading, 
    error, 
    fetchDevices, 
    createDevice, 
    updateDevice, 
    deleteDevice,
    updateLastPing 
  } = useDevicesStore();

  useEffect(() => {
    if (currentStore) {
      fetchDevices(currentStore.id);
    }
  }, [currentStore, fetchDevices]);

  const deviceTypeOptions = [
    { value: 'pos', label: 'POS Terminal' },
    { value: 'camera', label: 'Security Camera' },
    { value: 'cash_drawer', label: 'Cash Drawer' },
    { value: 'pi', label: 'Raspberry Pi' },
  ];

  const filterTypeOptions = [
    { value: 'all', label: 'All Devices' },
    ...deviceTypeOptions,
  ];

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || device.type === filterType;
    return matchesSearch && matchesType;
  });

  const validateForm = (): boolean => {
    const errors: Partial<DeviceFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Device name is required';
    }

    if (!formData.identifier.trim()) {
      errors.identifier = 'Device identifier is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentStore) return;

    const deviceData = {
      store_id: currentStore.id,
      name: formData.name,
      type: formData.type,
      identifier: formData.identifier,
      metadata: {},
    };

    try {
      if (editingDevice) {
        await updateDevice(editingDevice.id, deviceData);
        toast.success('Device updated successfully');
      } else {
        await createDevice(deviceData);
        toast.success('Device created successfully');
      }
      
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to save device');
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      type: device.type,
      identifier: device.identifier || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (deviceId: string) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await deleteDevice(deviceId);
        toast.success('Device deleted successfully');
      } catch (error) {
        toast.error('Failed to delete device');
      }
    }
  };

  const handlePing = async (deviceId: string) => {
    try {
      await updateLastPing(deviceId);
      toast.success('Device pinged successfully');
    } catch (error) {
      toast.error('Failed to ping device');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
    setFormData({
      name: '',
      type: 'pos',
      identifier: '',
    });
    setFormErrors({});
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'pos':
        return <Monitor className="h-5 w-5" />;
      case 'camera':
        return <Camera className="h-5 w-5" />;
      case 'cash_drawer':
        return <HardDrive className="h-5 w-5" />;
      case 'pi':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getDeviceTypeBadge = (type: DeviceType) => {
    const typeLabels = {
      pos: 'POS Terminal',
      camera: 'Camera',
      cash_drawer: 'Cash Drawer',
      pi: 'Raspberry Pi',
    };

    const variants = {
      pos: 'default',
      camera: 'secondary',
      cash_drawer: 'outline',
      pi: 'info',
    } as const;

    return (
      <Badge variant={variants[type]}>
        {typeLabels[type]}
      </Badge>
    );
  };

  const getConnectionStatus = (lastPing: string | null) => {
    if (!lastPing) {
      return { status: 'never', color: 'text-slate-400', icon: WifiOff };
    }

    const pingDate = new Date(lastPing);
    const now = new Date();
    const diffMinutes = (now.getTime() - pingDate.getTime()) / (1000 * 60);

    if (diffMinutes < 5) {
      return { status: 'online', color: 'text-green-600', icon: Wifi };
    } else if (diffMinutes < 30) {
      return { status: 'recent', color: 'text-amber-600', icon: Wifi };
    } else {
      return { status: 'offline', color: 'text-red-600', icon: WifiOff };
    }
  };

  if (!currentStore) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No store selected</h2>
        <p className="text-slate-500">Please select a store to manage devices.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Devices</h1>
          <p className="text-slate-500">
            Manage hardware devices for {currentStore.name}
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Device
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                options={filterTypeOptions}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>Error loading devices: {error}</p>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Monitor className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>
                {searchTerm || filterType !== 'all' 
                  ? 'No devices match your filters' 
                  : 'No devices registered yet'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDevices.map((device) => {
                const connectionStatus = getConnectionStatus(device.last_ping);
                const ConnectionIcon = connectionStatus.icon;
                
                return (
                  <div key={device.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 p-2 bg-slate-100 rounded-lg">
                          {getDeviceIcon(device.type)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-medium text-slate-900">
                              {device.name}
                            </h3>
                            {getDeviceTypeBadge(device.type)}
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>
                              <span className="font-medium">Device ID:</span> {device.identifier}
                            </p>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <ConnectionIcon className={cn('h-4 w-4', connectionStatus.color)} />
                                <span className={cn('text-sm font-medium', connectionStatus.color)}>
                                  {connectionStatus.status === 'online' && 'Online'}
                                  {connectionStatus.status === 'recent' && 'Recently Active'}
                                  {connectionStatus.status === 'offline' && 'Offline'}
                                  {connectionStatus.status === 'never' && 'Never Connected'}
                                </span>
                              </div>
                              {device.last_ping && (
                                <span className="text-sm text-slate-500">
                                  Last ping: {formatDistanceToNow(new Date(device.last_ping), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePing(device.id)}
                          leftIcon={<Wifi className="h-4 w-4" />}
                        >
                          Ping
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(device)}
                          leftIcon={<Edit className="h-4 w-4" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(device.id)}
                          leftIcon={<Trash2 className="h-4 w-4" />}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Device Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDevice ? 'Edit Device' : 'Add New Device'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Device Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            placeholder="Enter device name"
            required
          />

          <Select
            label="Device Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as DeviceType })}
            options={deviceTypeOptions}
          />

          <Input
            label="Device Identifier"
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
            error={formErrors.identifier}
            placeholder="Enter device ID or serial number"
            required
          />

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
            >
              {editingDevice ? 'Update Device' : 'Add Device'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}