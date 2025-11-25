// AdminSidebar.jsx - UPDATED FOR BETTER ALIGNMENT
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
  };

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col shadow-lg">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
            <Utensils size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">FoodAdmin</h2>
            <p className="text-xs text-gray-500">Management Panel</p>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
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
                  ? 'bg-orange-50 border border-orange-200 text-orange-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }
              `}
            >
              <Icon size={20} className={`${isActive ? 'text-orange-600' : 'text-gray-400'}`} />
              <span className="font-medium text-sm">{item.label}</span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200"
        >
          <LogOut size={20} className="text-gray-400" />
          <span className="font-medium text-sm">Logout</span>
        </button>
        
        {/* Version Info */}
        <div className="mt-4 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            System v1.0.0
          </p>
          <div className="flex items-center justify-center space-x-1 mt-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-600">All Systems Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;