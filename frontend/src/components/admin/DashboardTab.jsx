// DashboardTab.jsx - COMPLETE UPDATED VERSION FOR ADMIN ENDPOINTS
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
  Clock,
  CheckCircle,
  XCircle
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
  const [availableEndpoints, setAvailableEndpoints] = useState([]);

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
      console.log(`✅ ${endpointName} API Response:`, data);

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
      console.error(`❌ ${endpointName} fetch error:`, error);
      throw error;
    }
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError('');
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      console.log('🚀 DashboardTab - Starting admin data fetch...');
      console.log('🔑 Token present:', !!token);

      if (!token) {
        setError('Please login to access admin dashboard');
        return;
      }

      // Test admin endpoints availability
      console.log('🔍 Testing admin endpoints availability...');
      
      const endpoints = [
        { path: '/dashboard/stats', name: 'Dashboard Stats' },
        { path: '/users', name: 'Users' },
        { path: '/restaurants', name: 'Restaurants' },
        { path: '/orders', name: 'Orders' },
        { path: '/products', name: 'Products' }
      ];

      const availabilityResults = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${RAILWAY_BACKEND_URL}/admin${endpoint.path}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          availabilityResults.push({
            name: endpoint.name,
            available: response.ok,
            status: response.status,
            path: endpoint.path
          });
          console.log(`🔍 ${endpoint.name}: ${response.ok ? '✅ Available' : '❌ Not available'} (${response.status})`);
        } catch (error) {
          availabilityResults.push({
            name: endpoint.name,
            available: false,
            status: 'Error',
            path: endpoint.path
          });
          console.log(`🔍 ${endpoint.name}: ❌ Not available (Error)`);
        }
      }

      setAvailableEndpoints(availabilityResults);

      // Try to get data from dashboard stats first (most efficient)
      const dashboardStatsAvailable = availabilityResults.find(ep => ep.path === '/dashboard/stats')?.available;
      
      if (dashboardStatsAvailable) {
        console.log('📊 Using dashboard stats endpoint...');
        try {
          const dashboardData = await fetchAdminData('/dashboard/stats', 'Dashboard Stats');
          console.log('✅ Dashboard stats data:', dashboardData);
          
          setStats({
            totalUsers: dashboardData.totalUsers || 0,
            totalRestaurants: dashboardData.totalRestaurants || 0,
            totalOrders: dashboardData.totalOrders || 0,
            totalRevenue: dashboardData.totalRevenue || 0,
            totalProducts: dashboardData.totalProducts || 0,
            pendingOrders: 0, // You might want to calculate this
            completedOrders: 0 // You might want to calculate this
          });
          
          // If we have dashboard stats, we still need recent orders for activity
          try {
            const ordersData = await fetchAdminData('/orders', 'Orders');
            const recentOrders = ordersData
              .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate))
              .slice(0, 5);
            setRecentActivity(recentOrders);
          } catch (ordersError) {
            console.warn('Could not fetch recent orders for activity');
            setRecentActivity([]);
          }
          
        } catch (dashboardError) {
          console.warn('Dashboard stats failed, falling back to individual endpoints');
          await fetchIndividualData(availabilityResults);
        }
      } else {
        // Fallback to individual endpoints
        console.log('🔄 Using individual endpoints...');
        await fetchIndividualData(availabilityResults);
      }

      setLastUpdated(new Date().toLocaleTimeString());

    } catch (error) {
      console.error('❌ DashboardTab - Fetch error:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchIndividualData = async (availabilityResults) => {
    // Fetch data from available individual endpoints
    const endpoints = [
      { path: '/users', name: 'Users', key: 'users' },
      { path: '/restaurants', name: 'Restaurants', key: 'restaurants' },
      { path: '/orders', name: 'Orders', key: 'orders' },
      { path: '/products', name: 'Products', key: 'products' }
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      const isAvailable = availabilityResults.find(ep => ep.path === endpoint.path)?.available;
      if (isAvailable) {
        try {
          results[endpoint.key] = await fetchAdminData(endpoint.path, endpoint.name);
        } catch (error) {
          console.warn(`Failed to fetch ${endpoint.name}:`, error);
          results[endpoint.key] = [];
        }
      } else {
        results[endpoint.key] = [];
      }
    }

    console.log('📊 Individual data results:', {
      users: results.users?.length || 0,
      restaurants: results.restaurants?.length || 0,
      orders: results.orders?.length || 0,
      products: results.products?.length || 0
    });

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
      pendingOrders: pendingOrders.length,
      completedOrders: deliveredOrders.length
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
  const StatsCard = ({ title, value, color, icon: Icon, subtitle, loading, unavailable = false }) => (
    <div className={`rounded-xl shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow ${
      unavailable 
        ? 'bg-gray-100 border-gray-300 opacity-60' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
            {loading ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            ) : unavailable ? (
              'N/A'
            ) : (
              value
            )}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {unavailable && (
            <p className="text-xs text-red-500 mt-1">Endpoint not available</p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${color} ml-3 flex-shrink-0 shadow-sm ${
          unavailable ? 'opacity-50' : ''
        }`}>
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

  const isEndpointAvailable = (endpointName) => {
    return availableEndpoints.find(ep => ep.name === endpointName)?.available || false;
  };

  const getEndpointStatus = (endpointName) => {
    const endpoint = availableEndpoints.find(ep => ep.name === endpointName);
    return endpoint ? { available: endpoint.available, status: endpoint.status } : { available: false, status: 'Unknown' };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Dashboard Overview</h2>
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

      {/* Admin Endpoints Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-3">Admin Endpoints Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          {availableEndpoints.map((endpoint, index) => (
            <div key={index} className={`flex items-center justify-between p-2 rounded ${
              endpoint.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${endpoint.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">{endpoint.name.split(' ')[0]}</span>
              </div>
              <span className="text-xs opacity-75">{endpoint.status}</span>
            </div>
          ))}
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
          unavailable={!isEndpointAvailable('Users')}
        />
        <StatsCard
          title="Total Restaurants"
          value={stats.totalRestaurants.toLocaleString()}
          color="bg-orange-500"
          icon={Store}
          subtitle="Active partners"
          loading={loading}
          unavailable={!isEndpointAvailable('Restaurants')}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          color="bg-green-500"
          icon={Package}
          subtitle="All-time orders"
          loading={loading}
          unavailable={!isEndpointAvailable('Orders')}
        />
        <StatsCard
          title="Total Revenue"
          value={`₱${stats.totalRevenue.toLocaleString()}`}
          color="bg-purple-500"
          icon={DollarSign}
          subtitle="From completed orders"
          loading={loading}
          unavailable={!isEndpointAvailable('Orders')}
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
          unavailable={!isEndpointAvailable('Orders')}
        />
        <StatsCard
          title="Completed Orders"
          value={stats.completedOrders.toLocaleString()}
          color="bg-green-500"
          icon={TrendingUp}
          subtitle="Successfully delivered"
          loading={loading}
          unavailable={!isEndpointAvailable('Orders')}
        />
        <StatsCard
          title="Menu Products"
          value={stats.totalProducts.toLocaleString()}
          color="bg-red-500"
          icon={Utensils}
          subtitle="Total food items"
          loading={loading}
          unavailable={!isEndpointAvailable('Products')}
        />
      </div>

      {/* Recent Activity & Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity size={20} className="text-orange-600 mr-2" />
              Recent Activity
            </h3>
            {!isEndpointAvailable('Orders') && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                No Data
              </span>
            )}
          </div>
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
                <p className="text-gray-500">
                  {isEndpointAvailable('Orders') ? 'No recent orders' : 'Orders endpoint not available'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {isEndpointAvailable('Orders') ? 'Orders will appear here' : 'Add /api/admin/orders endpoint to backend'}
                </p>
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
                {stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Average Order Value</span>
              <span className="text-lg font-bold text-purple-600">
                ₱{stats.completedOrders > 0 ? (stats.totalRevenue / stats.completedOrders).toFixed(0) : 0}
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
            <div className="text-sm font-medium text-green-800 mt-1">Backend Online</div>
            <div className="text-xs text-green-600">Railway</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {availableEndpoints.filter(ep => ep.available).length}/{availableEndpoints.length}
            </div>
            <div className="text-sm font-medium text-blue-800 mt-1">Endpoints</div>
            <div className="text-xs text-blue-600">Active</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalUsers + stats.totalRestaurants + stats.totalOrders}
            </div>
            <div className="text-sm font-medium text-purple-800 mt-1">Total Records</div>
            <div className="text-xs text-purple-600">Live Data</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{lastUpdated || '--:--'}</div>
            <div className="text-sm font-medium text-orange-800 mt-1">Last Sync</div>
            <div className="text-xs text-orange-600">Real-time</div>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      {availableEndpoints.some(ep => !ep.available) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">🚧 Admin Backend Setup Required</h4>
          <p className="text-sm text-yellow-800 mb-3">
            Some admin endpoints are missing. Make sure you've added this to your server.js:
          </p>
          <code className="block bg-yellow-100 p-2 rounded text-sm mb-3">
            app.use('/api/admin', adminRoutes);
          </code>
          <p className="text-sm text-yellow-800">
            Missing endpoints: {availableEndpoints.filter(ep => !ep.available).map(ep => ep.name).join(', ')}
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-xs text-gray-600">
            <strong>Backend:</strong> Railway • 
            <strong> Admin Endpoints:</strong> {availableEndpoints.filter(ep => ep.available).length}/5 active
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>v1.0.0</span>
            <span>Real-time Admin Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;