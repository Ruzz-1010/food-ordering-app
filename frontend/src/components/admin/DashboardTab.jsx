// DashboardTab.jsx - MODERN DASHBOARD WITH REVENUE GRAPH
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Users, Store, Package, DollarSign, TrendingUp, 
  Clock, Activity, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, Calendar, CreditCard, ShoppingBag,
  Zap, ChevronRight, Bell,  RefreshCw
} from 'lucide-react';

// Load ApexCharts from CDN
const loadApexCharts = () => {
  return new Promise((resolve, reject) => {
    if (window.ApexCharts) {
      resolve(window.ApexCharts);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/apexcharts@3.45.0/dist/apexcharts.min.js';
    script.onload = () => resolve(window.ApexCharts);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const API_BASE_URL = 'https://food-ordering-app-83lm.onrender.com/api';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, totalRestaurants: 0, totalOrders: 0, 
    totalRevenue: 0, pendingOrders: 0, todayRevenue: 0,
    yesterdayRevenue: 0, weekRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');
  
  const mainChartRef = useRef(null);
  const sparkline1Ref = useRef(null);
  const sparkline2Ref = useRef(null);

  // Initialize main revenue chart
  const initMainChart = useCallback(async (chartData) => {
    try {
      const ApexCharts = await loadApexCharts();
      if (mainChartRef.current) {
        // Clear previous chart
        mainChartRef.current.innerHTML = '';
        
        const chart = new ApexCharts(mainChartRef.current, {
          series: [{
            name: 'Revenue',
            data: chartData.revenue
          }, {
            name: 'Orders',
            data: chartData.orders.map(o => o * 50) // Scale for visibility
          }],
          chart: {
            type: 'area',
            height: 350,
            toolbar: { show: false },
            fontFamily: 'Inter, system-ui, sans-serif',
            background: 'transparent',
            animations: {
              enabled: true,
              easing: 'easeinout',
              speed: 800
            }
          },
          colors: ['#DC2626', '#3B82F6'],
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.4,
              opacityTo: 0.05,
              stops: [0, 90, 100]
            }
          },
          dataLabels: { enabled: false },
          stroke: {
            curve: 'smooth',
            width: [3, 2],
            dashArray: [0, 4]
          },
          xaxis: {
            categories: chartData.categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
              style: { 
                colors: '#9CA3AF', 
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif'
              }
            },
            crosshairs: {
              show: true,
              stroke: { color: '#E5E7EB', width: 1 }
            }
          },
          yaxis: {
            labels: {
              style: { 
                colors: '#9CA3AF', 
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif'
              },
              formatter: (value) => `₱${(value / 1000).toFixed(0)}k`
            }
          },
          grid: {
            borderColor: '#F3F4F6',
            strokeDashArray: 4,
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } }
          },
          tooltip: {
            theme: 'light',
            shared: true,
            intersect: false,
            y: {
              formatter: function (y, { seriesIndex }) {
                if(typeof y !== "undefined") {
                  return seriesIndex === 0 
                    ? "₱" + y.toLocaleString() 
                    : Math.floor(y / 50) + " orders";
                }
                return y;
              }
            }
          },
          legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            fontFamily: 'Inter, sans-serif',
            markers: { radius: 12 }
          }
        });
        
        chart.render();
      }
    } catch (e) {
      console.error('Chart error:', e);
    }
  }, []);

  // Initialize sparkline charts
  const initSparklines = useCallback(async (data1, data2) => {
    try {
      const ApexCharts = await loadApexCharts();
      
      // Sparkline 1 - Revenue trend
      if (sparkline1Ref.current) {
        sparkline1Ref.current.innerHTML = '';
        new ApexCharts(sparkline1Ref.current, {
          series: [{ data: data1 }],
          chart: {
            type: 'area',
            height: 60,
            sparkline: { enabled: true }
          },
          stroke: { curve: 'smooth', width: 2 },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.3,
              opacityTo: 0.05
            }
          },
          colors: ['#10B981'],
          tooltip: {
            fixed: { enabled: false },
            x: { show: false },
            y: { 
              title: { formatter: () => '' },
              formatter: (val) => `₱${val.toLocaleString()}`
            }
          }
        }).render();
      }

      // Sparkline 2 - Order trend
      if (sparkline2Ref.current) {
        sparkline2Ref.current.innerHTML = '';
        new ApexCharts(sparkline2Ref.current, {
          series: [{ data: data2 }],
          chart: {
            type: 'area',
            height: 60,
            sparkline: { enabled: true }
          },
          stroke: { curve: 'smooth', width: 2 },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.3,
              opacityTo: 0.05
            }
          },
          colors: ['#3B82F6'],
          tooltip: {
            fixed: { enabled: false },
            x: { show: false },
            y: { 
              title: { formatter: () => '' },
              formatter: (val) => `${val} orders`
            }
          }
        }).render();
      }
    } catch (e) {
      console.error('Sparkline error:', e);
    }
  }, []);

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

      const today = new Date();
      const todayStr = today.toDateString();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      // Calculate revenues
      const todayRevenue = orders
        .filter(o => new Date(o.createdAt).toDateString() === todayStr)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      const yesterdayRevenue = orders
        .filter(o => new Date(o.createdAt).toDateString() === yesterdayStr)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      // Week revenue
      let weekRevenue = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        weekRevenue += orders
          .filter(o => new Date(o.createdAt).toDateString() === d.toDateString())
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      }

      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalRestaurants: statsData.totalRestaurants || 0,
        totalOrders: statsData.totalOrders || orders.length,
        totalRevenue: statsData.totalRevenue || 0,
        pendingOrders: orders.filter(o => 
          ['pending', 'confirmed', 'preparing'].includes((o.status || '').toLowerCase())
        ).length,
        todayRevenue,
        yesterdayRevenue,
        weekRevenue
      });

      // Generate chart data based on timeRange
      const chartData = generateChartData(orders, timeRange);
      
      // Initialize charts
      initMainChart(chartData);
      
      // Sparkline data (last 10 points)
      const sparkData1 = chartData.revenue.slice(-10);
      const sparkData2 = chartData.orders.slice(-10);
      initSparklines(sparkData1, sparkData2);

      setRecentOrders(orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
      );
      
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  }, [timeRange, initMainChart, initSparklines]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const generateChartData = (orders, range) => {
    const categories = [];
    const revenue = [];
    const orderCounts = [];
    const now = new Date();
    
    const points = range === '24h' ? 24 : range === '7d' ? 7 : 30;
    
    for (let i = points - 1; i >= 0; i--) {
      const date = new Date(now);
      if (range === '24h') {
        date.setHours(date.getHours() - i);
        const hourOrders = orders.filter(o => {
          const d = new Date(o.createdAt);
          return d.getDate() === date.getDate() && 
                 d.getHours() === date.getHours();
        });
        categories.push(`${date.getHours()}:00`);
        revenue.push(hourOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0));
        orderCounts.push(hourOrders.length);
      } else {
        date.setDate(date.getDate() - i);
        const dayOrders = orders.filter(o => 
          new Date(o.createdAt).toDateString() === date.toDateString()
        );
        categories.push(date.toLocaleDateString('en-US', { 
          weekday: range === '7d' ? 'short' : undefined,
          month: 'short', 
          day: 'numeric' 
        }));
        revenue.push(dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0));
        orderCounts.push(dayOrders.length);
      }
    }

    return { categories, revenue, orders: orderCounts };
  };

  const getStatusColor = (status) => ({
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    preparing: 'bg-orange-100 text-orange-700 border-orange-200',
    ready: 'bg-purple-100 text-purple-700 border-purple-200',
    out_for_delivery: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200'
  }[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200');

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✓',
      preparing: '👨‍🍳',
      ready: '📦',
      out_for_delivery: '🚚',
      delivered: '✅',
      completed: '✅',
      cancelled: '❌'
    };
    return icons[status?.toLowerCase()] || '•';
  };

  const formatPeso = (n) => `₱${Number(n || 0).toLocaleString()}`;

  const calculateGrowth = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Modern Metric Card
  const MetricCard = ({ title, value, subtitle, trend, trendUp, icon: Icon, color, chartRef }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={22} className={color.replace('bg-', 'text-')} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
            trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      
      {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
      
      {chartRef && (
        <div ref={chartRef} className="mt-4 h-16" />
      )}
    </div>
  );

  // Quick Action Card
  const ActionCard = ({ title, value, subtitle, icon: Icon, color, onClick }) => (
    <button 
      onClick={onClick}
      className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 text-left group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${color} bg-opacity-10`}>
          <Icon size={18} className={color.replace('bg-', 'text-')} />
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </button>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Calendar size={14} />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100/80 rounded-xl p-1 border border-gray-200/50">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  timeRange === range 
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range === '24h' ? '24H' : range === '7d' ? '7D' : '30D'}
              </button>
            ))}
          </div>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Today's Revenue"
          value={formatPeso(stats.todayRevenue)}
          subtitle={`vs yesterday ${formatPeso(stats.yesterdayRevenue)}`}
          trend={calculateGrowth(stats.todayRevenue, stats.yesterdayRevenue)}
          trendUp={stats.todayRevenue >= stats.yesterdayRevenue}
          icon={DollarSign}
          color="bg-emerald-500"
          chartRef={sparkline1Ref}
        />
        
        <MetricCard 
          title="Total Revenue"
          value={formatPeso(stats.totalRevenue)}
          subtitle="All time earnings"
          trend={12.5}
          trendUp={true}
          icon={CreditCard}
          color="bg-blue-500"
        />
        
        <MetricCard 
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          subtitle={`${stats.pendingOrders} pending`}
          trend={8.2}
          trendUp={true}
          icon={ShoppingBag}
          color="bg-violet-500"
          chartRef={sparkline2Ref}
        />
        
        <MetricCard 
          title="Active Users"
          value={stats.totalUsers.toLocaleString()}
          subtitle={`${stats.totalRestaurants} restaurants`}
          trend={15.3}
          trendUp={true}
          icon={Users}
          color="bg-amber-500"
        />
      </div>

      {/* Main Chart Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-red-600" />
                Revenue Overview
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Track your revenue and order trends over time
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600"></span>
                <span className="text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-gray-600">Orders (×50)</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <RefreshCw size={32} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <div ref={mainChartRef} className="h-80 w-full" />
          )}
        </div>
        
        {/* Chart Stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50/50">
          <div className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">This Week</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{formatPeso(stats.weekRevenue)}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Daily Average</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {formatPeso(Math.round(stats.weekRevenue / 7))}
            </p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Growth</p>
            <p className="text-lg font-bold text-emerald-600 mt-1 flex items-center justify-center gap-1">
              <ArrowUpRight size={16} />
              24.5%
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                Recent Orders
              </h3>
            </div>
            <button className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
              View all <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading orders...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p>No recent orders</p>
              </div>
            ) : (
              recentOrders.map((order, index) => (
                <div 
                  key={order._id} 
                  className="p-4 flex items-center gap-4 hover:bg-gray-50/80 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xl">
                    {getStatusIcon(order.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm">
                        #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {order.customer?.name || order.user?.name || 'Customer'} • {order.restaurant?.name || 'Restaurant'}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPeso(order.totalAmount)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Pending Alert */}
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Bell size={24} className="text-white" />
                </div>
                <span className="text-4xl font-bold">{stats.pendingOrders}</span>
              </div>
              <p className="text-red-100 font-medium text-lg">Pending Orders</p>
              <p className="text-sm text-red-200/80 mt-1">Require your attention</p>
              <button className="mt-4 w-full py-3 bg-white text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors shadow-lg">
                Review Orders
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <ActionCard 
                title="Restaurants"
                value={stats.totalRestaurants}
                subtitle="Partners"
                icon={Store}
                color="bg-orange-500"
              />
              <ActionCard 
                title="Pending"
                value={stats.pendingOrders}
                subtitle="Orders"
                icon={Clock}
                color="bg-rose-500"
              />
              <ActionCard 
                title="Users"
                value={stats.totalUsers}
                subtitle="Active"
                icon={Users}
                color="bg-blue-500"
              />
              <ActionCard 
                title="Revenue"
                value={formatPeso(stats.todayRevenue)}
                subtitle="Today"
                icon={Zap}
                color="bg-amber-500"
              />
            </div>
          </div>

          {/* Mini Stats */}
          <div className="bg-gray-900 rounded-2xl p-5 text-white">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Performance</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Conversion Rate</span>
                <span className="font-bold text-emerald-400">94.2%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }} />
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-gray-300">Avg. Order Value</span>
                <span className="font-bold">
                  {formatPeso(stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0)}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;