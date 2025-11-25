// AdminDashboard.jsx - MODERN REDESIGN
import React, { useState, useEffect } from 'react';
import { Menu, X, Bell, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Import components
import AdminSidebar from '../../components/admin/AdminSidebar';
import DashboardTab from '../../components/admin/DashboardTab';
import UsersTab from '../../components/admin/UsersTab';
import RestaurantsTab from '../../components/admin/RestaurantsTab';
import OrdersTab from '../../components/admin/OrdersTab';
import AnalyticsTab from '../../components/admin/AnalyticsTab';
import SettingsTab from '../../components/admin/SettingsTab';
import RiderTab from '../../components/admin/RiderTab';

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Close sidebar when switching tabs on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [activeTab, isMobile]);

  // Render different components based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'users':
        return <UsersTab />;
      case 'restaurants':
        return <RestaurantsTab />;
      case 'orders':
        return <OrdersTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <SettingsTab />;
      case 'riders':
        return <RiderTab />;
      default:
        return <DashboardTab />;
    }
  };

  const getTabTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      users: 'User Management',
      restaurants: 'Restaurant Management',
      orders: 'Order Management',
      analytics: 'Analytics & Reports',
      settings: 'System Settings',
      riders: 'Rider Management'
    };
    return titles[activeTab] || 'Dashboard';
  };

  const getUserInitial = () => {
    if (user && user.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'A';
  };

  const getUserName = () => {
    if (user && user.name) {
      return user.name;
    }
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Single Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        w-72
      `}>
        <AdminSidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          onLogout={logout}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            {/* Left Section - Menu Button, Logo and Title */}
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-[#FFF0C4] rounded-lg transition-colors border border-gray-200 lg:hidden"
              >
                {sidebarOpen ? (
                  <X size={20} className="text-[#8C1007]" />
                ) : (
                  <Menu size={20} className="text-[#8C1007]" />
                )}
              </button>
              
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-gradient-to-r from-[#8C1007] to-[#660B05]">
                  <span className="text-white font-bold text-sm">FD</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-[#3E0703]">FoodDash</h1>
                  <p className="text-xs text-[#660B05]">Admin System</p>
                </div>
              </div>

              {/* Page Title */}
              <div className="hidden md:block border-l border-gray-300 pl-4 ml-2">
                <h1 className="text-lg font-semibold text-[#3E0703]">
                  {getTabTitle()}
                </h1>
              </div>
            </div>

            {/* Center Section - Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders, users, restaurants..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007] focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Section - User Info */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Mobile Search Button */}
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 hover:bg-[#FFF0C4] rounded-lg transition-colors"
              >
                <Search size={20} className="text-[#8C1007]" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 hover:bg-[#FFF0C4] rounded-lg transition-colors relative"
                >
                  <Bell size={20} className="text-[#8C1007]" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>
                
                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-[#3E0703]">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {/* Notification items would go here */}
                      <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">New order received</p>
                        <p className="text-xs text-gray-500">Order #12345 from John Doe</p>
                        <p className="text-xs text-[#8C1007] mt-1">2 minutes ago</p>
                      </div>
                      <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">Restaurant approval needed</p>
                        <p className="text-xs text-gray-500">Pizza Palace is waiting for approval</p>
                        <p className="text-xs text-[#8C1007] mt-1">1 hour ago</p>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-200">
                      <button className="w-full text-center text-sm text-[#8C1007] font-medium hover:text-[#660B05]">
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative flex items-center space-x-3">
                <div className="text-right hidden sm:block min-w-0">
                  <p className="text-sm font-medium text-[#3E0703] truncate max-w-[150px]">
                    {getUserName()}
                  </p>
                  <p className="text-xs text-[#8C1007] font-medium">Administrator</p>
                </div>
                
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#8C1007] to-[#660B05] rounded-full flex items-center justify-center text-white font-bold shadow-sm text-sm">
                    {getUserInitial()}
                  </div>
                  {/* Online indicator */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {searchOpen && (
            <div className="md:hidden px-4 pb-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders, users, restaurants..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Mobile Title Bar */}
          <div className="md:hidden px-4 pb-3 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-[#3E0703]">
                {getTabTitle()}
              </h1>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-[#3E0703]">
                    {getUserName()}
                  </p>
                  <p className="text-xs text-[#8C1007]">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded bg-gradient-to-r from-[#8C1007] to-[#660B05] flex items-center justify-center">
                <span className="text-white text-xs font-bold">FD</span>
              </div>
              <p className="text-xs text-gray-500">
                © 2024 FoodDash Admin. All rights reserved.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">v2.0.0</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">System Online</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Close notifications when clicking outside */}
      {notificationsOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setNotificationsOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;