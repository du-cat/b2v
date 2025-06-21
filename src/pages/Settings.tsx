import { Routes, Route, Navigate } from 'react-router-dom';
import { NotificationSettings } from '../components/notifications/NotificationSettings';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account and application preferences</p>
      </div>
      
      <Routes>
        <Route index element={<Navigate to="notifications\" replace />} />
        <Route path="notifications" element={<NotificationSettings />} />
        <Route path="*" element={<NotificationSettings />} />
      </Routes>
    </div>
  );
}