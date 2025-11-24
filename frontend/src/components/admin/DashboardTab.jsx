import React, { useState, useEffect } from 'react';
import { RefreshCw, Utensils, ChefHat } from 'lucide-react';
import StatsCard from './StatsCard';
import { apiService } from '../../services/api';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      const [usersData, restaurantsData, ordersData] = await Promise.all([
        apiService.getUsers(),
        apiService.getRestaurants(),
        apiService.getOrders()
      ]);
      
      // Process users data
      let usersArray = [];
      if (usersData.success && Array.isArray(usersData.users)) {
        usersArray = usersData.users;
      } else if (Array.isArray(usersData)) {
        usersArray = usersData;
      } else if (usersData.users && Array.isArray(usersData.users)) {
        usersArray = usersData.users;
      }

      // Process restaurants data
      let restaurantsArray = [];
      if (restaurantsData.success && Array.isArray(restaurantsData.restaurants)) {
        restaurantsArray = restaurantsData.restaurants;
      } else if (Array.isArray(restaurantsData)) {
        restaurantsArray = restaurantsData;
      } else if (restaurantsData.data && Array.isArray(restaurantsData.data)) {
        restaurantsArray = restaurantsData.data;
      }

      // Process orders data
      let ordersArray = [];
      if (ordersData.success && Array.isArray(ordersData.orders)) {
        ordersArray = ordersData.orders;
      } else if (Array.isArray(ordersData)) {
        ordersArray = ordersData;
      }

      const deliveredOrders = ordersArray.filter(order => order.status === 'delivered');
      const revenue = deliveredOrders.reduce((total, order) => total + (order.totalAmount || 0), 0);

      setStats({
        totalUsers: usersArray.length,
        totalRestaurants: restaurantsArray.length,
        totalOrders: ordersArray.length,
        totalRevenue: revenue
      });

    } catch (error) {
      console.error('❌ Error fetching stats:', error);
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Dashboard Overview</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome to FoodExpress Admin Panel</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={12}
          color="bg-blue-500"
          loading={loading}
        />
        <StatsCard
          title="Total Restaurants"
          value={stats.totalRestaurants.toLocaleString()}
          change={8}
          color="bg-orange-500"
          loading={loading}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          change={15}
          color="bg-green-500"
          loading={loading}
        />
        <StatsCard
          title="Total Revenue"
          value={`₱${stats.totalRevenue.toLocaleString()}`}
          change={23}
          color="bg-purple-500"
          loading={loading}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChefHat size={20} className="text-orange-600 mr-2" />
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">API Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                🟢 Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">Database</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                🟢 Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">Total Data</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                {(stats.totalUsers + stats.totalRestaurants + stats.totalOrders).toLocaleString()} Records
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">Last Updated</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Utensils size={20} className="text-orange-600 mr-2" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors text-sm font-medium text-center">
              Add Restaurant
            </button>
            <button className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium text-center">
              View Reports
            </button>
            <button className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors text-sm font-medium text-center">
              Manage Users
            </button>
            <button className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors text-sm font-medium text-center">
              System Settings
            </button>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <RefreshCw size={20} className="text-orange-600 mr-2" />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{((stats.totalOrders / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">Conversion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">₱{(stats.totalRevenue / Math.max(stats.totalOrders, 1)).toFixed(0)}</div>
            <div className="text-xs text-gray-500 mt-1">Avg Order Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalRestaurants}</div>
            <div className="text-xs text-gray-500 mt-1">Active Partners</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(stats.totalOrders / 30)}</div>
            <div className="text-xs text-gray-500 mt-1">Orders/Day</div>
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-xs text-gray-600">
            <strong>Data Source:</strong> Live Database | 
            <strong> Last Sync:</strong> {new Date().toLocaleString()}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Users: {stats.totalUsers}</span>
            <span>Restaurants: {stats.totalRestaurants}</span>
            <span>Orders: {stats.totalOrders}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;