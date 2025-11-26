// AdminDashboard.jsx - FIXED RESPONSIVE NOTIFICATIONS
import React, { useState, useEffect, useRef } from 'react';
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
  
  const notificationsRef = useRef(null);

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

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close notifications on mobile when resizing to desktop
  useEffect(() => {
    if (!isMobile && notificationsOpen) {
      setNotificationsOpen(false);
    }
  }, [isMobile, notificationsOpen]);

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

  // Sample notifications data
  const notifications = [
    {
      id: 1,
      title: 'New order received',
      description: 'Order #12345 from johnruzzek',
      time: '2 minutes ago',
      type: 'order',
      unread: true
    },
    {
      id: 2,
      title: 'Restaurant approval needed',
      description: 'Pizza Palace is waiting for approval',
      time: '1 hour ago',
      type: 'restaurant',
      unread: true
    },
    {
      id: 3,
      title: 'New user registration',
      description: 'Maria Santos registered as a customer',
      time: '3 hours ago',
      type: 'user',
      unread: true
    },
    {
      id: 4,
      title: 'System backup completed',
      description: 'Daily backup completed successfully',
      time: '5 hours ago',
      type: 'system',
      unread: false
    },
    {
      id: 5,
      title: 'Low inventory alert',
      description: 'Burger King is running low on beef patties',
      time: '1 day ago',
      type: 'inventory',
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

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
                  <span className="text-white font-bold text-sm">FX</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-[#3E0703]">FoodSxpress</h1>
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
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 hover:bg-[#FFF0C4] rounded-lg transition-colors relative"
                >
                  <Bell size={20} className="text-[#8C1007]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown - RESPONSIVE */}
                {notificationsOpen && (
                  <div className={`
                    absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50
                    ${isMobile 
                      ? 'fixed top-16 left-4 right-4 mx-auto max-w-sm max-h-[80vh] overflow-hidden' 
                      : 'w-80 max-h-96'
                    }
                  `}>
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-semibold text-[#3E0703]">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-[#8C1007] text-white text-xs px-2 py-1 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    
                    <div className={`
                      overflow-y-auto
                      ${isMobile ? 'max-h-96' : 'max-h-80'}
                    `}>
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            className={`
                              p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer
                              ${notification.unread ? 'bg-blue-50 border-l-4 border-l-[#8C1007]' : ''}
                            `}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`
                                w-3 h-3 rounded-full mt-1.5 flex-shrink-0
                                ${notification.unread ? 'bg-[#8C1007]' : 'bg-gray-300'}
                              `} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {notification.description}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className={`
                                    text-xs px-2 py-1 rounded-full
                                    ${notification.type === 'order' ? 'bg-green-100 text-green-800' :
                                      notification.type === 'restaurant' ? 'bg-blue-100 text-blue-800' :
                                      notification.type === 'user' ? 'bg-purple-100 text-purple-800' :
                                      notification.type === 'system' ? 'bg-gray-100 text-gray-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }
                                  `}>
                                    {notification.type}
                                  </span>
                                  <p className="text-xs text-[#8C1007] font-medium">
                                    {notification.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                          <p className="text-gray-500 text-sm">No notifications</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <button className="text-sm text-[#8C1007] font-medium hover:text-[#660B05] transition-colors">
                          Mark all as read
                        </button>
                        <button className="text-sm text-[#8C1007] font-medium hover:text-[#660B05] transition-colors">
                          View All
                        </button>
                      </div>
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
                  onBlur={() => setSearchOpen(false)}
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
                © 2025 FoodExpress Admin. All rights reserved.
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

      {/* Mobile Notifications Overlay */}
      {notificationsOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setNotificationsOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;