// AdminDashboard.jsx - CLEAN MODERN REDESIGN
import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Bell, Search, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Import tab components
import AdminSidebar from '../../components/admin/AdminSidebar';
import DashboardTab from '../../components/admin/DashboardTab';
import UsersTab from '../../components/admin/UsersTab';
import RestaurantsTab from '../../components/admin/RestaurantsTab';
import OrdersTab from '../../components/admin/OrdersTab';
import AnalyticsTab from '../../components/admin/AnalyticsTab';
import SettingsTab from '../../components/admin/SettingsTab';
import RiderTab from '../../components/admin/RiderTab';

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const notificationsRef = useRef(null);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on tab change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [activeTab, isMobile]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'users': return <UsersTab />;
      case 'restaurants': return <RestaurantsTab />;
      case 'orders': return <OrdersTab />;
      case 'analytics': return <AnalyticsTab />;
      case 'settings': return <SettingsTab />;
      case 'riders': return <RiderTab />;
      default: return <DashboardTab />;
    }
  };

  const getTabTitle = () => ({
    dashboard: 'Dashboard',
    users: 'Users',
    restaurants: 'Restaurants',
    orders: 'Orders',
    analytics: 'Analytics',
    settings: 'Settings',
    riders: 'Riders'
  }[activeTab] || 'Dashboard');

  const notifications = [
    { id: 1, title: 'New order received', desc: 'Order #12345 from johnruzzek', time: '2m ago', type: 'order', unread: true },
    { id: 2, title: 'Restaurant approval needed', desc: 'Pizza Palace waiting for approval', time: '1h ago', type: 'restaurant', unread: true },
    { id: 3, title: 'New user registration', desc: 'Maria Santos registered', time: '3h ago', type: 'user', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        w-72 bg-white border-r border-gray-200 shadow-lg lg:shadow-none
      `}>
        <AdminSidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={logout}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            {/* Left: Menu + Title */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X size={20} className="text-gray-700" /> : <Menu size={20} className="text-gray-700" />}
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{getTabTitle()}</h1>
                <p className="text-sm text-gray-500 hidden sm:block">Welcome back, {user?.name || 'Admin'}</p>
              </div>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                  )}
                </button>

                {/* Dropdown */}
                {notificationsOpen && (
                  <div className={`
                    absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden
                    ${isMobile ? 'fixed top-16 left-4 right-4 w-auto' : ''}
                  `}>
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div 
                          key={n.id}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 ${n.unread ? 'bg-red-50/30' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${n.unread ? 'bg-red-500' : 'bg-gray-300'}`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                              <p className="text-xs text-red-500 mt-1 font-medium">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-red-200">
                  {(user?.name || 'A')[0].toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;