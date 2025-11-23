import React, { useState, useEffect } from 'react';
import {
  Bike, MapPin, Clock, DollarSign, CheckCircle, AlertTriangle, Navigation,
  Battery, Wifi, Signal, User, Settings, LogOut, Package, Star, TrendingUp,
  Calendar, Phone, MessageCircle, Bell, Eye, RefreshCw, Loader, Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // NEW: available orders
  const [availableOrders, setAvailableOrders] = useState([]);

  // Real data state
  const [dashboardData, setDashboardData] = useState({
    stats: { todayEarnings: 0, completedDeliveries: 0, activeDeliveries: 0, pendingDeliveries: 0, rating: 4.5, totalEarnings: 0 },
    orders: [],
    earnings: []
  });

  // 🔍 1. Fetch available orders (NEW)
  const fetchAvailableOrders = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/orders/rider/available`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) setAvailableOrders(data.orders);
  };

  // 📦 2. Fetch rider's own orders + stats
  const fetchRiderData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');

      // rider's orders
      const res = await fetch(`${API_URL}/orders/rider/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let orders = [];
      if (res.ok) {
        const d = await res.json();
        orders = Array.isArray(d) ? d : d.orders || [];
      }

      // stats
      const today = new Date().toISOString().split('T')[0];
      const stats = {
        todayEarnings: orders.filter(o => o.status === 'completed' && (o.createdAt || '').includes(today)).reduce((s, o) => s + (o.deliveryFee || 0), 0),
        completedDeliveries: orders.filter(o => o.status === 'completed').length,
        activeDeliveries: orders.filter(o => ['assigned', 'picked_up', 'on_the_way'].includes(o.status)).length,
        pendingDeliveries: orders.filter(o => o.status === 'pending').length,
        rating: 4.5,
        totalEarnings: orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.deliveryFee || 0), 0)
      };

      // earnings history
      const earningsByDate = {};
      orders.filter(o => o.status === 'completed').forEach(order => {
        const date = (order.createdAt || '').split('T')[0];
        if (!date) return;
        if (!earningsByDate[date]) earningsByDate[date] = { amount: 0, deliveries: 0 };
        earningsByDate[date].amount += order.deliveryFee || 0;
        earningsByDate[date].deliveries += 1;
      });
      const earnings = Object.entries(earningsByDate)
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString(),
          amount: data.amount,
          deliveries: data.deliveries
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 7);

      setDashboardData({ stats, orders, earnings });
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // 🔄 initial load
  useEffect(() => {
    if (!user) return;
    Promise.all([fetchAvailableOrders(), fetchRiderData()]);
    const int = setInterval(fetchAvailableOrders, 15000); // poll every 15s
    return () => clearInterval(int);
  }, [user]);

  // ✅ Accept order
  const handleAcceptOrder = async (orderId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/orders/${orderId}/accept`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ riderId: user.id })
    });
    if (res.ok) {
      alert('✅ Order accepted!');
      await Promise.all([fetchAvailableOrders(), fetchRiderData()]);
    } else alert('❌ Failed to accept');
  };

  // 🧭 helpers
  const startNavigation = (coords) => {
    if (!coords?.lat || !coords?.lng) return alert('📍 Coordinates missing');
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}&travelmode=driving`, '_blank');
  };

  // Customer Details Modal
  const CustomerDetailsModal = ({ order, onClose }) => {
    if (!order) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Customer Details</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Order Information</h4>
                <p><strong>Order ID:</strong> {order.orderId || order._id}</p>
                <p><strong>Restaurant:</strong> {order.restaurantId?.name || order.restaurantName || 'N/A'}</p>
                <p><strong>Total Amount:</strong> ₱{order.totalAmount || 0}</p>
                <p><strong>Delivery Fee:</strong> ₱{order.deliveryFee || 0}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                <p><strong>Name:</strong> {order.customerId?.name || order.customerName || 'N/A'}</p>
                <p><strong>Phone:</strong> {order.customerId?.phone || order.customerPhone || 'N/A'}</p>
                <p><strong>Address:</strong> {order.deliveryAddress || 'N/A'}</p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button onClick={() => startNavigation(order.customerId?.location || order.deliveryCoordinates)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"><Navigation size={16} /><span>Start Navigation</span></button>
                {(order.customerId?.phone || order.customerPhone) && <a href={`tel:${order.customerId?.phone || order.customerPhone}`} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"><Phone size={16} /><span>Call Customer</span></a>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🖥️ UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading rider dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                <Bike className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FoodExpress Rider</h1>
                <p className="text-xs text-gray-500">Welcome, {user?.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button onClick={() => { setRefreshing(true); Promise.all([fetchAvailableOrders(), fetchRiderData()]).finally(() => setRefreshing(false)); }} disabled={refreshing} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /><span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button onClick={logout} className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                <LogOut size={16} /><span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Today's Earnings</p><p className="text-2xl font-bold text-gray-900">₱{dashboardData.stats.todayEarnings}</p></div><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><DollarSign className="text-green-600" size={24} /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Available Orders</p><p className="text-2xl font-bold text-gray-900">{availableOrders.length}</p></div><div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center"><Package className="text-orange-600" size={24} /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Active Deliveries</p><p className="text-2xl font-bold text-gray-900">{dashboardData.stats.activeDeliveries}</p></div><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><Clock className="text-blue-600" size={24} /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total Earnings</p><p className="text-2xl font-bold text-gray-900">₱{dashboardData.stats.totalEarnings}</p></div><div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center"><TrendingUp className="text-purple-600" size={24} /></div></div></div>
        </div>

        {/* NEW: Available Orders */}
        {availableOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🚀 Available Orders ({availableOrders.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableOrders.map((order) => (
                <div key={order._id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{order.orderId}</h4>
                      <p className="text-sm text-gray-600">{order.restaurant?.name || 'Restaurant'} → {order.user?.name || 'Customer'}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Available</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2"><MapPin size={14} className="mr-2" />{order.deliveryAddress}</div>
                  <div className="flex items-center text-sm text-gray-600 mb-3"><DollarSign size={14} className="mr-2" />Fee: ₱{order.deliveryFee || 0}</div>
                  <div className="flex space-x-2">
                    <button onClick={() => { setSelectedOrder(order); setShowCustomerDetails(true); }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm"><Eye size={16} /><span>Details</span></button>
                    <button onClick={() => handleAcceptOrder(order._id)} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 text-sm"><CheckCircle size={16} /><span>Accept</span></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="flex border-b">
                <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>📊 Dashboard</button>
                <button onClick={() => setActiveTab('orders')} className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>🚚 Orders</button>
                <button onClick={() => setActiveTab('earnings')} className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'earnings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>💰 Earnings</button>
              </div>
              <div className="p-6">
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                    {dashboardData.orders.slice(0, 5).map((order) => (
                      <div key={order._id || order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{order.orderId || order._id}</h4>
                            <p className="text-sm text-gray-600">{order.customerId?.name || order.customerName || 'Customer'}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-800' : order.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{order.status}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">{order.deliveryAddress || 'Address not specified'}</p>
                            <p className="text-lg font-bold text-green-600">₱{order.deliveryFee || 0}</p>
                          </div>
                          <button onClick={() => { setSelectedOrder(order); setShowCustomerDetails(true); }} className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"><Eye size={14} /><span>View Details</span></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">All Orders</h3>
                    {dashboardData.orders.length === 0 ? (
                      <div className="text-center py-8"><Package size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No orders found</p></div>
                    ) : (
                      dashboardData.orders.map((order) => (
                        <div key={order._id || order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{order.orderId || order._id}</h4>
                              <p className="text-sm text-gray-600">{order.customerId?.name || order.customerName || 'Customer'} • {order.restaurantId?.name || order.restaurantName || 'Restaurant'}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-800' : order.status === 'assigned' ? 'bg-blue-100 text-blue-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{order.status}</span>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600"><MapPin size={14} className="mr-2" />{order.deliveryAddress || 'Address not specified'}</div>
                            <div className="flex items-center text-sm text-gray-600"><DollarSign size={14} className="mr-2" />Delivery Fee: ₱{order.deliveryFee || 0} • Total: ₱{order.totalAmount || 0}</div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">{new Date(order.createdAt || order.orderDate).toLocaleDateString()}</span>
                            <div className="flex space-x-2">
                              <button onClick={() => { setSelectedOrder(order); setShowCustomerDetails(true); }} className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"><Eye size={14} /><span>Details</span></button>
                              {order.status === 'pending' && <button onClick={() => handleAcceptOrder(order._id || order.id)} className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"><CheckCircle size={14} /><span>Accept</span></button>}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {activeTab === 'earnings' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings History</h3>
                    {dashboardData.earnings.length === 0 ? (
                      <div className="text-center py-8"><DollarSign size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No earnings data available</p></div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {dashboardData.earnings.map((earning, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <p className="text-sm font-medium text-gray-600">{earning.date}</p>
                              <p className="text-xl font-bold text-gray-900">₱{earning.amount}</p>
                              <p className="text-xs text-gray-500">{earning.deliveries} deliveries</p>
                            </div>
                          ))}
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">💰 Payment Information</h4>
                          <p className="text-sm text-blue-800">Next payout: Every Friday, 5:00 PM</p>
                          <p className="text-xs text-blue-700 mt-1">Minimum payout: ₱500 • Payment method: GCash</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActiveTab('orders')} className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="text-center"><Package className="mx-auto text-blue-600 mb-1" size={20} /><span className="text-xs font-medium text-gray-700">View Orders</span></div>
                </button>
                <button onClick={() => { if (dashboardData.orders.length) startNavigation(dashboardData.orders[0].customerId?.location); }} className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <div className="text-center"><Navigation className="mx-auto text-green-600 mb-1" size={20} /><span className="text-xs font-medium text-gray-700">GPS Navigation</span></div>
                </button>
                <button className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="text-center"><MessageCircle className="mx-auto text-purple-600 mb-1" size={20} /><span className="text-xs font-medium text-gray-700">Support</span></div>
                </button>
                <button onClick={() => { setRefreshing(true); Promise.all([fetchAvailableOrders(), fetchRiderData()]).finally(() => setRefreshing(false)); }} className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                  <div className="text-center"><RefreshCw className="mx-auto text-orange-600 mb-1" size={20} /><span className="text-xs font-medium text-gray-700">Refresh Data</span></div>
                </button>
              </div>
            </div>

            {/* Rider Profile */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Rider Profile</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><User className="text-blue-600" size={20} /></div>
                  <div><p className="font-medium text-gray-900">{user?.name}</p><p className="text-sm text-gray-500">{user?.email}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-gray-600">Vehicle</p><p className="font-medium">{user?.vehicleType || 'Motorcycle'}</p></div>
                  <div><p className="text-gray-600">Status</p><p className="font-medium text-green-600">Active</p></div>
                  <div><p className="text-gray-600">Rating</p><p className="font-medium text-yellow-600">{dashboardData.stats.rating}/5</p></div>
                  <div><p className="text-gray-600">Total Trips</p><p className="font-medium">{dashboardData.stats.completedDeliveries}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {showCustomerDetails && <CustomerDetailsModal order={selectedOrder} onClose={() => setShowCustomerDetails(false)} />}
    </div>
  );
};

export default RiderDashboard;