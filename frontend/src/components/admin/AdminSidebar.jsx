// AdminSidebar.jsx - CLEAN MODERN DESIGN
import React from 'react';
import { 
  LayoutDashboard, Users, Utensils, Package, 
  BarChart3, Settings, Bike, X
} from 'lucide-react';

const AdminSidebar = ({ activeTab, setActiveTab, onLogout, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'riders', label: 'Riders', icon: Bike },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
            <Utensils size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">FoodExpress</h2>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
          <button onClick={onClose} className="lg:hidden ml-auto p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
        >
          <div className="p-2 bg-red-100 rounded-lg">
            <span className="text-red-600 text-xs font-bold">OUT</span>
          </div>
          <span className="font-medium text-sm">Logout</span>
        </button>
        
        <div className="mt-4 px-4 py-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-gray-600">System Online</span>
          </div>
          <p className="text-xs text-gray-400">v2.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;