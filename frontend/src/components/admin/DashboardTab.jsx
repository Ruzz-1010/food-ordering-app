// DashboardTab.jsx - UPDATED TO HANDLE MISSING ENDPOINTS
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

  // Enhanced fetch function that handles missing endpoints gracefully
  const fetchWithFallback = async (endpoint, endpointName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${RAILWAY_BACKEND_URL}${endpoint}`, {
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

      // Process different response formats
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      } else if (data.success && Array.isArray(data[endpointName.toLowerCase()])) {
        return data[endpointName.toLowerCase()];
      } else if (Array.isArray(data)) {
        return data;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      }
      
      return [];
    } catch (error) {
      console.warn(`⚠️ ${endpointName} fetch error:`, error.message);
      return null; // Return null to indicate endpoint not available
    }
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError('');
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      console.log('🚀 DashboardTab - Starting data fetch...');
      console.log('🔑 Token present:', !!token);

      if (!token) {
        setError('Please login to access admin dashboard');
        return;
      }

      // Test which endpoints are available first
      console.log('🔍 Testing endpoint availability...');
      
      const endpoints = [
        { path: '/users', name: 'Users' },
        { path: '/restaurants', name: 'Restaurants' },
        { path: '/orders', name: 'Orders' },
        { path: '/products', name: 'Products' }
      ];

      const availabilityResults = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${RAILWAY_BACKEND_URL}${endpoint.path}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          availabilityResults.push({
            name: endpoint.name,
            available: response.ok,
            status: response.status
          });
          console.log(`🔍 ${endpoint.name} endpoint: ${response.ok ? '✅ Available' : '❌ Not available'} (${response.status})`);
        } catch (error) {
          availabilityResults.push({
            name: endpoint.name,
            available: false,
            status: 'Error'
          });
          console.log(`🔍 ${endpoint.name} endpoint: ❌ Not available (Error)`);
        }
      }

      setAvailableEndpoints(availabilityResults);

      // Fetch data from available endpoints
      const [usersArray, restaurantsArray, ordersArray, productsArray] = await Promise.all([
        fetchWithFallback('/users', 'Users'),
        fetchWithFallback('/restaurants', 'Restaurants'),
        fetchWithFallback('/orders', 'Orders'),
        fetchWithFallback('/products', 'Products')
      ]);

      console.log('📊 Data fetch results:', {
        users: usersArray ? `${usersArray.length} records` : 'Not available',
        restaurants: restaurantsArray ? `${restaurantsArray.length} records` : 'Not available',
        orders: ordersArray ? `${ordersArray.length} records` : 'Not available',
        products: productsArray ? `${productsArray.length} records` : 'Not available'
      });

      // Calculate statistics with fallback values for missing data
      const finalUsersArray = usersArray || [];
      const finalRestaurantsArray = restaurantsArray || [];
      const finalOrdersArray = ordersArray || [];
      const finalProductsArray = productsArray || [];

      const deliveredOrders = finalOrdersArray.filter(order => 
        order.status === 'delivered' || order.status === 'completed'
      );
      
      const pendingOrders = finalOrdersArray.filter(order => 
        order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing'
      );

      const revenue = deliveredOrders.reduce((total, order) => {
        const amount = order.totalAmount || order.total || order.amount || 0;
        return total + Number(amount);
      }, 0);

      // Get recent activity (only if orders are available)
      const recentOrders = finalOrdersArray.length > 0 
        ? finalOrdersArray
            .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate))
            .slice(0, 5)
        : [];

      setStats({
        totalUsers: finalUsersArray.length,
        totalRestaurants: finalRestaurantsArray.length,
        totalOrders: finalOrdersArray.length,
        totalRevenue: revenue,
        totalProducts: finalProductsArray.length,
        pendingOrders: pendingOrders.length,
        completedOrders: deliveredOrders.length
      });

      setRecentActivity(recentOrders);
      setLastUpdated(new Date().toLocaleTimeString());

      // Show warning if some endpoints are missing
      const missingEndpoints = availabilityResults.filter(ep => !ep.available).map(ep => ep.name);
      if (missingEndpoints.length > 0) {
        console.warn(`⚠️ Missing endpoints: ${missingEndpoints.join(', ')}`);
      }

    } catch (error) {
      console.error('❌ DashboardTab - Fetch error:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Dashboard Overview</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Real-time data from your database
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
              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Endpoint Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Backend Endpoint Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {availableEndpoints.map((endpoint, index) => (
            <div key={index} className={`flex items-center space-x-2 p-2 rounded ${
              endpoint.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${endpoint.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{endpoint.name}</span>
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

      {/* Recent Activity & Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity size={20} className="text-orange-600 mr-2" />
            Recent Activity
            {!isEndpointAvailable('Orders') && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                No Data
              </span>
            )}
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
              <div className="text-center py-8">
                <Clock size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">
                  {isEndpointAvailable('Orders') ? 'No recent orders' : 'Orders endpoint not available'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {isEndpointAvailable('Orders') ? 'Orders will appear here' : 'Add /api/orders endpoint to backend'}
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
        </div>
      </div>

      {/* Setup Instructions */}
      {availableEndpoints.some(ep => !ep.available) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">🚧 Backend Setup Required</h4>
          <p className="text-sm text-yellow-800 mb-3">
            Some endpoints are missing from your backend. To get complete dashboard functionality, add these endpoints:
          </p>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            {availableEndpoints.filter(ep => !ep.available).map((endpoint, index) => (
              <li key={index}>
                <code className="bg-yellow-100 px-1 rounded">/api{endpoint.name.toLowerCase()}</code> - {endpoint.name} data
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-xs text-gray-600">
            <strong>Backend:</strong> Railway • 
            <strong> Available Data:</strong> {availableEndpoints.filter(ep => ep.available).length}/4 endpoints
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>v1.0.0</span>
            <span>Real-time data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;