// AdminDashboard.jsx - MODERN DASHBOARD LAYOUT
import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, Bell, Search, ChevronDown, LogOut, 
  LayoutDashboard, Users, Store, Package, 
  BarChart3, Settings, Bike, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Import tabs
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
  const [darkMode, setDarkMode] = useState(false);
  
  const notificationsRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [activeTab, isMobile]);

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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'restaurants', label: 'Restaurants', icon: Store },
    { id: 'riders', label: 'Riders', icon: Bike },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const notifications = [
    { id: 1, title: 'New order received', desc: 'Order #12345 from johnruzzek', time: '2m ago', unread: true },
    { id: 2, title: 'Restaurant approval needed', desc: 'Pizza Palace waiting for approval', time: '1h ago', unread: true },
    { id: 3, title: 'New user registration', desc: 'Maria Santos registered', time: '3h ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className={`min-h-screen flex font-sans transition-colors ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">FoodExpress</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X size={20} className="text-gray-600 dark:text-gray-300" />
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
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
              {(user?.name || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Super Admin</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{getTabTitle()}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Center - Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders, users, restaurants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white dark:focus:bg-gray-600 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600" />}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div 
                          key={n.id}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${n.unread ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${n.unread ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.desc}</p>
                              <p className="text-xs text-red-500 mt-1 font-medium">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;