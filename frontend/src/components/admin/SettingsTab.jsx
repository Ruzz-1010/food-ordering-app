// SettingsTab.jsx - CLEAN MODERN DESIGN
import React, { useState } from 'react';
import { 
  Save, Bell, Shield, CreditCard, Globe, Mail, 
  Smartphone, CheckCircle 
} from 'lucide-react';

const SettingsTab = () => {
  const [settings, setSettings] = useState({
    siteName: 'FoodExpress',
    currency: 'PHP',
    timezone: 'Asia/Manila',
    emailNotifications: true,
    orderAlerts: true,
    promoNotifications: false,
    taxRate: 12,
    deliveryFee: 50,
    requireApproval: true,
    autoApproveCustomers: true
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-red-600' : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-500 mt-1">Manage your platform configuration</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700">
          <CheckCircle size={20} />
          <span className="font-medium">Settings saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Globe size={20} className="text-red-600" />
            General
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="PHP">PHP (₱)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="Asia/Manila">Manila (GMT+8)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <CreditCard size={20} className="text-red-600" />
            Payment
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({...settings, taxRate: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Delivery Fee (₱)</label>
              <input
                type="number"
                value={settings.deliveryFee}
                onChange={(e) => setSettings({...settings, deliveryFee: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Bell size={20} className="text-red-600" />
            Notifications
          </h3>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email alerts' },
              { key: 'orderAlerts', label: 'Order Alerts', desc: 'New order notifications' },
              { key: 'promoNotifications', label: 'Promotional', desc: 'Marketing and promo alerts' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <Toggle 
                  checked={settings[item.key]} 
                  onChange={(v) => setSettings({...settings, [item.key]: v})}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Shield size={20} className="text-red-600" />
            Security
          </h3>
          <div className="space-y-4">
            {[
              { key: 'requireApproval', label: 'Require Approval', desc: 'Manual approval for restaurants' },
              { key: 'autoApproveCustomers', label: 'Auto-approve Customers', desc: 'Instant customer registration' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <Toggle 
                  checked={settings[item.key]} 
                  onChange={(v) => setSettings({...settings, [item.key]: v})}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;