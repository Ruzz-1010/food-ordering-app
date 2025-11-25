// AdminDashboard.jsx - IMPROVED MOBILE RESPONSIVENESS
import React, { useState } from 'react';
import { Menu, Utensils } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-orange-50 flex">
      {/* Sidebar */}
      <AdminSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={logout}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 flex flex-col min-w-0"> {/* Added min-w-0 for flexbox shrinking */}
        {/* Fixed Header */}
        <header className="bg-white shadow-sm border-b border-orange-200 sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-orange-600" />
            </button>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 capitalize truncate">
                {activeTab === 'dashboard' ? ' Dashboard' : 
                 activeTab === 'restaurants' ? ' Restaurants' :
                 activeTab === 'orders' ? ' Orders' :
                 activeTab === 'users' ? ' Users' : 
                 activeTab === 'riders' ? ' Riders' :
                 ` ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
              </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden xs:block">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{user?.name}</p>
                <p className="text-xs text-orange-600">Administrator</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm text-sm sm:text-base">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;