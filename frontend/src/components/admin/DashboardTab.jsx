// DashboardTab.jsx - TEMPORARY FIX WITH MOCK DATA
import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Utensils, 
  ChefHat, 
  AlertCircle, 
  Users, 
  Store, 
  Package, 
  DollarSign,
  TrendingUp,
  Activity,
  Eye,
  Wifi,
  WifiOff
} from 'lucide-react';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');

  const RAILWAY_BACKEND_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Test if backend endpoints exist
  const testBackendEndpoints = async () => {
    const token = localStorage.getItem('token');
    const endpoints = [
      '/admin/dashboard/stats',
      '/admin/users',
      '/admin/restaurants',
      '/admin/orders',
      '/admin/products',
      '/users',
      '/restaurants',
      '/orders'
    ];

    console.log('🔍 Testing backend endpoints...');
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${RAILWAY_BACKEND_URL}${endpoint}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`${endpoint}: ERROR`);
      }
    }
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError('');
      setBackendStatus('checking');
      
      const token = localStorage.getItem('token');
      
      console.log('🚂 Testing backend connection...');

      if (!token) {
        setError('Please login to access admin dashboard');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // First, test what endpoints are available
      await testBackendEndpoints();

      // Since endpoints are returning 404, we'll use mock data for now
      console.log('📊 Using mock data - endpoints not available');
      
      // Mock data - replace these with actual numbers from your database
      const mockStats = {
        totalUsers: 156,
        totalRestaurants: 23,
        totalOrders: 489,
        totalRevenue: 125640,
        totalProducts: 167,
        pendingOrders: 12,
        completedOrders: 450
      };

      const mockRecentActivity = [
        {
          _id: '1',
          orderNumber: 'ORD-001',
          customer: { name: 'Juan Dela Cruz' },
          status: 'delivered',
          totalAmount: 450,
          createdAt: new Date().toISOString()
        },
        {
          _id: '2', 
          orderNumber: 'ORD-002',
          customer: { name: 'Maria Santos' },
          status: 'preparing',
          totalAmount: 320,
          createdAt: new Date(Date.now() - 1000000).toISOString()
        },
        {
          _id: '3',
          orderNumber: 'ORD-003',
          customer: { name: 'Pedro Reyes' },
          status: 'pending',
          totalAmount: 280,
          createdAt: new Date(Date.now() - 2000000).toISOString()
        }
      ];

      setStats(mockStats);
      setRecentActivity(mockRecentActivity);
      setLastUpdated(new Date().toLocaleTimeString());
      setBackendStatus('mock');

    } catch (error) {
      console.error('❌ Backend test failed:', error);
      setError(`Backend connection issue: Endpoints not found. Please check your backend routes.`);
      setBackendStatus('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  // Stats Card Component
  const StatsCard = ({ title, value, color, icon: Icon, subtitle, loading }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
            {loading ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            ) : (
              value
            )}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${color} ml-3 flex-shrink-0 shadow-sm`}>
          <Icon size={18} className="sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      preparing: { color: 'bg-orange-100 text-orange-800', label: 'Preparing' },
      ready: { color: 'bg-purple-100 text-purple-800', label: 'Ready' },
      out_for_delivery: { color: 'bg-indigo-100 text-indigo-800', label: 'Out for Delivery' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getBackendStatusColor = () => {
    switch (backendStatus) {
      case 'connected': return 'bg-green-500';
      case 'mock': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBackendStatusText = () => {
    switch (backendStatus) {
      case 'connected': return 'Connected to Backend';
      case 'mock': return 'Using Demo Data';
      case 'error': return 'Connection Failed';
      default: return 'Checking Connection';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Dashboard Overview</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {backendStatus === 'mock' ? 'Demo Data - Backend endpoints not configured' : 'Real-time Analytics'}
            {lastUpdated && ` • Last updated: ${lastUpdated}`}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center shadow-sm"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span className="text-sm sm:text-base">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Connection Status */}
      <div className={`p-4 rounded-lg border ${
        backendStatus === 'connected' ? 'bg-green-50 border-green-200' :
        backendStatus === 'mock' ? 'bg-yellow-50 border-yellow-200' :
        backendStatus === 'error' ? 'bg-red-50 border-red-200' :
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getBackendStatusColor()} animate-pulse`}></div>
            <div>
              <p className={`text-sm font-medium ${
                backendStatus === 'connected' ? 'text-green-900' :
                backendStatus === 'mock' ? 'text-yellow-900' :
                backendStatus === 'error' ? 'text-red-900' :
                'text-blue-900'
              }`}>
                {getBackendStatusText()}
              </p>
              <p className="text-xs text-gray-600">
                {RAILWAY_BACKEND_URL}
              </p>
            </div>
          </div>
          {backendStatus === 'mock' && (
            <button 
              onClick={() => console.log('Testing endpoints...')}
              className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
            >
              Check Endpoints
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Backend Configuration Required</p>
              <p className="text-red-700 text-sm">{error}</p>
              <div className="mt-3 space-y-2">
                <p className="text-xs text-red-600">
                  <strong>Missing Endpoints:</strong><br/>
                  • /api/admin/dashboard/stats<br/>
                  • /api/admin/users<br/>
                  • /api/admin/restaurants<br/>
                  • /api/admin/orders<br/>
                  • /api/admin/products
                </p>
                <button 
                  onClick={() => window.open('https://railway.app', '_blank')}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Check Railway Backend
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          color="bg-blue-500"
          icon={Users}
          subtitle="Registered accounts"
          loading={loading}
        />
        <StatsCard
          title="Total Restaurants"
          value={stats.totalRestaurants.toLocaleString()}
          color="bg-orange-500"
          icon={Store}
          subtitle="Active partners"
          loading={loading}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          color="bg-green-500"
          icon={Package}
          subtitle="All-time orders"
          loading={loading}
        />
        <StatsCard
          title="Total Revenue"
          value={`₱${stats.totalRevenue.toLocaleString()}`}
          color="bg-purple-500"
          icon={DollarSign}
          subtitle="From completed orders"
          loading={loading}
        />
      </div>

      {/* Demo Data Notice */}
      {backendStatus === 'mock' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 font-medium">Demo Data Active</p>
              <p className="text-yellow-700 text-sm">
                This is sample data. To see real data, you need to create admin endpoints in your backend.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity size={20} className="text-orange-600 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="border border-orange-100 rounded-lg p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {activity.orderNumber || `Order #${activity._id}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {activity.customer?.name || 'Customer'}
                    </p>
                  </div>
                  <StatusBadge status={activity.status} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-orange-600">
                    ₱{(activity.totalAmount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Eye size={20} className="text-blue-600 mr-2" />
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Backend API</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                backendStatus === 'connected' ? 'bg-green-100 text-green-800' :
                backendStatus === 'mock' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {backendStatus === 'connected' ? 'Connected' :
                 backendStatus === 'mock' ? 'Demo Mode' : 'Offline'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Authentication</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Active
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Data Source</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                {backendStatus === 'connected' ? 'Live Database' : 'Demo Data'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-2 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors">
                Check Endpoints
              </button>
              <button className="p-2 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors">
                View Logs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      {backendStatus !== 'connected' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🚀 Next Steps to Enable Real Data</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Create admin endpoints in your backend (Node.js/Express)</li>
            <li>Add routes for: /admin/users, /admin/restaurants, /admin/orders</li>
            <li>Implement authentication middleware</li>
            <li>Return data in format: {"{ success: true, data: [...] }"}</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;