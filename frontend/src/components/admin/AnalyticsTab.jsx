// AnalyticsTab.jsx - SIMPLE CLEAN GRAPHS (NO EXTERNAL LIBRARIES)
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Users, Store, Package, DollarSign, 
  BarChart3, PieChart, Activity, RefreshCw, ArrowUpRight
} from 'lucide-react';

const API_BASE_URL = 'https://food-ordering-app-83lm.onrender.com/api';

const AnalyticsTab = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalRestaurants: 0,
    todayRevenue: 0, todayOrders: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);

  // Fetch real data
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch stats
      let statsRes = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);
      
      if (!statsRes?.ok) {
        statsRes = await fetch(`${API_BASE_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      const statsData = await statsRes.json();
      const s = statsData.data || statsData;
      
      // Fetch orders for charts
      const ordersRes = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      const orders = ordersData.orders || ordersData.data || [];
      
      setStats({
        totalRevenue: s.totalRevenue || 0,
        totalOrders: s.totalOrders || orders.length || 0,
        totalUsers: s.totalUsers || 0,
        totalRestaurants: s.totalRestaurants || 0,
        todayRevenue: s.todayRevenue || calculateTodayRevenue(orders),
        todayOrders: s.todayOrders || calculateTodayOrders(orders)
      });

      // Generate chart data
      setRevenueData(generateChartData(orders, timeRange));
      setTopRestaurants(calculateTopRestaurants(orders).slice(0, 5));
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const calculateTodayRevenue = (orders) => {
    const today = new Date().toDateString();
    return orders
      .filter(o => new Date(o.createdAt).toDateString() === today)
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  };

  const calculateTodayOrders = (orders) => {
    const today = new Date().toDateString();
    return orders.filter(o => new Date(o.createdAt).toDateString() === today).length;
  };

  const generateChartData = (orders, range) => {
    const data = [];
    const now = new Date();
    
    if (range === 'today') {
      // Hourly data
      for (let i = 0; i <= now.getHours(); i++) {
        const revenue = orders
          .filter(o => new Date(o.createdAt).getHours() === i)
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        data.push({ label: `${i}:00`, value: revenue, height: 0 });
      }
    } else {
      // Daily data (last 7 days)
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const revenue = orders
          .filter(o => new Date(o.createdAt).toDateString() === date.toDateString())
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        data.push({ 
          label: date.toLocaleDateString('en-US', { weekday: 'short' }), 
          value: revenue,
          height: 0 
        });
      }
    }
    
    // Calculate heights (0-100%)
    const max = Math.max(...data.map(d => d.value)) || 1;
    return data.map(d => ({ ...d, height: (d.value / max) * 100 }));
  };

  const calculateTopRestaurants = (orders) => {
    const map = {};
    orders.forEach(o => {
      const id = o.restaurant?._id || 'unknown';
      const name = o.restaurant?.name || 'Unknown';
      if (!map[id]) map[id] = { name, orders: 0, revenue: 0 };
      map[id].orders++;
      map[id].revenue += (o.totalAmount || 0);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 w-fit mb-3`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-500">Real-time business insights</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
          </select>
          <button
            onClick={fetchData}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard 
          title="Total Revenue" 
          value={`₱${stats.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-green-500"
        />
        <StatCard 
          title="Today's Revenue" 
          value={`₱${stats.todayRevenue.toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-red-500"
          subtitle={`${stats.todayOrders} orders`}
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders.toLocaleString()} 
          icon={Package} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Users" 
          value={stats.totalUsers.toLocaleString()} 
          icon={Users} 
          color="bg-purple-500"
        />
      </div>

      {/* Simple Bar Chart - Revenue */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 size={18} className="text-red-600" />
            Revenue Trend
          </h3>
          <span className="text-xs text-gray-400">
            {timeRange === 'today' ? 'Hourly' : 'Daily'}
          </span>
        </div>

        {/* CSS Bar Chart */}
        <div className="h-48 flex items-end justify-between gap-2">
          {loading ? (
            <div className="w-full flex items-center justify-center text-gray-400">
              <RefreshCw size={24} className="animate-spin" />
            </div>
          ) : revenueData.length === 0 ? (
            <div className="w-full text-center text-gray-400 py-8">No data</div>
          ) : (
            revenueData.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative">
                  <div 
                    className="bg-gradient-to-t from-red-600 to-red-400 rounded-t-lg transition-all duration-500 hover:from-red-700 hover:to-red-500"
                    style={{ height: `${Math.max(item.height, 5)}%`, minHeight: '4px' }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      ₱{item.value.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Simple Line Chart - Order Status */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart size={18} className="text-red-600" />
          Order Distribution
        </h3>
        
        <div className="space-y-3">
          {[
            { label: 'Delivered', value: 65, color: 'bg-green-500' },
            { label: 'Preparing', value: 20, color: 'bg-yellow-500' },
            { label: 'Pending', value: 10, color: 'bg-blue-500' },
            { label: 'Cancelled', value: 5, color: 'bg-red-500' }
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-20">{item.label}</span>
              <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div 
                  className={`h-full ${item.color} transition-all duration-1000 flex items-center justify-end px-2`}
                  style={{ width: `${item.value}%` }}
                >
                  <span className="text-xs font-medium text-white">{item.value}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Restaurants */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Store size={18} className="text-red-600" />
          Top Restaurants
        </h3>
        
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-gray-400 py-4">Loading...</div>
          ) : topRestaurants.length === 0 ? (
            <div className="text-center text-gray-400 py-4">No data</div>
          ) : (
            topRestaurants.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.orders} orders</p>
                </div>
                <p className="font-semibold text-gray-900">₱{r.revenue.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;