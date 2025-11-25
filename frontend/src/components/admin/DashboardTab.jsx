// DashboardTab.jsx - CLEANED UP VERSION
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
  BarChart3,
  Clock
} from 'lucide-react';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');

  const RAILWAY_BACKEND_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Fetch from admin endpoints
  const fetchAdminData = async (endpoint, endpointName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${RAILWAY_BACKEND_URL}/admin${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`${endpointName} API failed: ${response.status}`);
      }

      const data = await response.json();

      // Process response format
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      } else if (data.success && Array.isArray(data[endpointName.toLowerCase()])) {
        return data[endpointName.toLowerCase()];
      } else if (data.success && data.data && typeof data.data === 'object') {
        // For dashboard stats
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      }
      
      return data.data || [];
    } catch (error) {
      console.error(`${endpointName} fetch error:`, error);
      throw error;
    }
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError('');
      setLoading(true);
      
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Please login to access admin dashboard');
        return;
      }

      // Try to get data from dashboard stats first (most efficient)
      try {
        const dashboardData = await fetchAdminData('/dashboard/stats', 'Dashboard Stats');
        
        setStats({
          totalUsers: dashboardData.totalUsers || 0,
          totalRestaurants: dashboardData.totalRestaurants || 0,
          totalOrders: dashboardData.totalOrders || 0,
          totalRevenue: dashboardData.totalRevenue || 0,
          totalProducts: dashboardData.totalProducts || 0,
          pendingOrders: 0
        });
        
        // Get recent orders for activity
        try {
          const ordersData = await fetchAdminData('/orders', 'Orders');
          const recentOrders = ordersData
            .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate))
            .slice(0, 5);
          setRecentActivity(recentOrders);

          // Calculate pending orders
          const pendingOrders = ordersData.filter(order => 
            order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing'
          ).length;

          setStats(prev => ({ ...prev, pendingOrders }));

        } catch (ordersError) {
          setRecentActivity([]);
        }
        
      } catch (dashboardError) {
        // Fallback to individual endpoints
        await fetchIndividualData();
      }

      setLastUpdated(new Date().toLocaleTimeString());

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchIndividualData = async () => {
    // Fetch data from individual endpoints
    const endpoints = [
      { path: '/users', name: 'Users', key: 'users' },
      { path: '/restaurants', name: 'Restaurants', key: 'restaurants' },
      { path: '/orders', name: 'Orders', key: 'orders' },
      { path: '/products', name: 'Products', key: 'products' }
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        results[endpoint.key] = await fetchAdminData(endpoint.path, endpoint.name);
      } catch (error) {
        results[endpoint.key] = [];
      }
    }

    // Calculate statistics
    const ordersArray = results.orders || [];
    const deliveredOrders = ordersArray.filter(order => 
      order.status === 'delivered' || order.status === 'completed'
    );
    
    const pendingOrders = ordersArray.filter(order => 
      order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing'
    );

    const revenue = deliveredOrders.reduce((total, order) => {
      const amount = order.totalAmount || order.total || order.amount || 0;
      return total + Number(amount);
    }, 0);

    // Get recent activity
    const recentOrders = ordersArray
      .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate))
      .slice(0, 5);

    setStats({
      totalUsers: results.users?.length || 0,
      totalRestaurants: results.restaurants?.length || 0,
      totalOrders: ordersArray.length,
      totalRevenue: revenue,
      totalProducts: results.products?.length || 0,
      pendingOrders: pendingOrders.length
    });

    setRecentActivity(recentOrders);
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900"> Dashboard Overview</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Admin Dashboard - Real-time Data
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Data Loading Error</p>
            <p className="text-red-700 text-sm">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

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
                        {activity.orderNumber || `Order #${activity._id?.substring(0, 8) || index + 1}`}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {activity.customer?.name || activity.user?.name || 'Customer'}
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
              <div className="text-center py-8">
                <Clock size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No recent orders</p>
                <p className="text-sm text-gray-400 mt-1">Orders will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 size={20} className="text-blue-600 mr-2" />
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Order Completion Rate</span>
              <span className="text-lg font-bold text-green-600">
                {stats.totalOrders > 0 ? ((stats.totalOrders - stats.pendingOrders) / stats.totalOrders * 100).toFixed(1) : 0}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Average Order Value</span>
              <span className="text-lg font-bold text-purple-600">
                ₱{stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(0) : 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Orders per Restaurant</span>
              <span className="text-lg font-bold text-orange-600">
                {stats.totalRestaurants > 0 ? (stats.totalOrders / stats.totalRestaurants).toFixed(1) : 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Daily Order Rate</span>
              <span className="text-lg font-bold text-blue-600">
                {Math.round(stats.totalOrders / 30)}/day
              </span>
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
            <div className="text-sm font-medium text-green-800 mt-1">Backend Online</div>
            <div className="text-xs text-green-600">Railway</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalUsers + stats.totalRestaurants + stats.totalOrders}
            </div>
            <div className="text-sm font-medium text-blue-800 mt-1">Total Records</div>
            <div className="text-xs text-blue-600">Live Data</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalRevenue > 0 ? '₱' + stats.totalRevenue.toLocaleString() : '₱0'}
            </div>
            <div className="text-sm font-medium text-purple-800 mt-1">Total Revenue</div>
            <div className="text-xs text-purple-600">All Time</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{lastUpdated || '--:--'}</div>
            <div className="text-sm font-medium text-orange-800 mt-1">Last Sync</div>
            <div className="text-xs text-orange-600">Real-time</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;