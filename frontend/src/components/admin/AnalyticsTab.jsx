import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Store, Package, DollarSign, Calendar, ChefHat, Utensils, RefreshCw, Clock, BarChart3, PieChart } from 'lucide-react';
import { apiService } from '../../services/api';

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
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      
      // Fetch all necessary data
      const [ordersData, usersData, restaurantsData] = await Promise.all([
        apiService.getOrders(),
        apiService.getUsers(),
        apiService.getRestaurants()
      ]);

      // Process orders data
      let orders = [];
      if (ordersData.success && Array.isArray(ordersData.orders)) {
        orders = ordersData.orders;
      } else if (Array.isArray(ordersData)) {
        orders = ordersData;
      } else if (ordersData.data && Array.isArray(ordersData.data)) {
        orders = ordersData.data;
      }

      // Process users data
      let users = [];
      if (usersData.success && Array.isArray(usersData.users)) {
        users = usersData.users;
      } else if (Array.isArray(usersData)) {
        users = usersData;
      } else if (usersData.users && Array.isArray(usersData.users)) {
        users = usersData.users;
      }

      // Process restaurants data
      let restaurants = [];
      if (restaurantsData.success && Array.isArray(restaurantsData.restaurants)) {
        restaurants = restaurantsData.restaurants;
      } else if (Array.isArray(restaurantsData)) {
        restaurants = restaurantsData;
      } else if (restaurantsData.data && Array.isArray(restaurantsData.data)) {
        restaurants = restaurantsData.data;
      }

      // Calculate total revenue from delivered orders
      const deliveredOrders = orders.filter(order => order.status === 'delivered');
      const totalRevenue = deliveredOrders.reduce((total, order) => 
        total + (order.totalAmount || order.total || 0), 0
      );

      // Calculate order statistics
      const orderStats = {
        pending: orders.filter(o => o.status === 'pending').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
        delivered: deliveredOrders.length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      };

      // Get top restaurants by order count
      const restaurantOrderCount = {};
      orders.forEach(order => {
        const restaurantId = order.restaurant?._id || order.restaurant?.id || 'unknown';
        if (!restaurantOrderCount[restaurantId]) {
          restaurantOrderCount[restaurantId] = {
            count: 0,
            revenue: 0,
            name: order.restaurant?.name || 'Unknown Restaurant'
          };
        }
        restaurantOrderCount[restaurantId].count++;
        if (order.status === 'delivered') {
          restaurantOrderCount[restaurantId].revenue += order.totalAmount || order.total || 0;
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
      const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate))
        .slice(0, 5);

      setAnalytics({
        totalRevenue,
        totalOrders: orders.length,
        totalUsers: users.length,
        totalRestaurants: restaurants.length,
        recentOrders,
        topRestaurants,
        orderStats
      });

    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
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
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Real-time business insights from your database</p>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold mt-1 truncate">₱{analytics.totalRevenue.toLocaleString()}</p>
              <p className="text-xs opacity-90 mt-1 truncate">From delivered orders</p>
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
                  <p className="text-xs text-gray-500 truncate">{order.customer?.name || 'Customer'}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} flex-shrink-0 ml-2`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-orange-600">
                  ₱{(order.totalAmount || order.total || 0).toLocaleString()}
                </p>
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
            {analytics.totalOrders > 0 ? ((analytics.orderStats.delivered / analytics.totalOrders) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-blue-800 mt-1">Completion Rate</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            ₱{analytics.totalOrders > 0 ? (analytics.totalRevenue / analytics.orderStats.delivered).toFixed(0) : 0}
          </div>
          <div className="text-sm text-green-800 mt-1">Avg. Order Value</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analytics.totalUsers > 0 ? (analytics.totalOrders / analytics.totalUsers).toFixed(1) : 0}
          </div>
          <div className="text-sm text-purple-800 mt-1">Orders per User</div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-xs text-gray-600">
            <strong>Data Source:</strong> Real database | 
            <strong> Last Update:</strong> {new Date().toLocaleTimeString()}
          </p>
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span>Orders: {analytics.totalOrders}</span>
            <span>Users: {analytics.totalUsers}</span>
            <span>Restaurants: {analytics.totalRestaurants}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;