// DashboardTab.jsx - OPTIMIZED FOR YOUR BACKEND
import React, { useState, useEffect } from 'react';
import { RefreshCw, Utensils, ChefHat, AlertCircle, Users, Store, Package, DollarSign } from 'lucide-react';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // DIRECT FETCH TO YOUR BACKEND ENDPOINTS
  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      console.log('🔄 Fetching from your backend...', { 
        token: token ? 'Token present' : 'No token found',
        baseURL: API_BASE_URL
      });

      // OPTION 1: Use your dashboard stats endpoint (MAS EFFICIENT)
      try {
        console.log('📊 Trying dashboard stats endpoint...');
        const dashboardResponse = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          console.log('✅ Dashboard stats response:', dashboardData);
          
          // Adjust based on your actual response format
          if (dashboardData.success) {
            setStats({
              totalUsers: dashboardData.data?.totalUsers || dashboardData.totalUsers || 0,
              totalRestaurants: dashboardData.data?.totalRestaurants || dashboardData.totalRestaurants || 0,
              totalOrders: dashboardData.data?.totalOrders || dashboardData.totalOrders || 0,
              totalRevenue: dashboardData.data?.totalRevenue || dashboardData.totalRevenue || 0,
              totalProducts: dashboardData.data?.totalProducts || dashboardData.totalProducts || 0
            });
            return; // Exit early if dashboard stats works
          }
        }
      } catch (dashboardError) {
        console.log('⚠️ Dashboard endpoint not available, trying individual endpoints...');
      }

      // OPTION 2: Fallback to individual endpoints
      console.log('📦 Fetching individual endpoints...');
      const [usersResponse, restaurantsResponse, ordersResponse, productsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/restaurants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Check responses
      const responses = [
        { name: 'Users', response: usersResponse },
        { name: 'Restaurants', response: restaurantsResponse },
        { name: 'Orders', response: ordersResponse },
        { name: 'Products', response: productsResponse }
      ];

      for (const { name, response } of responses) {
        if (!response.ok) {
          console.warn(`⚠️ ${name} API failed:`, response.status, response.statusText);
        }
      }

      // Process data based on your backend response format
      const processResponse = async (response, endpointName) => {
        try {
          const data = await response.json();
          console.log(`📊 ${endpointName} data:`, data);
          
          if (data.success && Array.isArray(data.data)) {
            return data.data;
          } else if (data.success && Array.isArray(data.users)) {
            return data.users;
          } else if (data.success && Array.isArray(data.restaurants)) {
            return data.restaurants;
          } else if (data.success && Array.isArray(data.orders)) {
            return data.orders;
          } else if (data.success && Array.isArray(data.products)) {
            return data.products;
          } else if (Array.isArray(data)) {
            return data;
          } else if (data.data && Array.isArray(data.data)) {
            return data.data;
          }
          return [];
        } catch (error) {
          console.error(`❌ Error processing ${endpointName}:`, error);
          return [];
        }
      };

      const [
        usersArray,
        restaurantsArray, 
        ordersArray,
        productsArray
      ] = await Promise.all([
        processResponse(usersResponse, 'Users'),
        processResponse(restaurantsResponse, 'Restaurants'),
        processResponse(ordersResponse, 'Orders'),
        processResponse(productsResponse, 'Products')
      ]);

      console.log('✅ Processed data counts:', {
        users: usersArray.length,
        restaurants: restaurantsArray.length,
        orders: ordersArray.length,
        products: productsArray.length
      });

      // Calculate revenue from delivered orders
      const deliveredOrders = ordersArray.filter(order => 
        order.status === 'delivered' || order.status === 'completed'
      );
      
      const revenue = deliveredOrders.reduce((total, order) => {
        const amount = order.totalAmount || order.total || order.amount || 0;
        return total + Number(amount);
      }, 0);

      setStats({
        totalUsers: usersArray.length,
        totalRestaurants: restaurantsArray.length,
        totalOrders: ordersArray.length,
        totalRevenue: revenue,
        totalProducts: productsArray.length
      });

    } catch (error) {
      console.error('❌ Backend fetch error:', error);
      setError(`Failed to load data: ${error.message}`);
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
  const StatsCard = ({ title, value, color, icon: Icon, loading }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
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
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${color} ml-3 flex-shrink-0`}>
          <Icon size={18} className="sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Dashboard Overview</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Connected to Your Backend</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
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
            <p className="text-red-800 font-medium">Backend Connection Error</p>
            <p className="text-red-700 text-sm">{error}</p>
            <div className="mt-2 space-x-2">
              <button 
                onClick={fetchData}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Try Again
              </button>
              <button 
                onClick={() => console.log('Debug info...')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-4"
              >
                View Console for Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-xs text-blue-800">
            <strong>Backend:</strong> Your Express.js API | 
            <strong> Status:</strong> {loading ? 'Loading...' : 'Ready'} |
            <strong> Last Update:</strong> {new Date().toLocaleTimeString()}
          </p>
          <div className="flex items-center space-x-3 text-xs text-blue-600">
            <span>Users: {stats.totalUsers}</span>
            <span>Restaurants: {stats.totalRestaurants}</span>
            <span>Orders: {stats.totalOrders}</span>
            <span>Products: {stats.totalProducts}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          color="bg-blue-500"
          icon={Users}
          loading={loading}
        />
        <StatsCard
          title="Total Restaurants"
          value={stats.totalRestaurants.toLocaleString()}
          color="bg-orange-500"
          icon={Store}
          loading={loading}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          color="bg-green-500"
          icon={Package}
          loading={loading}
        />
        <StatsCard
          title="Total Revenue"
          value={`₱${stats.totalRevenue.toLocaleString()}`}
          color="bg-purple-500"
          icon={DollarSign}
          loading={loading}
        />
        <StatsCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          color="bg-red-500"
          icon={Utensils}
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChefHat size={20} className="text-orange-600 mr-2" />
            Backend Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">API Connection</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {loading ? '🔄 Connecting...' : '🟢 Connected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">Authentication</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                localStorage.getItem('token') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {localStorage.getItem('token') ? '🟢 Authenticated' : '🔴 No Token'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">Total Records</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {(stats.totalUsers + stats.totalRestaurants + stats.totalOrders + stats.totalProducts).toLocaleString()} 
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Utensils size={20} className="text-orange-600 mr-2" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors text-sm font-medium text-center">
              Manage Restaurants
            </button>
            <button className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors text-sm font-medium text-center">
              Manage Users
            </button>
            <button className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium text-center">
              View Orders
            </button>
            <button className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors text-sm font-medium text-center">
              Manage Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;