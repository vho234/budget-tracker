import { DataExportImport } from '../components/DataExportImport';
import { PaymentMethodManager } from '../components/PaymentMethodManager';
import { PinSettings } from '../components/PinSettings';
import { Settings } from 'lucide-react';

export function SettingsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2"><Settings className="w-7 h-7 text-indigo-400" /> Settings</h2>
      <div className="space-y-6">
        <PinSettings />
        <PaymentMethodManager />
        <DataExportImport />
      </div>
    </div>
  );
}
