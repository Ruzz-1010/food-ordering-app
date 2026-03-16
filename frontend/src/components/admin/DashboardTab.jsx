// DashboardTab.jsx - SIMPLE CLEAN DESIGN WITH MINI CHART
import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Store, Package, DollarSign, TrendingUp, 
  Clock, Activity, ArrowUpRight
} from 'lucide-react';

const API_BASE_URL = 'https://food-ordering-app-83lm.onrender.com/api';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, totalRestaurants: 0, totalOrders: 0, 
    totalRevenue: 0, pendingOrders: 0, todayRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);

  const formatPeso = (n) => `₱${Number(n || 0).toLocaleString()}`;

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch stats
      const statsRes = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);
      
      let s = {};
      if (statsRes?.ok) {
        const json = await statsRes.json();
        s = json.data || json;
      }
      
      // Fetch orders
      const ordersRes = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      const orders = ordersData.orders || ordersData.data || [];
      
      const today = new Date().toDateString();
      const todayRevenue = orders
        .filter(o => new Date(o.createdAt).toDateString() === today)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      const pending = orders.filter(o => 
        ['pending', 'confirmed', 'preparing'].includes((o.status || '').toLowerCase())
      ).length;

      setStats({
        totalUsers: s.totalUsers || 0,
        totalRestaurants: s.totalRestaurants || 0,
        totalOrders: s.totalOrders || orders.length || 0,
        totalRevenue: s.totalRevenue || 0,
        pendingOrders: pending,
        todayRevenue: todayRevenue
      });

      // Generate weekly mini chart data
      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayRevenue = orders
          .filter(o => new Date(o.createdAt).toDateString() === date.toDateString())
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        weekData.push({ day: date.toLocaleDateString('en-US', { weekday: 'narrow' }), value: dayRevenue });
      }
      setWeeklyData(weekData);

      // Recent orders
      const sorted = orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentOrders(sorted);
      
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const StatCard = ({ title, value, icon: Icon, color, trend, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <ArrowUpRight size={12} />
            {trend}%
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">
        {loading ? <span className="animate-pulse">...</span> : value}
      </p>
    </div>
  );

  const getStatusColor = (status) => ({
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  }[status?.toLowerCase()] || 'bg-gray-100 text-gray-700');

  // Calculate sparkline heights
  const maxValue = Math.max(...weeklyData.map(d => d.value)) || 1;
  const sparklineData = weeklyData.map(d => ({
    ...d,
    height: (d.value / maxValue) * 100
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Overview of your platform</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Activity size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers.toLocaleString()} 
          icon={Users} 
          color="bg-blue-500"
          trend={12}
        />
        <StatCard 
          title="Restaurants" 
          value={stats.totalRestaurants.toLocaleString()} 
          icon={Store} 
          color="bg-red-500"
          trend={8}
        />
        <StatCard 
          title="Orders" 
          value={stats.totalOrders.toLocaleString()} 
          icon={Package} 
          color="bg-green-500"
          trend={24}
        />
        <StatCard 
          title="Revenue" 
          value={formatPeso(stats.totalRevenue)} 
          icon={DollarSign} 
          color="bg-purple-500"
          trend={15}
        />
      </div>

      {/* Mini Revenue Chart + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Sparkline Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
              <p className="text-sm text-gray-500">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{formatPeso(stats.todayRevenue)}</p>
              <p className="text-xs text-green-600">Today's revenue</p>
            </div>
          </div>
          
          {/* Simple Sparkline */}
          <div className="h-24 flex items-end gap-1">
            {sparklineData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full relative">
                  <div 
                    className="bg-red-500 rounded-t transition-all duration-500 group-hover:bg-red-600"
                    style={{ height: `${Math.max(d.height, 8)}%`, minHeight: '4px' }}
                  />
                </div>
                <span className="text-xs text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-5 text-white">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white/10 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Orders</span>
                <span className="text-lg font-bold">{stats.pendingOrders}</span>
              </div>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Now</span>
                <span className="text-lg font-bold">24</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-red-600" />
          Recent Orders
        </h3>
        
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-gray-400 py-4">Loading...</div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-4">No recent orders</div>
          ) : (
            recentOrders.map((order) => (
              <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <Package size={18} className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      #{order.orderNumber || order._id?.slice(-6)}
                    </p>
                    <p className="text-xs text-gray-500">{order.customer?.name || 'Customer'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm">
                    {formatPeso(order.totalAmount)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;