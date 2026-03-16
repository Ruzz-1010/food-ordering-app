// AnalyticsTab.jsx - CDN VERSION (NO NPM INSTALL NEEDED)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TrendingUp, Users, Store, Package, DollarSign, 
  Download, RefreshCw, ArrowUpRight, ArrowDownRight
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

const AnalyticsTab = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalRestaurants: 0,
    todayRevenue: 0, todayOrders: 0, growth: 12.5
  });
  
  const revenueChartRef = useRef(null);
  const barChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const [topRestaurants, setTopRestaurants] = useState([]);

  const initCharts = useCallback(async (data) => {
    try {
      const ApexCharts = await loadApexCharts();
      
      // Revenue Area Chart
      if (revenueChartRef.current) {
        const revenueChart = new ApexCharts(revenueChartRef.current, {
          series: [{ name: 'Revenue', data: data.revenue }],
          chart: {
            type: 'area',
            height: 350,
            toolbar: { show: false },
            fontFamily: 'Inter, sans-serif'
          },
          colors: ['#DC2626'],
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.4,
              opacityTo: 0.05,
              stops: [0, 100]
            }
          },
          dataLabels: { enabled: false },
          stroke: { curve: 'smooth', width: 3 },
          xaxis: {
            categories: data.categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#9CA3AF', fontSize: '12px' } }
          },
          yaxis: {
            labels: {
              style: { colors: '#9CA3AF', fontSize: '12px' },
              formatter: (value) => `₱${(value / 1000).toFixed(0)}k`
            }
          },
          grid: {
            borderColor: '#F3F4F6',
            strokeDashArray: 4
          },
          tooltip: {
            theme: 'light',
            y: { formatter: (value) => `₱${value.toLocaleString()}` }
          }
        });
        revenueChart.render();
      }

      // Bar Chart
      if (barChartRef.current) {
        const barChart = new ApexCharts(barChartRef.current, {
          series: [{ name: 'Orders', data: data.orderCounts }],
          chart: {
            type: 'bar',
            height: 250,
            toolbar: { show: false },
            fontFamily: 'Inter, sans-serif'
          },
          colors: ['#3B82F6'],
          plotOptions: {
            bar: { borderRadius: 6, columnWidth: '60%' }
          },
          dataLabels: { enabled: false },
          xaxis: {
            categories: data.categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#9CA3AF', fontSize: '11px' } }
          },
          yaxis: {
            labels: { style: { colors: '#9CA3AF', fontSize: '12px' } }
          },
          grid: { borderColor: '#F3F4F6', strokeDashArray: 4 }
        });
        barChart.render();
      }

      // Donut Chart
      if (donutChartRef.current) {
        const donutChart = new ApexCharts(donutChartRef.current, {
          series: data.statusCounts,
          chart: {
            type: 'donut',
            fontFamily: 'Inter, sans-serif'
          },
          colors: ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'],
          labels: ['Delivered', 'Preparing', 'Pending', 'Cancelled'],
          plotOptions: {
            pie: {
              donut: {
                size: '75%',
                labels: {
                  show: true,
                  name: { show: false },
                  value: {
                    show: true,
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#111827',
                    formatter: (val) => val
                  },
                  total: {
                    show: true,
                    showAlways: true,
                    label: 'Total',
                    fontSize: '14px',
                    color: '#6B7280',
                    formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0)
                  }
                }
              }
            }
          },
          dataLabels: { enabled: false },
          legend: {
            show: true,
            position: 'bottom',
            fontSize: '12px'
          }
        });
        donutChart.render();
      }
      
    } catch (err) {
      console.error('Chart init error:', err);
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

      setStats({
        totalRevenue: statsData.totalRevenue || 0,
        totalOrders: statsData.totalOrders || orders.length,
        totalUsers: statsData.totalUsers || 0,
        totalRestaurants: statsData.totalRestaurants || 0,
        todayRevenue: calculateTodayRevenue(orders),
        todayOrders: calculateTodayOrders(orders),
        growth: statsData.weekGrowth || 12.5
      });

      const chartData = generateChartData(orders, timeRange);
      setTopRestaurants(calculateTopRestaurants(orders).slice(0, 5));
      
      // Initialize charts after data is set
      setTimeout(() => initCharts(chartData), 100);
      
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  }, [timeRange, initCharts]);

  useEffect(() => {
    fetchData();
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
    const categories = [];
    const revenue = [];
    const orderCounts = [];
    const statusCounts = [0, 0, 0, 0]; // delivered, preparing, pending, cancelled
    const days = range === '24h' ? 1 : range === '7d' ? 7 : 30;
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dayOrders = orders.filter(o => 
        new Date(o.createdAt).toDateString() === date.toDateString()
      );
      
      categories.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      revenue.push(dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0));
      orderCounts.push(dayOrders.length);
    }

    orders.forEach(o => {
      const status = (o.status || '').toLowerCase();
      if (status === 'delivered') statusCounts[0]++;
      else if (status === 'preparing') statusCounts[1]++;
      else if (status === 'pending') statusCounts[2]++;
      else if (status === 'cancelled') statusCounts[3]++;
    });

    return { categories, revenue, orderCounts, statusCounts };
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

  const StatCard = ({ title, value, change, icon: Icon, subtitle }) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2.5 bg-gray-50 rounded-xl">
          <Icon size={20} className="text-gray-700" />
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw size={32} className="animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
          <p className="text-gray-500">Track your business performance</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`₱${stats.totalRevenue.toLocaleString()}`} 
          change={stats.growth}
          icon={DollarSign}
        />
        <StatCard 
          title="Today's Revenue" 
          value={`₱${stats.todayRevenue.toLocaleString()}`} 
          change={8.2}
          icon={TrendingUp}
          subtitle={`${stats.todayOrders} orders`}
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders.toLocaleString()} 
          change={12.5}
          icon={Package}
        />
        <StatCard 
          title="Active Users" 
          value={stats.totalUsers.toLocaleString()} 
          change={5.3}
          icon={Users}
        />
      </div>

      {/* Main Revenue Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <p className="text-sm text-gray-500">Revenue over time</p>
        </div>
        <div ref={revenueChartRef} className="h-80" />
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Volume</h3>
          <div ref={barChartRef} className="h-64" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
          <div ref={donutChartRef} className="h-64" />
        </div>
      </div>

      {/* Top Restaurants */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Top Restaurants</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {topRestaurants.map((r, i) => (
            <div key={r.name} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{r.name}</p>
                <p className="text-sm text-gray-500">{r.orders} orders</p>
              </div>
              <p className="font-semibold text-gray-900">₱{r.revenue.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;