import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bell, 
  ShieldAlert, 
  FileText, 
  Settings,
  Presentation,
  Video,
  Monitor,
  Play,
  TestTube,
  Shield
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Events', path: '/events', icon: <Bell className="h-5 w-5" /> },
    { name: 'Rules', path: '/rules', icon: <ShieldAlert className="h-5 w-5" /> },
    { name: 'Reports', path: '/reports', icon: <FileText className="h-5 w-5" /> },
    { name: 'Devices', path: '/devices', icon: <Monitor className="h-5 w-5" /> },
    { name: 'Cameras', path: '/cameras', icon: <Video className="h-5 w-5" /> },
    { name: 'Simulator', path: '/simulator', icon: <Play className="h-5 w-5" /> },
    { name: 'Testing', path: '/testing', icon: <TestTube className="h-5 w-5" /> },
    { name: 'RLS Diagnostics', path: '/rls-diagnostics', icon: <Shield className="h-5 w-5" /> },
    { name: 'Training', path: '/training', icon: <Presentation className="h-5 w-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <aside 
      className={cn(
        "bg-slate-800 text-white h-screen transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 py-6 overflow-y-auto">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <div className={cn(
                  "mr-3 flex-shrink-0",
                  collapsed ? "mr-0 w-full flex justify-center" : ""
                )}>
                  {item.icon}
                </div>
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}