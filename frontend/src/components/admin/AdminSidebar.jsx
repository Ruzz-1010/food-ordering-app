// AdminSidebar.jsx - WITH LOGO
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Utensils, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut,
  Bike,
  X
} from 'lucide-react';

const AdminSidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'riders', label: 'Riders', icon: Bike },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col shadow-xl">
      {/* Sidebar Header with Logo */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Utensils size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">FoodAdmin</h2>
            <p className="text-xs text-gray-600 font-medium">Management Panel</p>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 hover:bg-orange-100 rounded-lg transition-colors"
        >
          <X size={20} className="text-orange-600" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-orange-500 text-white shadow-lg transform scale-[1.02]' 
                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700 border border-transparent'
                }
              `}
            >
              <Icon size={20} className={`${isActive ? 'text-white' : 'text-gray-400'}`} />
              <span className="font-medium text-sm">{item.label}</span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200 mb-3"
        >
          <LogOut size={20} className="text-gray-400" />
          <span className="font-medium text-sm">Logout</span>
        </button>
        
        {/* Version Info */}
        <div className="px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-700">System Status</p>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            v1.0.0 • FoodAdmin System
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;