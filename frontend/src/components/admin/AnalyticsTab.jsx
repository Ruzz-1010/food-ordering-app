// AnalyticsTab.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Store, Package, DollarSign, 
  Calendar, RefreshCw, Clock, BarChart3, PieChart, AlertCircle 
} from 'lucide-react';

const AnalyticsTab = () => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRestaurants: 0,
    recentOrders: [],
    topRestaurants: [],
    orderStats: {}
  });
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const RAILWAY_BACKEND_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Enhanced fetch function with better error handling
  const fetchData = async (endpoint) => {
    try {
      const token = localStorage.getItem('token');
      console.log(`🔄 Fetching from: ${RAILWAY_BACKEND_URL}${endpoint}`);
      
      const response = await fetch(`${RAILWAY_BACKEND_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📊 Response status for ${endpoint}:`, response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📦 Data received from ${endpoint}:`, data);

      // Handle different response structures
      if (data.success) {
        return data.data || data.orders || data.users || data.restaurants || [];
      }
      
      if (Array.isArray(data)) {
        return data;
      }
      
      return data || [];

    } catch (error) {
      console.error(`❌ Error fetching ${endpoint}:`, error);
      throw error;
    }
  };

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to access analytics');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('🚀 Starting analytics data fetch...');

      // Try different endpoint variations
      let ordersData = [];
      let usersData = [];
      let restaurantsData = [];

      try {
        // Try multiple possible endpoints for orders
        ordersData = await fetchData('/orders') || 
                    await fetchData('/admin/orders') || 
                    [];
      } catch (orderError) {
        console.error('Failed to fetch orders:', orderError);
        // Continue with empty orders data
      }

      try {
        // Try multiple possible endpoints for users
        usersData = await fetchData('/users') || 
                   await fetchData('/admin/users') || 
                   [];
      } catch (userError) {
        console.error('Failed to fetch users:', userError);
        // Continue with empty users data
      }

      try {
        // Try multiple possible endpoints for restaurants
        restaurantsData = await fetchData('/restaurants') || 
                        await fetchData('/admin/restaurants') || 
                        [];
      } catch (restaurantError) {
        console.error('Failed to fetch restaurants:', restaurantError);
        // Continue with empty restaurants data
      }

      console.log('📊 Raw data received:', {
        orders: ordersData,
        users: usersData,
        restaurants: restaurantsData
      });

      // Process orders data
      const deliveredOrders = Array.isArray(ordersData) ? ordersData.filter(order => 
        order.status === 'delivered' || order.status === 'completed'
      ) : [];

      console.log('✅ Delivered orders:', deliveredOrders);

      // Calculate total revenue (including service fee)
      const totalRevenue = deliveredOrders.reduce((total, order) => {
        const orderAmount = parseFloat(order.totalAmount || order.total || order.amount || 0);
        const serviceFee = 10; // ₱10 service fee per order
        return total + orderAmount + serviceFee;
      }, 0);

      console.log('💰 Total revenue calculated:', totalRevenue);

      // Calculate order statistics
      const orderStats = {
        pending: Array.isArray(ordersData) ? ordersData.filter(o => o.status === 'pending').length : 0,
        confirmed: Array.isArray(ordersData) ? ordersData.filter(o => o.status === 'confirmed').length : 0,
        preparing: Array.isArray(ordersData) ? ordersData.filter(o => o.status === 'preparing').length : 0,
        ready: Array.isArray(ordersData) ? ordersData.filter(o => o.status === 'ready').length : 0,
        out_for_delivery: Array.isArray(ordersData) ? ordersData.filter(o => o.status === 'out_for_delivery').length : 0,
        delivered: deliveredOrders.length,
        cancelled: Array.isArray(ordersData) ? ordersData.filter(o => o.status === 'cancelled').length : 0
      };

      console.log('📈 Order stats:', orderStats);

      // Calculate top restaurants
      const restaurantOrderCount = {};
      
      if (Array.isArray(ordersData)) {
        ordersData.forEach(order => {
          const restaurantId = order.restaurant?._id || order.restaurant?.id || order.restaurantId || 'unknown';
          const restaurantName = order.restaurant?.name || 'Unknown Restaurant';
          
          if (!restaurantOrderCount[restaurantId]) {
            restaurantOrderCount[restaurantId] = {
              count: 0,
              revenue: 0,
              name: restaurantName
            };
          }
          
          restaurantOrderCount[restaurantId].count++;
          
          if (order.status === 'delivered' || order.status === 'completed') {
            const orderAmount = parseFloat(order.totalAmount || order.total || order.amount || 0);
            const serviceFee = 10;
            restaurantOrderCount[restaurantId].revenue += orderAmount + serviceFee;
          }
        });
      }

      const topRestaurants = Object.entries(restaurantOrderCount)
        .map(([id, data]) => ({
          id,
          name: data.name,
          orders: data.count,
          revenue: data.revenue
        }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      console.log('🏆 Top restaurants:', topRestaurants);

      // Get recent orders
      const recentOrders = Array.isArray(ordersData) 
        ? ordersData
            .sort((a, b) => new Date(b.createdAt || b.orderDate || b.date) - new Date(a.createdAt || a.orderDate || a.date))
            .slice(0, 5)
        : [];

      console.log('🕒 Recent orders:', recentOrders);

      // Update analytics state
      const newAnalytics = {
        totalRevenue,
        totalOrders: Array.isArray(ordersData) ? ordersData.length : 0,
        totalUsers: Array.isArray(usersData) ? usersData.length : 0,
        totalRestaurants: Array.isArray(restaurantsData) ? restaurantsData.length : 0,
        recentOrders,
        topRestaurants,
        orderStats
      };

      console.log('🎯 Final analytics data:', newAnalytics);
      setAnalytics(newAnalytics);

    } catch (error) {
      console.error('❌ Analytics fetch error:', error);
      setError(`Failed to load analytics data: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const handleRefresh = () => {
    fetchAnalytics();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateCompletionRate = () => {
    return analytics.totalOrders > 0 
      ? ((analytics.orderStats.delivered / analytics.totalOrders) * 100).toFixed(1)
      : 0;
  };

  const calculateAverageOrderValue = () => {
    return analytics.orderStats.delivered > 0 
      ? (analytics.totalRevenue / analytics.orderStats.delivered).toFixed(0)
      : 0;
  };

  const calculateOrdersPerUser = () => {
    return analytics.totalUsers > 0 
      ? (analytics.totalOrders / analytics.totalUsers).toFixed(1)
      : 0;
  };

  // Test API endpoints function
  const testEndpoints = async () => {
    console.log('🧪 Testing API endpoints...');
    const endpoints = [
      '/orders',
      '/admin/orders',
      '/users', 
      '/admin/users',
      '/restaurants',
      '/admin/restaurants'
    ];

    for (const endpoint of endpoints) {
      try {
        const data = await fetchData(endpoint);
        console.log(`✅ ${endpoint}:`, Array.isArray(data) ? `${data.length} items` : 'Data received');
      } catch (error) {
        console.log(`❌ ${endpoint}:`, error.message);
      }
    }
  };

  // Call test on component mount for debugging
  useEffect(() => {
    testEndpoints();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics & Reports</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading analytics data...</p>
          <button 
            onClick={testEndpoints}
            className="mt-4 text-orange-600 hover:text-orange-800 text-sm"
          >
            Test API Endpoints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600 mt-1 text-sm">
            Business insights with service fee calculation
          </p>
          <button 
            onClick={testEndpoints}
            className="mt-2 text-xs text-orange-600 hover:text-orange-800"
          >
            Debug: Test API Endpoints
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-auto"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 justify-center w-full sm:w-auto"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Analytics Data Error</p>
            <p className="text-red-700 text-sm">{error}</p>
            <div className="mt-2 space-x-2">
              <button 
                onClick={fetchAnalytics}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Try Again
              </button>
              <button 
                onClick={testEndpoints}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Test Endpoints
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Status */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <span className="font-medium">Orders:</span> {analytics.totalOrders}
          </div>
          <div className="text-center">
            <span className="font-medium">Users:</span> {analytics.totalUsers}
          </div>
          <div className="text-center">
            <span className="font-medium">Restaurants:</span> {analytics.totalRestaurants}
          </div>
          <div className="text-center">
            <span className="font-medium">Revenue:</span> ₱{analytics.totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium opacity-90">Total Revenue</p>
              <p className="text-lg font-bold mt-1">₱{analytics.totalRevenue.toLocaleString()}</p>
              <p className="text-xs opacity-90 mt-1">Includes service fees</p>
            </div>
            <DollarSign size={20} className="opacity-90 ml-2" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium opacity-90">Total Orders</p>
              <p className="text-lg font-bold mt-1">{analytics.totalOrders}</p>
              <p className="text-xs opacity-90 mt-1">All time orders</p>
            </div>
            <Package size={20} className="opacity-90 ml-2" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium opacity-90">Total Users</p>
              <p className="text-lg font-bold mt-1">{analytics.totalUsers}</p>
              <p className="text-xs opacity-90 mt-1">Registered users</p>
            </div>
            <Users size={20} className="opacity-90 ml-2" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium opacity-90">Restaurants</p>
              <p className="text-lg font-bold mt-1">{analytics.totalRestaurants}</p>
              <p className="text-xs opacity-90 mt-1">Active restaurants</p>
            </div>
            <Store size={20} className="opacity-90 ml-2" />
          </div>
        </div>
      </div>

      {/* Order Statistics and Top Restaurants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Order Status Breakdown */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart size={20} className="text-orange-600 mr-2" />
            Order Status Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.orderStats).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize flex-1 mr-3 truncate">
                  {status.replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="w-20 bg-orange-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status === 'delivered' ? 'bg-green-500' :
                        status === 'pending' ? 'bg-yellow-500' :
                        status === 'cancelled' ? 'bg-red-500' :
                        'bg-orange-500'
                      }`}
                      style={{ 
                        width: `${analytics.totalOrders > 0 ? Math.max((count / analytics.totalOrders) * 100, 5) : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-orange-600 w-6 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 size={20} className="text-green-600 mr-2" />
            Top Restaurants
          </h3>
          <div className="space-y-3">
            {analytics.topRestaurants.map((restaurant, index) => (
              <div key={restaurant.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{restaurant.name}</p>
                    <p className="text-xs text-gray-500">{restaurant.orders} orders</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600">
                  ₱{restaurant.revenue.toLocaleString()}
                </span>
              </div>
            ))}
            {analytics.topRestaurants.length === 0 && (
              <p className="text-gray-500 text-center py-4">No restaurant data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-orange-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock size={20} className="text-orange-600 mr-2" />
          Recent Orders
        </h3>
        <div className="space-y-3">
          {analytics.recentOrders.map((order) => (
            <div key={order._id || order.id} className="border border-orange-100 rounded-lg p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    Order #{order.orderNumber || order._id?.substring(0, 8) || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {order.customer?.name || order.user?.name || 'Customer'}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} ml-2`}>
                  {order.status || 'unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-orange-600">
                    ₱{parseFloat(order.totalAmount || order.total || order.amount || 0).toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-gray-600">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          ))}
          {analytics.recentOrders.length === 0 && (
            <div className="text-center py-6">
              <Package size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">No recent orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {calculateCompletionRate()}%
          </div>
          <div className="text-sm text-blue-800 mt-1">Completion Rate</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            ₱{calculateAverageOrderValue()}
          </div>
          <div className="text-sm text-green-800 mt-1">Avg. Order Value</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {calculateOrdersPerUser()}
          </div>
          <div className="text-sm text-purple-800 mt-1">Orders per User</div>
        </div>
      </div>

      {/* Revenue Info */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">Revenue Calculation</h4>
        <div className="text-sm text-yellow-800">
          <p>Includes ₱10 service fee per delivered order</p>
          <p className="mt-1">Total Orders: {analytics.totalOrders} | Delivered: {analytics.orderStats.delivered}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;