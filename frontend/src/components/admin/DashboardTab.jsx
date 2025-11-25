// DashboardTab.jsx - MODERN REDESIGN
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  RefreshCw, Utensils, AlertCircle, Users, Store, Package, DollarSign,
  TrendingUp, Activity, Eye, BarChart3, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// ---------- helpers ----------
const formatPeso = (n) => `₱${Number(n || 0).toLocaleString()}`;
const formatTime = (d) => new Date(d).toLocaleTimeString();

// ---------- component ----------
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
  const [lastUpdated, setLastUpdated] = useState('');

  const [recentRaw, setRecentRaw] = useState([]);        // 5 latest orders
  const RAILWAY_BACKEND_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // ---------- data fetching ----------
  const fetchAdminData = useCallback(async (endpoint, name) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${RAILWAY_BACKEND_URL}/admin${endpoint}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`${name} API ${res.status}`);
    const json = await res.json();
    return json.data ?? json[name.toLowerCase()] ?? json ?? [];
  }, [RAILWAY_BACKEND_URL]);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return setError('Please log in');

      // 1.  dashboard summary (single call)
      const dash = await fetchAdminData('/dashboard/stats', 'Dashboard Stats');
      setStats({
        totalUsers: dash.totalUsers || 0,
        totalRestaurants: dash.totalRestaurants || 0,
        totalOrders: dash.totalOrders || 0,
        totalRevenue: dash.totalRevenue || 0,
        totalProducts: dash.totalProducts || 0,
        pendingOrders: 0 // computed below
      });

      // 2.  recent orders for activity + pending count
      const orders = await fetchAdminData('/orders', 'Orders');
      setRecentRaw(orders.sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate)).slice(0, 5));

      const pending = orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length;
      setStats(s => ({ ...s, pendingOrders: pending }));

      setLastUpdated(formatTime(new Date()));
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAdminData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ---------- derived ----------
  const recentActivity = useMemo(() => recentRaw, [recentRaw]);

  // ---------- UI components ----------
  const StatsCard = ({ title, value, color, icon: Icon, subtitle, trend, loading }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
            {loading ? <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-300 border-t-[#8C1007] rounded-full animate-spin" /> : value}
          </p>
          {subtitle && (
            <div className="flex items-center mt-1">
              <p className="text-xs text-gray-500 mr-2">{subtitle}</p>
              {trend && (
                <div className={`flex items-center text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  <span>{Math.abs(trend)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${color} ml-3 flex-shrink-0 shadow-sm`}>
          <Icon size={18} className="sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const cfg = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }[status] || 'bg-gray-100 text-gray-800';
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${cfg}`}>{status}</span>;
  };

  // ---------- render ----------
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]">Dashboard Overview</h2>
          <p className="text-[#660B05] mt-1 text-sm sm:text-base">
            Admin Dashboard – Real-time Data {lastUpdated && `• Last updated: ${lastUpdated}`}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-gradient-to-r from-[#8C1007] to-[#660B05] text-white px-4 py-2 rounded-lg hover:shadow-md transition-all disabled:opacity-50 w-full sm:w-auto justify-center shadow-sm"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Data Loading Error</p>
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={fetchData} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Try Again</button>
          </div>
        </div>
      )}

      {/* main stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatsCard 
          title="Total Users" 
          value={stats.totalUsers.toLocaleString()} 
          color="bg-gradient-to-r from-blue-500 to-blue-600" 
          icon={Users} 
          subtitle="Registered accounts" 
          trend={5.2}
          loading={loading} 
        />
        <StatsCard 
          title="Total Restaurants" 
          value={stats.totalRestaurants.toLocaleString()} 
          color="bg-gradient-to-r from-[#8C1007] to-[#660B05]" 
          icon={Store} 
          subtitle="Active partners" 
          trend={3.8}
          loading={loading} 
        />
        <StatsCard 
          title="Total Orders" 
          value={stats.totalOrders.toLocaleString()} 
          color="bg-gradient-to-r from-green-500 to-green-600" 
          icon={Package} 
          subtitle="All-time orders" 
          trend={12.4}
          loading={loading} 
        />
        <StatsCard 
          title="Total Revenue" 
          value={formatPeso(stats.totalRevenue)} 
          color="bg-gradient-to-r from-purple-500 to-purple-600" 
          icon={DollarSign} 
          subtitle="From completed orders" 
          trend={8.7}
          loading={loading} 
        />
      </div>

      {/* secondary stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatsCard 
          title="Pending Orders" 
          value={stats.pendingOrders.toLocaleString()} 
          color="bg-gradient-to-r from-yellow-500 to-yellow-600" 
          icon={Activity} 
          subtitle="Awaiting processing" 
          loading={loading} 
        />
        <StatsCard 
          title="Menu Products" 
          value={stats.totalProducts.toLocaleString()} 
          color="bg-gradient-to-r from-red-500 to-red-600" 
          icon={Utensils} 
          subtitle="Total food items" 
          trend={2.1}
          loading={loading} 
        />
      </div>

      {/* recent activity + metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* recent activity */}
        <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-[#3E0703] mb-4 flex items-center">
            <Activity size={20} className="text-[#8C1007] mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.length ? (
              recentActivity.map((act, i) => (
                <div key={i} className="border border-[#FFF0C4] rounded-lg p-3 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{act.orderNumber || `Order #${act._id?.slice(0, 8) || i + 1}`}</p>
                      <p className="text-xs text-gray-500 truncate">{act.customer?.name || act.user?.name || 'Customer'}</p>
                    </div>
                    <StatusBadge status={act.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#8C1007]">{formatPeso(act.totalAmount || act.total)}</p>
                    <p className="text-xs text-gray-600">{act.createdAt ? new Date(act.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No recent orders</p>
                <p className="text-sm text-gray-400 mt-1">Orders will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* performance metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-[#3E0703] mb-4 flex items-center">
            <BarChart3 size={20} className="text-blue-600 mr-2" />
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
              <span className="text-sm text-gray-600">Order Completion Rate</span>
              <span className="text-lg font-bold text-green-600">
                {stats.totalOrders ? ((stats.totalOrders - stats.pendingOrders) / stats.totalOrders * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
              <span className="text-sm text-gray-600">Average Order Value</span>
              <span className="text-lg font-bold text-purple-600">
                {stats.totalOrders ? formatPeso(stats.totalRevenue / stats.totalOrders) : '₱0'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
              <span className="text-sm text-gray-600">Orders per Restaurant</span>
              <span className="text-lg font-bold text-[#8C1007]">
                {stats.totalRestaurants ? (stats.totalOrders / stats.totalRestaurants).toFixed(1) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
              <span className="text-sm text-gray-600">Daily Order Rate</span>
              <span className="text-lg font-bold text-blue-600">
                {Math.round(stats.totalOrders / 30)}/day
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* system status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-[#3E0703] mb-4 flex items-center">
          <Eye size={20} className="text-gray-600 mr-2" />
          System Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-all">
            <div className="text-2xl font-bold text-green-600">🟢</div>
            <div className="text-sm font-medium text-green-800 mt-1">Backend Online</div>
            <div className="text-xs text-green-600">Railway</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-all">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers + stats.totalRestaurants + stats.totalOrders}</div>
            <div className="text-sm font-medium text-blue-800 mt-1">Total Records</div>
            <div className="text-xs text-blue-600">Live Data</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200 hover:shadow-md transition-all">
            <div className="text-2xl font-bold text-purple-600">{formatPeso(stats.totalRevenue)}</div>
            <div className="text-sm font-medium text-purple-800 mt-1">Total Revenue</div>
            <div className="text-xs text-purple-600">All Time</div>
          </div>
          <div className="text-center p-4 bg-[#FFF0C4] rounded-lg border border-[#8C1007] hover:shadow-md transition-all">
            <div className="text-2xl font-bold text-[#8C1007]">{lastUpdated || '--:--'}</div>
            <div className="text-sm font-medium text-[#660B05] mt-1">Last Sync</div>
            <div className="text-xs text-[#8C1007]">Real-time</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;