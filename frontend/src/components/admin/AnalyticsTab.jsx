// AnalyticsTab.jsx - CLEAN MODERN DESIGN
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Store, Package, DollarSign, 
  BarChart3, PieChart, Calendar, Download 
} from 'lucide-react';

const AnalyticsTab = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [data, setData] = useState({
    revenue: 0, orders: 0, users: 0, restaurants: 0,
    topRestaurants: [], orderStats: {}
  });

  const API_URL = 'https://food-ordering-app-83lm.onrender.com/api';

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    // Simulate fetching data
    setData({
      revenue: 125000,
      orders: 450,
      users: 1200,
      restaurants: 45,
      topRestaurants: [
        { name: 'Pizza Palace', orders: 89, revenue: 45000 },
        { name: 'Burger King', orders: 76, revenue: 38000 },
        { name: 'Sushi Master', orders: 54, revenue: 32000 },
      ],
      orderStats: {
        pending: 12, confirmed: 8, preparing: 15, 
        delivered: 380, cancelled: 5
      }
    });
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-sm font-medium text-green-600">
            <TrendingUp size={16} />
            {trend}%
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-gray-500 mt-1">Business insights and reports</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">This Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Revenue" value={`₱${data.revenue.toLocaleString()}`} icon={DollarSign} trend={12.5} color="bg-green-500" />
        <StatCard title="Orders" value={data.orders.toLocaleString()} icon={Package} trend={8.2} color="bg-blue-500" />
        <StatCard title="Users" value={data.users.toLocaleString()} icon={Users} trend={15.3} color="bg-purple-500" />
        <StatCard title="Restaurants" value={data.restaurants} icon={Store} trend={5.1} color="bg-red-500" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-red-600" />
            Order Status
          </h3>
          <div className="space-y-4">
            {Object.entries(data.orderStats).map(([status, count]) => (
              <div key={status} className="flex items-center gap-4">
                <span className="w-20 text-sm text-gray-600 capitalize">{status}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      status === 'delivered' ? 'bg-green-500' :
                      status === 'cancelled' ? 'bg-red-500' :
                      status === 'pending' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${(count / data.orders) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-sm font-medium text-gray-900 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-red-600" />
            Top Restaurants
          </h3>
          <div className="space-y-4">
            {data.topRestaurants.map((restaurant, index) => (
              <div key={restaurant.name} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{restaurant.name}</p>
                  <p className="text-sm text-gray-500">{restaurant.orders} orders</p>
                </div>
                <span className="font-bold text-gray-900">₱{restaurant.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Completion Rate', value: '94.5%', color: 'bg-green-50 border-green-200' },
          { label: 'Avg. Order Value', value: '₱278', color: 'bg-blue-50 border-blue-200' },
          { label: 'Customer Retention', value: '68%', color: 'bg-red-50 border-red-200' },
        ].map((metric) => (
          <div key={metric.label} className={`p-6 rounded-2xl border ${metric.color}`}>
            <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
            <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsTab;