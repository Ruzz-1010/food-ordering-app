// AnalyticsTab.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Store, Package, DollarSign, Calendar, ChefHat, Utensils, RefreshCw, Clock } from 'lucide-react';

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

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      // Fetch all necessary data
      const [ordersResponse, usersResponse, restaurantsResponse] = await Promise.all([
        fetch(`${API_URL}/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/auth/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/restaurants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const ordersData = await ordersResponse.json();
      const usersData = await usersResponse.json();
      const restaurantsData = await restaurantsResponse.json();

      console.log('📊 ANALYTICS DATA:', { ordersData, usersData, restaurantsData });

      // Process orders data
      const orders = ordersData.orders || ordersData.data || ordersData || [];
      const users = usersData.users || usersData.data || usersData || [];
      const restaurants = restaurantsData.restaurants || restaurantsData.data || restaurantsData || [];

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
      <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
        </div>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 text-lg">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Analytics & Reports</h2>
          <p className="text-gray-600 mt-1">Real-time business insights from your database</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">₱{analytics.totalRevenue.toLocaleString()}</p>
              <p className="text-xs opacity-90 mt-1">From delivered orders</p>
            </div>
            <DollarSign size={24} className="opacity-90" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{analytics.totalOrders}</p>
              <p className="text-xs opacity-90 mt-1">All time orders</p>
            </div>
            <Package size={24} className="opacity-90" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Users</p>
              <p className="text-2xl font-bold mt-1">{analytics.totalUsers}</p>
              <p className="text-xs opacity-90 mt-1">Registered users</p>
            </div>
            <Users size={24} className="opacity-90" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Restaurants</p>
              <p className="text-2xl font-bold mt-1">{analytics.totalRestaurants}</p>
              <p className="text-xs opacity-90 mt-1">Active restaurants</p>
            </div>
            <Store size={24} className="opacity-90" />
          </div>
        </div>
      </div>

      {/* Order Statistics and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Order Status Breakdown */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package size={20} className="text-orange-600 mr-2" />
            Order Status Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.orderStats).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {status.replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-orange-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        status === 'delivered' ? 'bg-green-500' :
                        status === 'pending' ? 'bg-yellow-500' :
                        status === 'cancelled' ? 'bg-red-500' :
                        'bg-orange-500'
                      }`}
                      style={{ 
                        width: `${(count / analytics.totalOrders) * 100}%` 
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
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Store size={20} className="text-green-600 mr-2" />
            Top Restaurants
          </h3>
          <div className="space-y-4">
            {analytics.topRestaurants.map((restaurant, index) => (
              <div key={restaurant.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{restaurant.name}</p>
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
      <div className="bg-white border border-orange-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock size={20} className="text-orange-600 mr-2" />
          Recent Orders
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-orange-200">
                <th className="text-left py-3 px-4 font-semibold text-orange-900">Order ID</th>
                <th className="text-left py-3 px-4 font-semibold text-orange-900">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-orange-900">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-orange-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-orange-900">Date</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentOrders.map((order) => (
                <tr key={order._id || order.id} className="border-b border-orange-100">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900 text-sm">
                      #{order.orderNumber || order._id?.substring(0, 8)}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-900">{order.customer?.name || 'Customer'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-bold text-orange-600">
                      ₱{(order.totalAmount || order.total || 0).toLocaleString()}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </td>
                </tr>
              ))}
              {analytics.recentOrders.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <p className="text-xs text-gray-600">
          <strong>Data Source:</strong> Real database | 
          <strong> Orders:</strong> {analytics.totalOrders} | 
          <strong> Users:</strong> {analytics.totalUsers} | 
          <strong> Restaurants:</strong> {analytics.totalRestaurants} |
          <strong> Last Update:</strong> {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default AnalyticsTab;