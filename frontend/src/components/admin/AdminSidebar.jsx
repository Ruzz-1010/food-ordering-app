// AdminSidebar.jsx - MODERN REDESIGN
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
  X,
  ChevronRight
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
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#FFF0C4] to-white">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-[#8C1007] to-[#660B05] rounded-xl flex items-center justify-center shadow-lg">
            <Utensils size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#3E0703]">FoodDash</h2>
            <p className="text-xs text-[#660B05] font-medium">Admin Panel</p>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 hover:bg-[#FFF0C4] rounded-lg transition-colors"
        >
          <X size={20} className="text-[#8C1007]" />
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
                w-full flex items-center justify-between space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-gradient-to-r from-[#8C1007] to-[#660B05] text-white shadow-lg transform scale-[1.02]' 
                  : 'text-[#3E0703] hover:bg-[#FFF0C4] hover:text-[#660B05] border border-transparent'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <Icon size={20} className={`${isActive ? 'text-white' : 'text-[#8C1007]'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              
              {/* Active indicator */}
              {isActive ? (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              ) : (
                <ChevronRight size={16} className="text-[#8C1007] opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-[#3E0703] hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200 mb-3"
        >
          <LogOut size={20} className="text-[#8C1007]" />
          <span className="font-medium text-sm">Logout</span>
        </button>
        
        {/* Version Info */}
        <div className="px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-[#3E0703]">System Status</p>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          </div>
          <p className="text-xs text-[#660B05] text-center">
            v2.0.0 • FoodDash System
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;