// AnalyticsTab.jsx - PROFESSIONAL ADMIN CHARTS WITH CHART.JS
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Users, Store, Package, DollarSign, 
  Download, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight,
  MoreHorizontal
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const API_BASE_URL = 'https://food-ordering-app-83lm.onrender.com/api';

const AnalyticsTab = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalRestaurants: 0,
    todayRevenue: 0, todayOrders: 0, growth: 12.5
  });
  const [chartData, setChartData] = useState(null);
  const [topRestaurants, setTopRestaurants] = useState([]);

  // Chart options - Modern styling
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13, family: 'Inter' },
        bodyFont: { size: 13, family: 'Inter' },
        displayColors: false,
        callbacks: {
          label: (context) => `₱${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          color: '#9CA3AF', 
          font: { size: 11 },
          maxRotation: 0
        }
      },
      y: {
        grid: { 
          color: '#F3F4F6',
          drawBorder: false
        },
        ticks: {
          color: '#9CA3AF',
          font: { size: 11 },
          callback: (value) => `₱${(value / 1000).toFixed(0)}k`
        }
      }
    },
    elements: {
      line: { tension: 0.4 },
      point: {
        radius: 0,
        hitRadius: 20,
        hoverRadius: 6,
        hoverBorderWidth: 3
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9CA3AF', font: { size: 11 } }
      },
      y: {
        grid: { color: '#F3F4F6', drawBorder: false },
        ticks: { color: '#9CA3AF', font: { size: 11 } }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false }
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch stats
      const statsRes = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsJson = await statsRes.json();
      const s = statsJson.data || statsJson;

      // Fetch orders
      const ordersRes = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ordersJson = await ordersRes.json();
      const orders = ordersJson.orders || ordersJson.data || [];

      setStats({
        totalRevenue: s.totalRevenue || 0,
        totalOrders: s.totalOrders || orders.length,
        totalUsers: s.totalUsers || 0,
        totalRestaurants: s.totalRestaurants || 0,
        todayRevenue: calculateTodayRevenue(orders),
        todayOrders: calculateTodayOrders(orders),
        growth: s.weekGrowth || 12.5
      });

      // Generate chart data
      setChartData(generateChartData(orders, timeRange));
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
    const labels = [];
    const revenueData = [];
    const ordersData = [];
    const now = new Date();

    const days = range === '24h' ? 1 : range === '7d' ? 7 : 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dayRevenue = orders
        .filter(o => new Date(o.createdAt).toDateString() === date.toDateString())
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      const dayOrders = orders.filter(o => 
        new Date(o.createdAt).toDateString() === date.toDateString()
      ).length;

      labels.push(date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }));
      revenueData.push(dayRevenue);
      ordersData.push(dayOrders);
    }

    return {
      line: {
        labels,
        datasets: [{
          label: 'Revenue',
          data: revenueData,
          borderColor: '#DC2626',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(220, 38, 38, 0.2)');
            gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');
            return gradient;
          },
          fill: true,
          borderWidth: 3
        }]
      },
      bar: {
        labels,
        datasets: [{
          label: 'Orders',
          data: ordersData,
          backgroundColor: '#3B82F6',
          borderRadius: 6,
          barThickness: 20
        }]
      },
      doughnut: {
        labels: ['Delivered', 'Preparing', 'Pending', 'Cancelled'],
        datasets: [{
          data: [
            orders.filter(o => o.status === 'delivered').length,
            orders.filter(o => o.status === 'preparing').length,
            orders.filter(o => o.status === 'pending').length,
            orders.filter(o => o.status === 'cancelled').length
          ],
          backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'],
          borderWidth: 0
        }]
      }
    };
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

  if (loading || !chartData) {
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
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`₱${stats.totalRevenue.toLocaleString()}`} 
          change={stats.growth}
          icon={DollarSign}
          subtitle="All time earnings"
        />
        <StatCard 
          title="Today's Revenue" 
          value={`₱${stats.todayRevenue.toLocaleString()}`} 
          change={8.2}
          icon={TrendingUp}
          subtitle={`${stats.todayOrders} orders today`}
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

      {/* Main Chart - Revenue Line */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
            <p className="text-sm text-gray-500">Revenue trend over time</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600"></span>
            <span className="text-sm text-gray-500">Revenue</span>
          </div>
        </div>
        <div className="h-80">
          <Line data={chartData.line} options={lineChartOptions} />
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Volume</h3>
          <div className="h-64">
            <Bar data={chartData.bar} options={barChartOptions} />
          </div>
        </div>

        {/* Order Status Doughnut */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h3>
          <div className="h-48 relative">
            <Doughnut data={chartData.doughnut} options={doughnutOptions} />
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-6 space-y-3">
            {chartData.doughnut.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: chartData.doughnut.datasets[0].backgroundColor[i] }}
                  ></span>
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {chartData.doughnut.datasets[0].data[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Restaurants Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Restaurants</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {topRestaurants.map((restaurant, i) => (
            <div key={restaurant.name} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{restaurant.name}</p>
                <p className="text-sm text-gray-500">{restaurant.orders} orders</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">₱{restaurant.revenue.toLocaleString()}</p>
              </div>
              <div className="w-32">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(restaurant.revenue / topRestaurants[0].revenue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;