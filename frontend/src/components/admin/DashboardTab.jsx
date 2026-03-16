// DashboardTab.jsx - APEXCHARTS SPARKLINES
import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Store, Package, DollarSign, TrendingUp, 
  Clock, Activity, ArrowUpRight
} from 'lucide-react';
import Chart from 'react-apexcharts';

const API_BASE_URL = 'https://food-ordering-app-83lm.onrender.com/api';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, totalRestaurants: 0, totalOrders: 0, 
    totalRevenue: 0, pendingOrders: 0, todayRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [sparklineData, setSparklineData] = useState([]);

  const sparklineOptions = {
    chart: {
      type: 'area',
      height: 60,
      sparkline: { enabled: true }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.05
      }
    },
    colors: ['#DC2626'],
    tooltip: {
      fixed: { enabled: false },
      x: { show: false },
      y: { 
        title: { formatter: () => '' },
        formatter: (val) => `₱${val.toLocaleString()}`
      },
      marker: { show: false }
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const s = statsRes?.ok ? await statsRes.json() : {};
      const statsData = s.data || s;
      
      const ordersJson = await ordersRes.json();
      const orders = ordersJson.orders || ordersJson.data || [];

      const today = new Date().toDateString();
      const todayRevenue = orders
        .filter(o => new Date(o.createdAt).toDateString() === today)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalRestaurants: statsData.totalRestaurants || 0,
        totalOrders: statsData.totalOrders || orders.length,
        totalRevenue: statsData.totalRevenue || 0,
        pendingOrders: orders.filter(o => 
          ['pending', 'confirmed', 'preparing'].includes((o.status || '').toLowerCase())
        ).length,
        todayRevenue
      });

      // 7-day sparkline
      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const revenue = orders
          .filter(o => new Date(o.createdAt).toDateString() === date.toDateString())
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        weekData.push(revenue);
      }
      setSparklineData([{ data: weekData }]);

      setRecentOrders(orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
      );
      
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

  const StatCard = ({ title, value, change, icon: Icon, subtitle, hasChart }) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2.5 bg-gray-50 rounded-xl">
          <Icon size={20} className="text-gray-700" />
        </div>
        {change !== undefined && (
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-600">
            <ArrowUpRight size={12} />
            {change}%
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{loading ? '...' : value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      {hasChart && sparklineData.length > 0 && (
        <div className="mt-3 h-16">
          <Chart
            options={sparklineOptions}
            series={sparklineData}
            type="area"
            height={60}
          />
        </div>
      )}
    </div>
  );

  const getStatusColor = (status) => ({
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  }[status?.toLowerCase()] || 'bg-gray-100 text-gray-700');

  const formatPeso = (n) => `₱${Number(n || 0).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500">Welcome back! Here's your overview.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
        >
          <Activity size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats with Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={formatPeso(stats.totalRevenue)} 
          change={12.5}
          icon={DollarSign}
          hasChart={true}
        />
        <StatCard 
          title="Today's Revenue" 
          value={formatPeso(stats.todayRevenue)} 
          change={8.2}
          icon={TrendingUp}
          subtitle={`${stats.todayOrders || 0} orders`}
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders.toLocaleString()} 
          change={24}
          icon={Package}
        />
        <StatCard 
          title="Active Users" 
          value={stats.totalUsers.toLocaleString()} 
          change={5.3}
          icon={Users}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <p className="text-sm text-gray-500">Latest transactions</p>
            </div>
            <button className="text-red-600 text-sm font-medium hover:underline">
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No recent orders</div>
            ) : (
              recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <Package size={20} className="text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">{order.customer?.name || 'Customer'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPeso(order.totalAmount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Clock size={24} />
              </div>
              <span className="text-3xl font-bold">{stats.pendingOrders}</span>
            </div>
            <p className="text-red-100 font-medium">Pending Orders</p>
            <p className="text-sm text-red-200 mt-1">Require attention</p>
            <button className="mt-4 w-full py-2.5 bg-white text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors">
              View Orders
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { label: 'Manage Restaurants', count: stats.totalRestaurants, icon: Store },
                { label: 'View All Orders', count: stats.totalOrders, icon: Package },
                { label: 'User Management', count: stats.totalUsers, icon: Users }
              ].map((item) => (
                <button key={item.label} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <item.icon size={18} className="text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-700 text-sm">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;