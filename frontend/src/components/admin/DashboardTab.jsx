// DashboardTab.jsx - Updated with restaurant theme
import React, { useState, useEffect } from 'react';
import { RefreshCw, Utensils, ChefHat } from 'lucide-react';
import StatsCard from './StatsCard';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      const [usersResponse, restaurantsResponse, ordersResponse] = await Promise.all([
        fetch(`${API_URL}/auth/users`),
        fetch(`${API_URL}/restaurants`),
        fetch(`${API_URL}/orders`)
      ]);
      
      const usersData = await usersResponse.json();
      const restaurantsData = await restaurantsResponse.json();
      const ordersData = await ordersResponse.json();

      const deliveredOrders = Array.isArray(ordersData?.orders) ? ordersData.orders.filter(order => order.status === 'delivered') : 
                            Array.isArray(ordersData) ? ordersData.filter(order => order.status === 'delivered') : [];

      const revenue = deliveredOrders.reduce((total, order) => total + (order.totalAmount || 0), 0);

      setStats({
        totalUsers: Array.isArray(usersData?.users) ? usersData.users.length : 
                   Array.isArray(usersData) ? usersData.length : 0,
        totalRestaurants: Array.isArray(restaurantsData?.restaurants) ? restaurantsData.restaurants.length :
                        Array.isArray(restaurantsData) ? restaurantsData.length : 0,
        totalOrders: Array.isArray(ordersData?.orders) ? ordersData.orders.length :
                    Array.isArray(ordersData) ? ordersData.length : 0,
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
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🍽️ Dashboard Overview</h2>
          <p className="text-gray-600 mt-1">Welcome to FoodExpress Admin Panel</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChefHat size={20} className="text-orange-600 mr-2" />
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                🟢 Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                🟢 Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Data</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                {(stats.totalUsers + stats.totalRestaurants + stats.totalOrders).toLocaleString()} Records
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Utensils size={20} className="text-orange-600 mr-2" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors text-sm font-medium">
              Add Restaurant
            </button>
            <button className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium">
              View Reports
            </button>
            <button className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors text-sm font-medium">
              Manage Users
            </button>
            <button className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors text-sm font-medium">
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;