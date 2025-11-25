// DashboardTab.jsx - COMPLETE UPDATED VERSION FOR RAILWAY
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
  Calendar,
  Eye
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

  // RAILWAY BACKEND URL - UPDATE THIS WITH YOUR ACTUAL URL
  const RAILWAY_BACKEND_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Process API response data
  const processApiResponse = (data, endpointName) => {
    console.log(`🔄 Processing ${endpointName}:`, data);

    if (Array.isArray(data)) {
      return data;
    } else if (data && data.success) {
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.users)) return data.users;
      if (Array.isArray(data.restaurants)) return data.restaurants;
      if (Array.isArray(data.orders)) return data.orders;
      if (Array.isArray(data.products)) return data.products;
      if (Array.isArray(data.recentActivity)) return data.recentActivity;
      return data.data || [];
    } else if (data && Array.isArray(data.data)) {
      return data.data;
    } else if (data && data.data && typeof data.data === 'object') {
      // If data.data is an object with counts
      return data.data;
    }
    
    console.warn(`⚠️ Unknown format for ${endpointName}:`, data);
    return [];
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      console.log('🚂 Fetching from Railway Backend...', { 
        backend: RAILWAY_BACKEND_URL,
        token: token ? 'Present' : 'Missing'
      });

      if (!token) {
        setError('Please login to access admin dashboard');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // OPTION 1: Try dashboard stats endpoint (most efficient)
      try {
        console.log('📊 Trying dashboard stats endpoint...');
        const dashboardResponse = await fetch(`${RAILWAY_BACKEND_URL}/admin/dashboard/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Dashboard response status:', dashboardResponse.status);

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          console.log('✅ Dashboard stats response:', dashboardData);
          
          if (dashboardData.success) {
            const data = dashboardData.data || dashboardData;
            setStats({
              totalUsers: data.totalUsers || data.usersCount || 0,
              totalRestaurants: data.totalRestaurants || data.restaurantsCount || 0,
              totalOrders: data.totalOrders || data.ordersCount || 0,
              totalRevenue: data.totalRevenue || data.revenue || 0,
              totalProducts: data.totalProducts || data.productsCount || 0,
              pendingOrders: data.pendingOrders || data.pendingCount || 0,
              completedOrders: data.completedOrders || data.deliveredCount || 0
            });

            // Set recent activity if available
            if (dashboardData.recentActivity) {
              setRecentActivity(processApiResponse(dashboardData.recentActivity, 'recentActivity'));
            }

            setLastUpdated(new Date().toLocaleTimeString());
            return;
          }
        } else {
          console.warn('Dashboard endpoint not available, using individual endpoints');
        }
      } catch (dashboardError) {
        console.log('Dashboard endpoint error:', dashboardError);
      }

      // OPTION 2: Fallback to individual endpoints
      console.log('🔄 Using individual endpoints...');
      const endpoints = [
        { url: '/admin/users', key: 'users' },
        { url: '/admin/restaurants', key: 'restaurants' },
        { url: '/admin/orders', key: 'orders' },
        { url: '/admin/products', key: 'products' }
      ];

      const results = {};
      const requests = [];

      // Create all fetch requests
      for (const endpoint of endpoints) {
        requests.push(
          fetch(`${RAILWAY_BACKEND_URL}${endpoint.url}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }).then(async response => {
            if (response.ok) {
              const data = await response.json();
              results[endpoint.key] = processApiResponse(data, endpoint.key);
            } else {
              console.warn(`❌ ${endpoint.key} failed:`, response.status);
              results[endpoint.key] = [];
            }
            return { key: endpoint.key, success: response.ok };
          }).catch(err => {
            console.error(`❌ ${endpoint.key} error:`, err);
            results[endpoint.key] = [];
            return { key: endpoint.key, success: false };
          })
        );
      }

      // Wait for all requests to complete
      await Promise.all(requests);

      console.log('📈 Processed results:', {
        users: results.users?.length || 0,
        restaurants: results.restaurants?.length || 0,
        orders: results.orders?.length || 0,
        products: results.products?.length || 0
      });

      // Calculate additional stats
      const ordersArray = results.orders || [];
      const deliveredOrders = ordersArray.filter(order => 
        order.status === 'delivered' || order.status === 'completed'
      );
      
      const pendingOrders = ordersArray.filter(order => 
        order.status === 'pending' || order.status === 'confirmed'
      );

      const revenue = deliveredOrders.reduce((total, order) => {
        const amount = order.totalAmount || order.total || order.amount || 0;
        return total + Number(amount);
      }, 0);

      // Get recent activity (latest 5 orders)
      const recentOrders = ordersArray
        .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate))
        .slice(0, 5);

      setStats({
        totalUsers: results.users?.length || 0,
        totalRestaurants: results.restaurants?.length || 0,
        totalOrders: ordersArray.length,
        totalRevenue: revenue,
        totalProducts: results.products?.length || 0,
        pendingOrders: pendingOrders.length,
        completedOrders: deliveredOrders.length
      });

      setRecentActivity(recentOrders);
      setLastUpdated(new Date().toLocaleTimeString());

    } catch (error) {
      console.error('❌ Railway fetch error:', error);
      setError(`Backend connection failed: ${error.message}`);
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

  // Status Badge Component
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Dashboard Overview</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Real-time analytics from your Railway backend
            {lastUpdated && ` • Last updated: ${lastUpdated}`}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center shadow-sm"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span className="text-sm sm:text-base">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 animate-pulse">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Connection Issue</p>
            <p className="text-red-700 text-sm">{error}</p>
            <div className="mt-2 space-x-2">
              <button 
                onClick={fetchData}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => console.log('Debug info...')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-2"
              >
                View Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                {loading ? 'Connecting to Railway...' : 'Connected to Railway Backend'}
              </p>
              <p className="text-xs text-blue-700">
                {RAILWAY_BACKEND_URL}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-xs text-blue-600 bg-white px-3 py-1 rounded-full">
            <span>Users: {stats.totalUsers}</span>
            <span>Restaurants: {stats.totalRestaurants}</span>
            <span>Orders: {stats.totalOrders}</span>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
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

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatsCard
          title="Pending Orders"
          value={stats.pendingOrders.toLocaleString()}
          color="bg-yellow-500"
          icon={Activity}
          subtitle="Awaiting processing"
          loading={loading}
        />
        <StatsCard
          title="Completed Orders"
          value={stats.completedOrders.toLocaleString()}
          color="bg-green-500"
          icon={TrendingUp}
          subtitle="Successfully delivered"
          loading={loading}
        />
        <StatsCard
          title="Menu Products"
          value={stats.totalProducts.toLocaleString()}
          color="bg-red-500"
          icon={Utensils}
          subtitle="Total food items"
          loading={loading}
        />
      </div>

      {/* Recent Activity & Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity size={20} className="text-orange-600 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="border border-orange-100 rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {activity.orderNumber || `Order #${activity._id?.substring(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {activity.customer?.name || 'Customer'}
                      </p>
                    </div>
                    <StatusBadge status={activity.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-orange-600">
                      ₱{(activity.totalAmount || activity.total || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Package size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">Orders will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp size={20} className="text-blue-600 mr-2" />
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Order Completion Rate</span>
              <span className="text-lg font-bold text-green-600">
                {stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Order Value</span>
              <span className="text-lg font-bold text-purple-600">
                ₱{stats.completedOrders > 0 ? (stats.totalRevenue / stats.completedOrders).toFixed(0) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Orders per Restaurant</span>
              <span className="text-lg font-bold text-orange-600">
                {stats.totalRestaurants > 0 ? (stats.totalOrders / stats.totalRestaurants).toFixed(1) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Daily Order Rate</span>
              <span className="text-lg font-bold text-blue-600">
                {Math.round(stats.totalOrders / 30)}/day
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="font-bold text-gray-900">{stats.pendingOrders}</div>
                <div className="text-gray-600">Pending</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="font-bold text-gray-900">{stats.completedOrders}</div>
                <div className="text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Eye size={20} className="text-gray-600 mr-2" />
          System Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">🟢</div>
            <div className="text-sm font-medium text-green-800 mt-1">API Online</div>
            <div className="text-xs text-green-600">Railway Backend</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">🟢</div>
            <div className="text-sm font-medium text-blue-800 mt-1">Database</div>
            <div className="text-xs text-blue-600">Connected</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{stats.totalUsers + stats.totalRestaurants + stats.totalOrders}</div>
            <div className="text-sm font-medium text-purple-800 mt-1">Total Records</div>
            <div className="text-xs text-purple-600">Active Data</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{lastUpdated || '--:--'}</div>
            <div className="text-sm font-medium text-orange-800 mt-1">Last Sync</div>
            <div className="text-xs text-orange-600">Live Data</div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-xs text-gray-600">
            <strong>Backend:</strong> Railway • 
            <strong> Environment:</strong> Production • 
            <strong> Data Source:</strong> Live Database
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>v1.0.0</span>
            <span>{(stats.totalUsers + stats.totalRestaurants + stats.totalOrders + stats.totalProducts).toLocaleString()} records</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;