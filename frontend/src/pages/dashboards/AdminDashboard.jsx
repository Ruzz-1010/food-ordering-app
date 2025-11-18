// AdminDashboard.jsx - Fixed with stable header
import React, { useState } from 'react';
import { Menu, Utensils } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Import components
import AdminSidebar from '../../components/admin/AdminSidebar';
import DashboardTab from '../../components/admin/DashboardTab';
import UsersTab from '../../components/admin/UsersTab';
import RestaurantsTab from '../../components/admin/RestaurantsTab';
import OrdersTab from '../../components/admin/OrdersTab';

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
        return (
          <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Analytics & Reports</h2>
            <div className="text-center py-12">
              <Utensils size={48} className="mx-auto mb-4 text-orange-400" />
              <p className="text-gray-600 text-lg">Advanced analytics coming soon!</p>
              <p className="text-gray-500">Sales reports, customer insights, and performance metrics</p>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ System Settings</h2>
            <div className="text-center py-12">
              <Utensils size={48} className="mx-auto mb-4 text-orange-400" />
              <p className="text-gray-600 text-lg">System configuration panel</p>
              <p className="text-gray-500">Platform settings, notifications, and preferences</p>
            </div>
          </div>
        );
      
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
      <div className="flex-1 lg:ml-0 flex flex-col">
        {/* Fixed Header */}
        <header className="bg-white shadow-sm border-b border-orange-200 sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-orange-600" />
            </button>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {activeTab === 'dashboard' ? '🍽️ Dashboard Overview' : 
                 activeTab === 'restaurants' ? '🏪 Restaurant Management' :
                 activeTab === 'orders' ? '📦 Order Management' :
                 activeTab === 'users' ? '👥 User Management' : 
                 `📊 ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-orange-600">Administrator</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;