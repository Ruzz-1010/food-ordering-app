// SettingsTab.jsx - MODERN REDESIGN
import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Database, Shield, Bell, Mail, Globe, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

const SettingsTab = () => {
  const [settings, setSettings] = useState({
    // System Settings
    siteName: 'FoodDash',
    siteDescription: 'Modern Food Delivery System',
    currency: 'PHP',
    timezone: 'Asia/Manila',
    
    // Notification Settings
    emailNotifications: true,
    orderAlerts: true,
    promoNotifications: false,
    
    // Payment Settings
    paymentMethods: ['credit_card', 'cash_on_delivery'],
    taxRate: 12,
    deliveryFee: 50,
    
    // Security Settings
    requireApproval: true,
    autoApproveCustomers: true
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch current settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentSettings = {
        siteName: 'FoodDash',
        siteDescription: 'Modern Food Delivery System',
        currency: 'PHP',
        timezone: 'Asia/Manila',
        emailNotifications: true,
        orderAlerts: true,
        promoNotifications: false,
        paymentMethods: ['credit_card', 'cash_on_delivery'],
        taxRate: 12,
        deliveryFee: 50,
        requireApproval: true,
        autoApproveCustomers: true
      };
      
      setSettings(currentSettings);
      
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage('❌ Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // In a real app, you'd save to your API
      // const response = await fetch(`${API_URL}/admin/settings`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify(settings)
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMessage('✅ Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('❌ Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]">⚙️ System Settings</h2>
        </div>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-[#FFF0C4] border-t-[#8C1007] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#660B05] mt-4 text-lg">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]">⚙️ System Settings</h2>
          <p className="text-[#660B05] mt-1 text-sm sm:text-base">Configure your food delivery platform</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={fetchSettings}
            className="flex items-center space-x-2 bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex-1 sm:flex-none justify-center"
          >
            <RefreshCw size={16} />
            <span className="text-sm sm:text-base">Reload</span>
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#8C1007] to-[#660B05] text-white px-3 sm:px-4 py-2 rounded-lg hover:shadow-md transition-all disabled:opacity-50 flex-1 sm:flex-none justify-center"
          >
            <Save size={16} />
            <span className="text-sm sm:text-base">{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.includes('✅') ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* General Settings */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#FFF0C4] border border-[#8C1007] rounded-xl p-4 sm:p-6 hover:shadow-md transition-all">
            <h3 className="text-lg font-semibold text-[#3E0703] mb-4 flex items-center">
              <Globe size={20} className="text-[#8C1007] mr-2" />
              General Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#660B05] mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleInputChange('siteName', e.target.value)}
                  className="w-full border border-[#8C1007] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C1007] text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#660B05] mb-2">Site Description</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                  rows="3"
                  className="w-full border border-[#8C1007] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C1007] text-sm sm:text-base"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-2">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full border border-[#8C1007] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C1007] text-sm sm:text-base"
                  >
                    <option value="PHP">Philippine Peso (₱)</option>
                    <option value="USD">US Dollar ($)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-2">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full border border-[#8C1007] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C1007] text-sm sm:text-base"
                  >
                    <option value="Asia/Manila">Manila (UTC+8)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-all">
            <h3 className="text-lg font-semibold text-[#3E0703] mb-4 flex items-center">
              <CreditCard size={20} className="text-green-600 mr-2" />
              Payment Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#660B05] mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                  min="0"
                  max="50"
                  step="0.1"
                  className="w-full border border-green-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#660B05] mb-2">Delivery Fee (₱)</label>
                <input
                  type="number"
                  value={settings.deliveryFee}
                  onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value))}
                  min="0"
                  step="5"
                  className="w-full border border-green-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notification & Security Settings */}
        <div className="space-y-4 sm:space-y-6">
          {/* Notification Settings */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-all">
            <h3 className="text-lg font-semibold text-[#3E0703] mb-4 flex items-center">
              <Bell size={20} className="text-blue-600 mr-2" />
              Notification Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="font-medium text-[#3E0703] text-sm sm:text-base">Email Notifications</p>
                  <p className="text-xs sm:text-sm text-[#660B05]">Receive email alerts</p>
                </div>
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 ${
                    settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="font-medium text-[#3E0703] text-sm sm:text-base">Order Alerts</p>
                  <p className="text-xs sm:text-sm text-[#660B05]">New order notifications</p>
                </div>
                <button
                  onClick={() => handleToggle('orderAlerts')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 ${
                    settings.orderAlerts ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.orderAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="font-medium text-[#3E0703] text-sm sm:text-base">Promotional Notifications</p>
                  <p className="text-xs sm:text-sm text-[#660B05]">Promo and discount alerts</p>
                </div>
                <button
                  onClick={() => handleToggle('promoNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 ${
                    settings.promoNotifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.promoNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-all">
            <h3 className="text-lg font-semibold text-[#3E0703] mb-4 flex items-center">
              <Shield size={20} className="text-purple-600 mr-2" />
              Security & Approval
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="font-medium text-[#3E0703] text-sm sm:text-base">Require Restaurant Approval</p>
                  <p className="text-xs sm:text-sm text-[#660B05]">Manual approval for new restaurants</p>
                </div>
                <button
                  onClick={() => handleToggle('requireApproval')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 ${
                    settings.requireApproval ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.requireApproval ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="font-medium text-[#3E0703] text-sm sm:text-base">Auto-approve Customers</p>
                  <p className="text-xs sm:text-sm text-[#660B05]">Instant approval for customer accounts</p>
                </div>
                <button
                  onClick={() => handleToggle('autoApproveCustomers')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 ${
                    settings.autoApproveCustomers ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.autoApproveCustomers ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-all">
            <h3 className="text-lg font-semibold text-[#3E0703] mb-4 flex items-center">
              <Database size={20} className="text-gray-600 mr-2" />
              System Information
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-2 bg-white rounded">
                <span className="text-[#660B05]">API Version</span>
                <span className="font-medium text-[#3E0703]">v2.0.0</span>
              </div>
              <div className="flex justify-between p-2 bg-white rounded">
                <span className="text-[#660B05]">Database</span>
                <span className="font-medium text-[#3E0703]">MongoDB</span>
              </div>
              <div className="flex justify-between p-2 bg-white rounded">
                <span className="text-[#660B05]">Last Backup</span>
                <span className="font-medium text-[#3E0703]">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-white rounded">
                <span className="text-[#660B05]">System Status</span>
                <span className="font-medium text-green-600">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;