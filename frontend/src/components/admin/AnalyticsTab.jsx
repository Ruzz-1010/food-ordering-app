// AnalyticsTab.jsx - UPDATED VERSION WITH DIRECT BACKEND CALLS
import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Store, Package, DollarSign, Calendar, ChefHat, Utensils, RefreshCw, Clock, BarChart3, PieChart, AlertCircle } from 'lucide-react';

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

  // Direct fetch functions for admin endpoints
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

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      console.log('📊 Fetching analytics data from admin endpoints...');

      if (!token) {
        setError('Please login to access analytics');
        return;
      }

      // Fetch all necessary data from admin endpoints
      const [ordersData, usersData, restaurantsData] = await Promise.all([
        fetchAdminData('/orders', 'Orders'),
        fetchAdminData('/users', 'Users'),
        fetchAdminData('/restaurants', 'Restaurants')
      ]);

      console.log('📦 Analytics data fetched:', {
        orders: ordersData.length,
        users: usersData.length,
        restaurants: restaurantsData.length
      });

      // Calculate total revenue from delivered orders
      // Include service fee calculation (₱10 per order)
      const deliveredOrders = ordersData.filter(order => 
        order.status === 'delivered' || order.status === 'completed'
      );
      
      const totalRevenue = deliveredOrders.reduce((total, order) => {
        const orderAmount = order.totalAmount || order.total || order.amount || 0;
        const serviceFee = 10; // ₱10 service fee per order
        return total + Number(orderAmount) + serviceFee;
      }, 0);

      // Calculate order statistics
      const orderStats = {
        pending: ordersData.filter(o => o.status === 'pending').length,
        confirmed: ordersData.filter(o => o.status === 'confirmed').length,
        preparing: ordersData.filter(o => o.status === 'preparing').length,
        ready: ordersData.filter(o => o.status === 'ready').length,
        out_for_delivery: ordersData.filter(o => o.status === 'out_for_delivery').length,
        delivered: deliveredOrders.length,
        cancelled: ordersData.filter(o => o.status === 'cancelled').length
      };

      // Get top restaurants by order count and revenue
      const restaurantOrderCount = {};
      ordersData.forEach(order => {
        const restaurantId = order.restaurant?._id || order.restaurant?.id || 'unknown';
        const restaurantName = order.restaurant?.name || 'Unknown Restaurant';
        
        if (!restaurantOrderCount[restaurantId]) {
          restaurantOrderCount[restaurantId] = {
            count: 0,
            revenue: 0,
            name: restaurantName
          };
        }
        
        restaurantOrderCount[restaurantId].count++;
        
        // Calculate revenue including service fee
        if (order.status === 'delivered' || order.status === 'completed') {
          const orderAmount = order.totalAmount || order.total || order.amount || 0;
          const serviceFee = 10; // ₱10 service fee
          restaurantOrderCount[restaurantId].revenue += Number(orderAmount) + serviceFee;
        }
      });

      const topRestaurants = Object.entries(restaurantOrderCount)
        .map(([id, data]) => ({
          id,
          name: data.name,
          orders: data.count,
          revenue: data.revenue
        }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      // Get recent orders
      const recentOrders = ordersData
        .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate))
        .slice(0, 5);

      setAnalytics({
        totalRevenue,
        totalOrders: ordersData.length,
        totalUsers: usersData.length,
        totalRestaurants: restaurantsData.length,
        recentOrders,
        topRestaurants,
        orderStats
      });

    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Analytics & Reports</h2>
        </div>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 text-lg">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Analytics & Reports</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Real-time business insights with service fee calculation
            {error && ' • Some data may be unavailable'}
          </p>
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
            className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 justify-center w-full sm:w-auto"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span className="text-sm sm:text-base">Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-red-800 font-medium">Analytics Data Error</p>
            <p className="text-red-700 text-sm break-words">{error}</p>
            <button 
              onClick={fetchAnalytics}
              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-xs text-blue-800">
            <strong>Backend:</strong> Railway • 
            <strong> Service Fee:</strong> ₱10 per order •
            <strong> Data:</strong> Real-time from admin endpoints
          </p>
          <div className="flex items-center space-x-3 text-xs text-blue-600">
            <span>Orders: {analytics.totalOrders}</span>
            <span>Users: {analytics.totalUsers}</span>
            <span>Restaurants: {analytics.totalRestaurants}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold mt-1 truncate">₱{analytics.totalRevenue.toLocaleString()}</p>
              <p className="text-xs opacity-90 mt-1 truncate">Includes ₱10 service fee per order</p>
            </div>
            <DollarSign size={20} className="opacity-90 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{analytics.totalOrders}</p>
              <p className="text-xs opacity-90 mt-1 truncate">All time orders</p>
            </div>
            <Package size={20} className="opacity-90 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Total Users</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{analytics.totalUsers}</p>
              <p className="text-xs opacity-90 mt-1 truncate">Registered users</p>
            </div>
            <Users size={20} className="opacity-90 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Restaurants</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{analytics.totalRestaurants}</p>
              <p className="text-xs opacity-90 mt-1 truncate">Active restaurants</p>
            </div>
            <Store size={20} className="opacity-90 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Order Statistics and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Order Status Breakdown */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart size={20} className="text-orange-600 mr-2" />
            Order Status Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.orderStats).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize min-w-0 flex-1 mr-3 truncate">
                  {status.replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="w-16 sm:w-24 bg-orange-200 rounded-full h-2 sm:h-3">
                    <div 
                      className={`h-2 sm:h-3 rounded-full ${
                        status === 'delivered' ? 'bg-green-500' :
                        status === 'pending' ? 'bg-yellow-500' :
                        status === 'cancelled' ? 'bg-red-500' :
                        'bg-orange-500'
                      }`}
                      style={{ 
                        width: `${Math.max((count / analytics.totalOrders) * 100, 5)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-orange-600 w-8 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 size={20} className="text-green-600 mr-2" />
            Top Restaurants
            <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Revenue includes service fee
            </span>
          </h3>
          <div className="space-y-3">
            {analytics.topRestaurants.map((restaurant, index) => (
              <div key={restaurant.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-xs">{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{restaurant.name}</p>
                    <p className="text-xs text-gray-500">{restaurant.orders} orders</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600 flex-shrink-0 ml-2">
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
      <div className="bg-white border border-orange-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock size={20} className="text-orange-600 mr-2" />
          Recent Orders
        </h3>
        <div className="space-y-3">
          {analytics.recentOrders.map((order) => (
            <div key={order._id || order.id} className="border border-orange-100 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    Order #{order.orderNumber || order._id?.substring(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {order.customer?.name || order.user?.name || 'Customer'}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} flex-shrink-0 ml-2`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-orange-600">
                    ₱{(order.totalAmount || order.total || order.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">+ ₱10 service fee</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {calculateCompletionRate()}%
          </div>
          <div className="text-sm text-blue-800 mt-1">Completion Rate</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            ₱{calculateAverageOrderValue()}
          </div>
          <div className="text-sm text-green-800 mt-1">Avg. Order Value</div>
          <div className="text-xs text-green-600 mt-1">Includes service fee</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {calculateOrdersPerUser()}
          </div>
          <div className="text-sm text-purple-800 mt-1">Orders per User</div>
        </div>
      </div>

      {/* Revenue Breakdown Info */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">💰 Revenue Calculation</h4>
        <div className="text-sm text-yellow-800 space-y-1">
          <p><strong>Service Fee:</strong> ₱10 per delivered order</p>
          <p><strong>Total Revenue:</strong> Order amount + Service fees from all delivered orders</p>
          <p><strong>Sample:</strong> 5 delivered orders = ₱50 service fee revenue</p>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-xs text-gray-600">
            <strong>Data Source:</strong> Admin Endpoints | 
            <strong> Last Update:</strong> {new Date().toLocaleTimeString()}
          </p>
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span>Delivered Orders: {analytics.orderStats.delivered}</span>
            <span>Service Fee Revenue: ₱{analytics.orderStats.delivered * 10}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;