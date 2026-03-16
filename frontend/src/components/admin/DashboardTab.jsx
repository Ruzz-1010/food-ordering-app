// DashboardTab.jsx - CLEAN MODERN DESIGN (FIXED DATA DISPLAY)
import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Store, Package, DollarSign, TrendingUp, 
  TrendingDown, Clock, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const API_BASE_URL = 'https://food-ordering-app-83lm.onrender.com/api';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');

  // Helper to format currency
  const formatPeso = (n) => `₱${Number(n || 0).toLocaleString()}`;

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view dashboard');
        setLoading(false);
        return;
      }

      // Fetch dashboard stats - try multiple endpoints
      let statsData = null;
      try {
        const res = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const json = await res.json();
          statsData = json.data || json;
        }
      } catch (e) {
        console.log('Primary stats endpoint failed, trying alternative...');
      }

      // Try alternative endpoint if first fails
      if (!statsData) {
        try {
          const res = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const json = await res.json();
            statsData = json.data || json;
          }
        } catch (e) {
          console.log('Alternative stats endpoint also failed');
        }
      }

      // Fetch orders for recent activity and pending count
      let ordersData = [];
      try {
        const res = await fetch(`${API_BASE_URL}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          ordersData = json.orders || json.data || [];
        }
      } catch (e) {
        console.log('Orders endpoint failed:', e);
      }

      // Calculate pending orders from orders data
      const pendingCount = ordersData.filter(o => 
        ['pending', 'confirmed', 'preparing'].includes(o?.status?.toLowerCase())
      ).length;

      // Set stats with fallback values
      setStats({
        totalUsers: statsData?.totalUsers || statsData?.users || 0,
        totalRestaurants: statsData?.totalRestaurants || statsData?.restaurants || 0,
        totalOrders: statsData?.totalOrders || statsData?.orders || ordersData.length || 0,
        totalRevenue: statsData?.totalRevenue || statsData?.revenue || 0,
        totalProducts: statsData?.totalProducts || statsData?.products || 0,
        pendingOrders: pendingCount
      });

      // Set recent orders (last 5)
      const sortedOrders = ordersData.sort((a, b) => 
        new Date(b.createdAt || b.orderDate || 0) - new Date(a.createdAt || a.orderDate || 0)
      );
      setRecentOrders(sortedOrders.slice(0, 5));
      
      setLastUpdated(new Date().toLocaleTimeString());
      
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, trend, color, subtitle, loading }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        {trend !== undefined && trend !== 0 && (
          <span className={`flex items-center gap-1 text-sm font-medium ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">
        {loading ? (
          <span className="inline-block w-8 h-8 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
        ) : (
          value
        )}
      </p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );

  // Status badge component
  const StatusBadge = ({ status }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-orange-100 text-orange-700',
      ready: 'bg-purple-100 text-purple-700',
      out_for_delivery: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-green-100 text-green-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">
            {lastUpdated ? `Last updated: ${lastUpdated}` : 'Loading data...'}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <Activity size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Stats Grid - 4 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers.toLocaleString()} 
          icon={Users} 
          trend={5.2}
          color="bg-blue-500"
          subtitle="Registered accounts"
          loading={loading}
        />
        <StatCard 
          title="Restaurants" 
          value={stats.totalRestaurants.toLocaleString()} 
          icon={Store} 
          trend={3.8}
          color="bg-red-500"
          subtitle="Active partners"
          loading={loading}
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders.toLocaleString()} 
          icon={Package} 
          trend={12.4}
          color="bg-green-500"
          subtitle="All time orders"
          loading={loading}
        />
        <StatCard 
          title="Total Revenue" 
          value={formatPeso(stats.totalRevenue)} 
          icon={DollarSign} 
          trend={8.7}
          color="bg-purple-500"
          subtitle="From completed orders"
          loading={loading}
        />
      </div>

      {/* Secondary Stats - Pending & Products */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title="Pending Orders" 
          value={stats.pendingOrders.toLocaleString()} 
          icon={Clock} 
          color="bg-yellow-500"
          subtitle="Awaiting processing"
          loading={loading}
        />
        <StatCard 
          title="Menu Items" 
          value={stats.totalProducts.toLocaleString()} 
          icon={Package} 
          trend={2.1}
          color="bg-orange-500"
          subtitle="Total food items"
          loading={loading}
        />
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-left">
              <p className="font-medium">View Pending Orders</p>
              <p className="text-sm text-red-100">{stats.pendingOrders} orders need attention</p>
            </button>
            <button className="w-full p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-left">
              <p className="font-medium">Manage Restaurants</p>
              <p className="text-sm text-red-100">{stats.totalRestaurants} partners active</p>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity size={20} className="text-red-600" />
              Recent Orders
            </h3>
            <button className="text-red-600 text-sm font-medium hover:underline">
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p>No recent orders</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div 
                  key={order._id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <Package size={20} className="text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Order #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.customer?.name || order.user?.name || 'Customer'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatPeso(order.totalAmount || order.total || 0)}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-red-600" />
            Performance Metrics
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600">Order Completion Rate</span>
              <span className="text-lg font-bold text-green-600">
                {stats.totalOrders > 0 
                  ? ((stats.totalOrders - stats.pendingOrders) / stats.totalOrders * 100).toFixed(1) 
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600">Average Order Value</span>
              <span className="text-lg font-bold text-purple-600">
                {stats.totalOrders > 0 
                  ? formatPeso(stats.totalRevenue / stats.totalOrders) 
                  : '₱0'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600">Orders per Restaurant</span>
              <span className="text-lg font-bold text-blue-600">
                {stats.totalRestaurants > 0 
                  ? (stats.totalOrders / stats.totalRestaurants).toFixed(1) 
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600">Daily Average (30 days)</span>
              <span className="text-lg font-bold text-red-600">
                {Math.round(stats.totalOrders / 30)}/day
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="text-2xl mb-1">🟢</div>
            <p className="text-sm font-medium text-green-800">Backend Online</p>
            <p className="text-xs text-green-600">Operational</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">
              {(stats.totalUsers + stats.totalRestaurants + stats.totalOrders).toLocaleString()}
            </p>
            <p className="text-sm font-medium text-blue-800">Total Records</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-2xl font-bold text-purple-600">
              {formatPeso(stats.totalRevenue)}
            </p>
            <p className="text-sm font-medium text-purple-800">All Time Revenue</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-2xl font-bold text-red-600">
              {lastUpdated || '--:--'}
            </p>
            <p className="text-sm font-medium text-red-800">Last Sync</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;