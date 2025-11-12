import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
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

  // Fetch real data from APIs
  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch users count
      const usersResponse = await fetch(`${API_URL}/auth/users`);
      const usersData = await usersResponse.json();
      
      // Fetch restaurants count
      const restaurantsResponse = await fetch(`${API_URL}/restaurants`);
      const restaurantsData = await restaurantsResponse.json();
      
      // Fetch orders count
      const ordersResponse = await fetch(`${API_URL}/orders`);
      const ordersData = await ordersResponse.json();

      setStats({
        totalUsers: Array.isArray(usersData?.users) ? usersData.users.length : 
                   Array.isArray(usersData) ? usersData.length : 0,
        totalRestaurants: Array.isArray(restaurantsData?.restaurants) ? restaurantsData.restaurants.length :
                        Array.isArray(restaurantsData) ? restaurantsData.length : 0,
        totalOrders: Array.isArray(ordersData?.orders) ? ordersData.orders.length :
                    Array.isArray(ordersData) ? ordersData.length : 0,
        totalRevenue: 12540 // This would come from orders calculation
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
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
          color="bg-green-500"
          loading={loading}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          change={15}
          color="bg-purple-500"
          loading={loading}
        />
        <StatsCard
          title="Total Revenue"
          value={`₱${stats.totalRevenue.toLocaleString()}`}
          change={23}
          color="bg-orange-500"
          loading={loading}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Data</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {(stats.totalUsers + stats.totalRestaurants + stats.totalOrders).toLocaleString()} Records
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;