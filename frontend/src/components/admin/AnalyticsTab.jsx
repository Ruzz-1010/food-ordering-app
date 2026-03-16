// AnalyticsTab.jsx - FIXED VERSION WITH ERROR HANDLING
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Users, Store, Package, DollarSign, 
  BarChart3, PieChart, Calendar, Download, Activity,
  RefreshCw, ArrowUpRight, ArrowDownRight, AlertCircle
} from 'lucide-react';

// Try to import recharts - if it fails, we'll show fallback UI
let RechartsComponents = {};
try {
  const Recharts = require('recharts');
  RechartsComponents = {
    AreaChart: Recharts.AreaChart,
    Area: Recharts.Area,
    XAxis: Recharts.XAxis,
    YAxis: Recharts.YAxis,
    CartesianGrid: Recharts.CartesianGrid,
    Tooltip: Recharts.Tooltip,
    ResponsiveContainer: Recharts.ResponsiveContainer,
    BarChart: Recharts.BarChart,
    Bar: Recharts.Bar,
    PieChart: Recharts.PieChart,
    Pie: Recharts.Pie,
    Cell: Recharts.Cell
  };
} catch (e) {
  console.warn('Recharts not available:', e.message);
}

const API_BASE_URL = 'https://food-ordering-app-83lm.onrender.com/api';

const AnalyticsTab = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  // Real data states
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRestaurants: 0,
    todayRevenue: 0,
    todayOrders: 0,
    weekGrowth: 0
  });

  const [revenueData, setRevenueData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [hourlyOrders, setHourlyOrders] = useState([]);

  const hasRecharts = Object.keys(RechartsComponents).length > 0;

  const COLORS = {
    primary: '#DC2626',
    secondary: '#EF4444',
    accent: '#F87171',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    purple: '#8B5CF6',
    orange: '#F97316'
  };

  // Safe data processing
  const safeNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');
      setDebugInfo('Fetching data...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view analytics');
        setLoading(false);
        return;
      }

      setDebugInfo('Trying stats endpoints...');
      
      // Try multiple endpoints
      let statsData = null;
      const endpoints = ['/admin/dashboard/stats', '/admin/stats', '/stats'];
      
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          setDebugInfo(`Trying ${endpoint}... Status: ${res.status}`);
          
          if (res.ok) {
            const json = await res.json();
            statsData = json.data || json;
            setDebugInfo(`Success with ${endpoint}`);
            break;
          }
        } catch (e) {
          setDebugInfo(`Failed ${endpoint}: ${e.message}`);
          console.log(`Endpoint ${endpoint} failed:`, e);
        }
      }

      // Fetch orders
      setDebugInfo('Fetching orders...');
      let ordersData = [];
      try {
        const res = await fetch(`${API_BASE_URL}/admin/orders`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const json = await res.json();
          ordersData = json.orders || json.data || [];
          setDebugInfo(`Got ${ordersData.length} orders`);
        } else {
          setDebugInfo(`Orders failed: ${res.status}`);
        }
      } catch (e) {
        setDebugInfo(`Orders error: ${e.message}`);
        console.log('Orders fetch failed:', e);
      }

      // Process stats safely
      const processedStats = {
        totalRevenue: safeNumber(statsData?.totalRevenue || statsData?.revenue),
        totalOrders: safeNumber(statsData?.totalOrders || statsData?.orders || ordersData.length),
        totalUsers: safeNumber(statsData?.totalUsers || statsData?.users),
        totalRestaurants: safeNumber(statsData?.totalRestaurants || statsData?.restaurants),
        todayRevenue: safeNumber(statsData?.todayRevenue),
        todayOrders: safeNumber(statsData?.todayOrders),
        weekGrowth: safeNumber(statsData?.weekGrowth)
      };

      // If no todayRevenue in stats, calculate from orders
      if (processedStats.todayRevenue === 0 && ordersData.length > 0) {
        const today = new Date().toDateString();
        processedStats.todayRevenue = ordersData
          .filter(o => {
            try {
              return new Date(o.createdAt).toDateString() === today && 
                     ['delivered', 'completed'].includes((o.status || '').toLowerCase());
            } catch (e) { return false; }
          })
          .reduce((sum, o) => sum + safeNumber(o.totalAmount || o.total), 0);
        
        processedStats.todayOrders = ordersData.filter(o => {
          try {
            return new Date(o.createdAt).toDateString() === today;
          } catch (e) { return false; }
        }).length;
      }

      setStats(processedStats);
      setDebugInfo(`Stats: Users=${processedStats.totalUsers}, Orders=${processedStats.totalOrders}`);

      // Generate chart data safely
      try {
        const chartData = generateRevenueChartData(ordersData, timeRange);
        setRevenueData(chartData);
        
        const statusCounts = calculateOrderStatus(ordersData);
        setOrderStatusData([
          { name: 'Delivered', value: statusCounts.delivered || 0, color: COLORS.success },
          { name: 'Preparing', value: statusCounts.preparing || 0, color: COLORS.warning },
          { name: 'Pending', value: statusCounts.pending || 0, color: COLORS.info },
          { name: 'Cancelled', value: statusCounts.cancelled || 0, color: COLORS.primary }
        ]);

        const topRests = calculateTopRestaurants(ordersData);
        setTopRestaurants(topRests.slice(0, 5));

        const hourly = calculateHourlyDistribution(ordersData);
        setHourlyOrders(hourly);
        
        setDebugInfo('All data processed successfully');
      } catch (chartError) {
        setDebugInfo(`Chart error: ${chartError.message}`);
        console.error('Chart data error:', chartError);
      }

      setLastUpdated(new Date().toLocaleTimeString());
      
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err.message || 'Failed to load analytics');
      setDebugInfo(`Fatal error: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  // Safe calculation functions
  const calculateTodayRevenue = (orders) => {
    try {
      const today = new Date().toDateString();
      return orders
        .filter(o => {
          try {
            return new Date(o.createdAt).toDateString() === today && 
                   ['delivered', 'completed'].includes((o.status || '').toLowerCase());
          } catch (e) { return false; }
        })
        .reduce((sum, o) => sum + safeNumber(o.totalAmount || o.total), 0);
    } catch (e) {
      return 0;
    }
  };

  const calculateOrderStatus = (orders) => {
    const counts = { delivered: 0, preparing: 0, pending: 0, cancelled: 0, other: 0 };
    if (!Array.isArray(orders)) return counts;
    
    orders.forEach(o => {
      const status = (o.status || 'other').toLowerCase();
      if (counts.hasOwnProperty(status)) counts[status]++;
      else counts.other++;
    });
    return counts;
  };

  const calculateTopRestaurants = (orders) => {
    if (!Array.isArray(orders)) return [];
    const restMap = {};
    
    orders.forEach(o => {
      const restId = o.restaurant?._id || o.restaurant?.id || 'unknown';
      const restName = o.restaurant?.name || 'Unknown Restaurant';
      
      if (!restMap[restId]) {
        restMap[restId] = { name: restName, orders: 0, revenue: 0 };
      }
      restMap[restId].orders++;
      
      if (['delivered', 'completed'].includes((o.status || '').toLowerCase())) {
        restMap[restId].revenue += safeNumber(o.totalAmount || o.total);
      }
    });
    
    return Object.values(restMap).sort((a, b) => b.revenue - a.revenue);
  };

  const calculateHourlyDistribution = (orders) => {
    const hours = Array(24).fill(0).map((_, i) => ({ 
      hour: i, 
      orders: 0, 
      label: `${i}:00` 
    }));
    
    if (!Array.isArray(orders)) return hours;
    
    orders.forEach(o => {
      try {
        const hour = new Date(o.createdAt).getHours();
        if (hours[hour]) hours[hour].orders++;
      } catch (e) {}
    });
    
    return hours;
  };

  const generateRevenueChartData = (orders, range) => {
    if (!Array.isArray(orders)) return [];
    
    const now = new Date();
    const data = [];

    if (range === 'today') {
      for (let i = 0; i <= now.getHours(); i++) {
        const hourRevenue = orders
          .filter(o => {
            try {
              const d = new Date(o.createdAt);
              return d.getDate() === now.getDate() && 
                     d.getMonth() === now.getMonth() && 
                     d.getHours() === i &&
                     ['delivered', 'completed'].includes((o.status || '').toLowerCase());
            } catch (e) { return false; }
          })
          .reduce((sum, o) => sum + safeNumber(o.totalAmount || o.total), 0);
        
        data.push({
          time: `${i}:00`,
          revenue: hourRevenue,
          orders: orders.filter(o => {
            try {
              return new Date(o.createdAt).getHours() === i;
            } catch (e) { return false; }
          }).length
        });
      }
    } else if (range === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const dayRevenue = orders
          .filter(o => {
            try {
              return new Date(o.createdAt).toDateString() === date.toDateString() &&
                     ['delivered', 'completed'].includes((o.status || '').toLowerCase());
            } catch (e) { return false; }
          })
          .reduce((sum, o) => sum + safeNumber(o.totalAmount || o.total), 0);

        data.push({
          time: dayStr,
          revenue: dayRevenue,
          orders: orders.filter(o => {
            try {
              return new Date(o.createdAt).toDateString() === date.toDateString();
            } catch (e) { return false; }
          }).length
        });
      }
    } else {
      for (let i = 29; i >= 0; i -= 3) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const periodRevenue = orders
          .filter(o => {
            try {
              const d = new Date(o.createdAt);
              const daysDiff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
              return daysDiff >= i && daysDiff < i + 3 &&
                     ['delivered', 'completed'].includes((o.status || '').toLowerCase());
            } catch (e) { return false; }
          })
          .reduce((sum, o) => sum + safeNumber(o.totalAmount || o.total), 0);

        data.push({
          time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: periodRevenue,
          orders: orders.filter(o => {
            try {
              const d = new Date(o.createdAt);
              const daysDiff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
              return daysDiff >= i && daysDiff < i + 3;
            } catch (e) { return false; }
          }).length
        });
      }
    }
    return data;
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const StatCard = ({ title, value, change, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        {change !== undefined && change !== 0 && (
          <span className={`flex items-center gap-1 text-sm font-medium ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );

  // Simple bar chart fallback (no recharts needed)
  const SimpleBarChart = ({ data, maxValue }) => {
    if (!data || data.length === 0) return <div className="text-center text-gray-400 py-8">No data</div>;
    
    const max = maxValue || Math.max(...data.map(d => d.revenue || d.orders || 0)) || 1;
    
    return (
      <div className="space-y-2">
        {data.map((item, i) => {
          const value = item.revenue || item.orders || 0;
          const percent = (value / max) * 100;
          
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-12 text-right">{item.time}</span>
              <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                <div 
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{ width: `${Math.max(percent, 1)}%` }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
                  {value > 0 && `₱${value.toLocaleString()}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render the main revenue chart
  const renderRevenueChart = () => {
    if (loading) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-400">
          <RefreshCw size={32} className="animate-spin mr-2" />
          Loading chart data...
        </div>
      );
    }

    if (!hasRecharts) {
      // Fallback to simple CSS bar chart
      return (
        <div className="h-80 overflow-y-auto">
          <SimpleBarChart data={revenueData} />
        </div>
      );
    }

    const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = RechartsComponents;

    if (revenueData.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-400">
          <BarChart3 size={48} className="mb-2 opacity-30" />
          <p>No revenue data available</p>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="time" 
            stroke="#9ca3af" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#9ca3af" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
            }}
            formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Revenue']}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke={COLORS.primary} 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {/* Debug Info (remove in production) */}
      {debugInfo && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-mono">
          Debug: {debugInfo} | Recharts: {hasRecharts ? 'Yes' : 'No'}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-500 mt-1">
            {lastUpdated ? `Last updated: ${lastUpdated}` : 'Loading...'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm"
          >
            <option value="today">Today (Hourly)</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={20} />
            <p className="font-medium">Error loading analytics</p>
          </div>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`₱${stats.totalRevenue.toLocaleString()}`} 
          change={stats.weekGrowth}
          icon={DollarSign} 
          color="bg-green-500"
          subtitle="All time earnings"
        />
        <StatCard 
          title="Today's Revenue" 
          value={`₱${stats.todayRevenue.toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-red-500"
          subtitle={`${stats.todayOrders} orders today`}
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders.toLocaleString()} 
          change={8.2}
          icon={Package} 
          color="bg-blue-500"
          subtitle="Lifetime orders"
        />
        <StatCard 
          title="Active Users" 
          value={stats.totalUsers.toLocaleString()} 
          change={12.5}
          icon={Users} 
          color="bg-purple-500"
          subtitle="Registered accounts"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity size={20} className="text-red-600" />
              Revenue Overview
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {timeRange === 'today' ? 'Hourly revenue for today' : 
               timeRange === 'week' ? 'Daily revenue trend' : 'Monthly revenue overview'}
            </p>
          </div>
          {!hasRecharts && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              Simple View (Install recharts for full charts)
            </span>
          )}
        </div>

        <div className="h-80">
          {renderRevenueChart()}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Peak Hour</p>
            <p className="text-lg font-bold text-gray-900">12:00 PM</p>
            <p className="text-xs text-green-600">₱12,450</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Avg. Order Value</p>
            <p className="text-lg font-bold text-gray-900">
              ₱{stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Conversion</p>
            <p className="text-lg font-bold text-gray-900">94.2%</p>
          </div>
        </div>
      </div>

      {/* Top Restaurants */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Store size={20} className="text-red-600" />
          Top Performing Restaurants
        </h3>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : topRestaurants.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Store size={48} className="mx-auto mb-3 opacity-30" />
              <p>No restaurant data available</p>
            </div>
          ) : (
            topRestaurants.map((restaurant, index) => (
              <div key={restaurant.name} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{restaurant.name}</p>
                  <p className="text-sm text-gray-500">{restaurant.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₱{restaurant.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;