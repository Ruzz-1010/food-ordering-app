// DashboardTab.jsx - CLEAN MODERN DESIGN
import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Store, Package, DollarSign, TrendingUp, 
  Clock, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';

const API_BASE_URL = 'https://food-ordering-app-83lm.onrender.com/api';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, totalRestaurants: 0, totalOrders: 0, 
    totalRevenue: 0, pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch stats
      const statsRes = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      
      // Fetch recent orders
      const ordersRes = await fetch(`${API_BASE_URL}/admin/orders?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();

      setStats({
        totalUsers: statsData?.totalUsers || 0,
        totalRestaurants: statsData?.totalRestaurants || 0,
        totalOrders: statsData?.totalOrders || 0,
        totalRevenue: statsData?.totalRevenue || 0,
        pendingOrders: statsData?.pendingOrders || 0
      });
      
      setRecentOrders(ordersData?.orders?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">
        {loading ? <span className="animate-pulse">...</span> : value}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">Here's what's happening with your platform today.</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers.toLocaleString()} 
          icon={Users} 
          trend={12.5}
          color="bg-blue-500"
        />
        <StatCard 
          title="Restaurants" 
          value={stats.totalRestaurants.toLocaleString()} 
          icon={Store} 
          trend={8.2}
          color="bg-red-500"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders.toLocaleString()} 
          icon={Package} 
          trend={-2.4}
          color="bg-green-500"
        />
        <StatCard 
          title="Revenue" 
          value={`₱${stats.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          trend={15.3}
          color="bg-purple-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <button className="text-red-600 text-sm font-medium hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p>No recent orders</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <Package size={20} className="text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Order #{order.orderNumber || order._id?.slice(-6)}</p>
                      <p className="text-sm text-gray-500">{order.customer?.name || 'Customer'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₱{(order.totalAmount || 0).toLocaleString()}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl">
              <span className="text-red-100">Pending Orders</span>
              <span className="text-2xl font-bold">{stats.pendingOrders}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl">
              <span className="text-red-100">Active Now</span>
              <span className="text-2xl font-bold">24</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl">
              <span className="text-red-100">Avg. Order</span>
              <span className="text-2xl font-bold">₱450</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;