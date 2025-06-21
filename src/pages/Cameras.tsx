import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Download, Calendar, Search, Video, Camera, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useDevicesStore } from '../store/devicesStore';
import { useStoreStore } from '../store/storeStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { cn } from '../utils/cn';
import type { Device } from '../types';

interface CameraFeed {
  id: string;
  deviceId: string;
  deviceName: string;
  isLive: boolean;
  streamUrl: string;
  lastRecording: string;
  status: 'online' | 'offline' | 'recording';
}

interface RecordedEvent {
  id: string;
  timestamp: string;
  duration: number;
  eventType: string;
  severity: 'info' | 'warn' | 'suspicious';
  thumbnailUrl: string;
  videoUrl: string;
}

export default function Cameras() {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<'live' | 'recorded'>('live');

  const { currentStore } = useStoreStore();
  const { devices, fetchDevices } = useDevicesStore();

  // Mock camera feeds data
  const [cameraFeeds, setCameraFeeds] = useState<CameraFeed[]>([]);
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);

  useEffect(() => {
    if (currentStore) {
      fetchDevices(currentStore.id);
    }
  }, [currentStore, fetchDevices]);

  // Generate mock camera feeds from camera devices
  useEffect(() => {
    const cameraDevices = devices.filter(device => device.type === 'camera');
    const mockFeeds: CameraFeed[] = cameraDevices.map(device => ({
      id: `feed-${device.id}`,
      deviceId: device.id,
      deviceName: device.name,
      isLive: Math.random() > 0.3, // 70% chance of being live
      streamUrl: `https://example.com/stream/${device.id}`,
      lastRecording: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      status: Math.random() > 0.2 ? 'online' : 'offline',
    }));
    setCameraFeeds(mockFeeds);

    // Generate mock recorded events
    const mockEvents: RecordedEvent[] = [];
    for (let i = 0; i < 20; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      mockEvents.push({
        id: `event-${i}`,
        timestamp: timestamp.toISOString(),
        duration: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
        eventType: ['Motion Detected', 'Person Entered', 'Unusual Activity', 'After Hours Access'][Math.floor(Math.random() * 4)],
        severity: ['info', 'warn', 'suspicious'][Math.floor(Math.random() * 3)] as any,
        thumbnailUrl: `https://picsum.photos/320/180?random=${i}`,
        videoUrl: `https://example.com/video/${i}`,
      });
    }
    setRecordedEvents(mockEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, [devices]);

  const filteredCameras = cameraFeeds.filter(camera =>
    camera.deviceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = recordedEvents.filter(event => {
    const eventDate = format(new Date(event.timestamp), 'yyyy-MM-dd');
    return eventDate === selectedDate;
  });

  const selectedCameraFeed = selectedCamera ? cameraFeeds.find(feed => feed.id === selectedCamera) : null;

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="success">Online</Badge>;
      case 'recording':
        return <Badge variant="warning">Recording</Badge>;
      default:
        return <Badge variant="danger">Offline</Badge>;
    }
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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!currentStore) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No store selected</h2>
        <p className="text-slate-500">Please select a store to view camera feeds.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Camera Feeds</h1>
          <p className="text-slate-500">
            Monitor live and recorded footage for {currentStore.name}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'live' ? 'primary' : 'outline'}
            onClick={() => setViewMode('live')}
            leftIcon={<Video className="h-4 w-4" />}
          >
            Live Feed
          </Button>
          <Button
            variant={viewMode === 'recorded' ? 'primary' : 'outline'}
            onClick={() => setViewMode('recorded')}
            leftIcon={<Calendar className="h-4 w-4" />}
          >
            Recordings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Camera List Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {viewMode === 'live' ? 'Live Cameras' : 'Recorded Events'}
              </CardTitle>
              <div className="space-y-3">
                <Input
                  placeholder="Search cameras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
                {viewMode === 'recorded' && (
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    leftIcon={<Calendar className="h-4 w-4" />}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {viewMode === 'live' ? (
                <div className="divide-y divide-slate-100">
                  {filteredCameras.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      <Camera className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No cameras found</p>
                    </div>
                  ) : (
                    filteredCameras.map((camera) => (
                      <button
                        key={camera.id}
                        onClick={() => setSelectedCamera(camera.id)}
                        className={cn(
                          'w-full p-4 text-left hover:bg-slate-50 transition-colors',
                          selectedCamera === camera.id && 'bg-blue-50 border-r-2 border-r-blue-500'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900">{camera.deviceName}</h4>
                          {getStatusBadge(camera.status)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {camera.isLive ? (
                            <span className="flex items-center">
                              <div className="h-2 w-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                              Live
                            </span>
                          ) : (
                            `Last: ${formatDistanceToNow(new Date(camera.lastRecording), { addSuffix: true })}`
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {filteredEvents.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      <Video className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No recordings for this date</p>
                    </div>
                  ) : (
                    filteredEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedCamera(event.id)}
                        className={cn(
                          'w-full p-3 text-left hover:bg-slate-50 transition-colors',
                          selectedCamera === event.id && 'bg-blue-50 border-r-2 border-r-blue-500'
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <img
                            src={event.thumbnailUrl}
                            alt="Event thumbnail"
                            className="w-12 h-8 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {event.eventType}
                              </p>
                              {getSeverityBadge(event.severity)}
                            </div>
                            <div className="text-xs text-slate-500">
                              <p>{format(new Date(event.timestamp), 'h:mm a')}</p>
                              <p>{formatDuration(event.duration)}</p>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Video Player */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              {selectedCamera ? (
                <div className="space-y-4">
                  {/* Video Player */}
                  <div className="relative bg-black rounded-t-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    {viewMode === 'live' && selectedCameraFeed ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <h3 className="text-xl font-semibold mb-2">{selectedCameraFeed.deviceName}</h3>
                          <p className="text-slate-300">
                            {selectedCameraFeed.isLive ? 'Live Feed' : 'Camera Offline'}
                          </p>
                          {selectedCameraFeed.isLive && (
                            <div className="flex items-center justify-center mt-2">
                              <div className="h-2 w-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                              <span className="text-sm">LIVE</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <h3 className="text-xl font-semibold mb-2">Recorded Event</h3>
                          <p className="text-slate-300">Click play to view recording</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Video Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePlayPause}
                            className="text-white hover:bg-white/20"
                          >
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                          </Button>
                          {viewMode === 'recorded' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/20"
                            >
                              <RotateCcw className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {viewMode === 'live' && selectedCameraFeed?.isLive && (
                            <Badge variant="danger\" className="bg-red-600 text-white">
                              LIVE
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20"
                          >
                            <Download className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-6">
                    {viewMode === 'live' && selectedCameraFeed ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">{selectedCameraFeed.deviceName}</h3>
                          {getStatusBadge(selectedCameraFeed.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-slate-600">Status:</span>
                            <span className="ml-2">{selectedCameraFeed.isLive ? 'Live Streaming' : 'Offline'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-600">Last Recording:</span>
                            <span className="ml-2">
                              {formatDistanceToNow(new Date(selectedCameraFeed.lastRecording), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {(() => {
                          const event = recordedEvents.find(e => e.id === selectedCamera);
                          return event ? (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">{event.eventType}</h3>
                                {getSeverityBadge(event.severity)}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-slate-600">Timestamp:</span>
                                  <span className="ml-2">
                                    {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-slate-600">Duration:</span>
                                  <span className="ml-2">{formatDuration(event.duration)}</span>
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 text-slate-500">
                  <div className="text-center">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold mb-2">Select a Camera</h3>
                    <p>Choose a camera from the sidebar to view {viewMode === 'live' ? 'live feed' : 'recordings'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}