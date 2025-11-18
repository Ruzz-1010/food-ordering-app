import React, { useState, useEffect } from 'react';
import { 
  Bike, MapPin, Clock, DollarSign, 
  CheckCircle, AlertTriangle, Navigation, 
  Battery, Wifi, Signal, User, Settings,
  LogOut, Package, Star, TrendingUp,
  Calendar, Phone, MessageCircle, Bell,
  Eye, RefreshCw, Loader
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Real data state
  const [dashboardData, setDashboardData] = useState({
    stats: {
      todayEarnings: 0,
      completedDeliveries: 0,
      activeDeliveries: 0,
      pendingDeliveries: 0,
      rating: 0,
      totalEarnings: 0
    },
    orders: [],
    earnings: []
  });

  // Fetch rider data from API
  const fetchRiderData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      // Fetch rider's orders
      const ordersResponse = await fetch(`${API_URL}/orders/rider/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let orders = [];
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        orders = Array.isArray(ordersData) ? ordersData : 
                 ordersData.orders || ordersData.data || [];
      }

      // Fetch rider earnings/stats
      const statsResponse = await fetch(`${API_URL}/riders/${user.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let stats = {
        todayEarnings: 0,
        completedDeliveries: 0,
        activeDeliveries: 0,
        pendingDeliveries: 0,
        rating: 4.5, // Default rating
        totalEarnings: 0
      };

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        stats = {
          todayEarnings: statsData.todayEarnings || 0,
          completedDeliveries: statsData.completedDeliveries || 0,
          activeDeliveries: statsData.activeDeliveries || 0,
          pendingDeliveries: statsData.pendingDeliveries || 0,
          rating: statsData.rating || 4.5,
          totalEarnings: statsData.totalEarnings || 0
        };
      } else {
        // Calculate from orders if stats API fails
        const today = new Date().toISOString().split('T')[0];
        stats = {
          todayEarnings: orders.filter(order => 
            order.status === 'completed' && 
            order.createdAt?.includes(today)
          ).reduce((sum, order) => sum + (order.deliveryFee || 0), 0),
          completedDeliveries: orders.filter(order => order.status === 'completed').length,
          activeDeliveries: orders.filter(order => 
            ['assigned', 'picked_up', 'on_the_way'].includes(order.status)
          ).length,
          pendingDeliveries: orders.filter(order => order.status === 'pending').length,
          rating: 4.5,
          totalEarnings: orders.filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + (order.deliveryFee || 0), 0)
        };
      }

      // Calculate earnings history
      const earnings = calculateEarningsHistory(orders);

      setDashboardData({
        stats,
        orders,
        earnings
      });

    } catch (error) {
      console.error('❌ Error fetching rider data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate earnings from orders
  const calculateEarningsHistory = (orders) => {
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    // Group by date
    const earningsByDate = {};
    completedOrders.forEach(order => {
      const date = order.createdAt ? order.createdAt.split('T')[0] : 'Unknown';
      if (!earningsByDate[date]) {
        earningsByDate[date] = { amount: 0, deliveries: 0 };
      }
      earningsByDate[date].amount += order.deliveryFee || 0;
      earningsByDate[date].deliveries += 1;
    });

    // Convert to array and sort by date
    return Object.entries(earningsByDate)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString(),
        dateFull: date,
        amount: data.amount,
        deliveries: data.deliveries
      }))
      .sort((a, b) => new Date(b.dateFull) - new Date(a.dateFull))
      .slice(0, 7); // Last 7 days
  };

  useEffect(() => {
    if (user) {
      fetchRiderData();
    }
  }, [user]);

  // Handle order actions
  const handleAcceptOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/orders/${orderId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ riderId: user.id })
      });

      if (response.ok) {
        await fetchRiderData();
        alert('✅ Order accepted successfully!');
      } else {
        alert('❌ Failed to accept order');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('❌ Error accepting order');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchRiderData();
        setCurrentDelivery(null);
        alert('✅ Order completed successfully!');
      } else {
        alert('❌ Failed to complete order');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      alert('❌ Error completing order');
    }
  };

  const handleStartDelivery = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/orders/${orderId}/start`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchRiderData();
        alert('✅ Delivery started!');
      } else {
        alert('❌ Failed to start delivery');
      }
    } catch (error) {
      console.error('Error starting delivery:', error);
      alert('❌ Error starting delivery');
    }
  };

  // GPS Navigation
  const startNavigation = (coordinates) => {
    if (coordinates && coordinates.lat && coordinates.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      alert('📍 Customer location coordinates not available');
    }
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
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
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

              {order.orderItems && order.orderItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                  <ul className="list-disc list-inside">
                    {order.orderItems.map((item, index) => (
                      <li key={index}>
                        {item.quantity}x {item.name} - ₱{item.price}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {order.specialInstructions && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Special Instructions</h4>
                  <p className="text-gray-700">{order.specialInstructions}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => startNavigation(order.customerId?.location || order.deliveryCoordinates)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <Navigation size={16} />
                  <span>Start Navigation</span>
                </button>
                {order.customerId?.phone && (
                  <a
                    href={`tel:${order.customerId.phone}`}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <Phone size={16} />
                    <span>Call Customer</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                <Bike className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FoodExpress Rider</h1>
                <p className="text-xs text-gray-500">Welcome, {user?.name}</p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchRiderData}
                disabled={refreshing}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Earnings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₱{dashboardData.stats.todayEarnings}</p>
                <p className="text-xs text-gray-500 mt-1">from {dashboardData.stats.completedDeliveries} deliveries</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Active Deliveries */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.activeDeliveries}</p>
                <p className="text-xs text-orange-600 mt-1">in progress</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Package className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          {/* Pending Deliveries */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.pendingDeliveries}</p>
                <p className="text-xs text-blue-600 mt-1">available for pickup</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₱{dashboardData.stats.totalEarnings}</p>
                <p className="text-xs text-purple-600 mt-1">all time</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-sm border mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex-1 py-4 px-6 text-center font-medium ${
                    activeTab === 'dashboard'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex-1 py-4 px-6 text-center font-medium ${
                    activeTab === 'orders'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🚚 Orders
                </button>
                <button
                  onClick={() => setActiveTab('earnings')}
                  className={`flex-1 py-4 px-6 text-center font-medium ${
                    activeTab === 'earnings'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  💰 Earnings
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                    {dashboardData.orders.slice(0, 5).map((order) => (
                      <div key={order._id || order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{order.orderId || order._id}</h4>
                            <p className="text-sm text-gray-600">
                              {order.customerId?.name || order.customerName || 'Customer'}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">
                              {order.deliveryAddress || 'Address not specified'}
                            </p>
                            <p className="text-lg font-bold text-green-600">
                              ₱{order.deliveryFee || 0}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowCustomerDetails(true);
                            }}
                            className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                          >
                            <Eye size={14} />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">All Orders</h3>
                    
                    {dashboardData.orders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No orders found</p>
                      </div>
                    ) : (
                      dashboardData.orders.map((order) => (
                        <div key={order._id || order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{order.orderId || order._id}</h4>
                              <p className="text-sm text-gray-600">
                                {order.customerId?.name || order.customerName || 'Customer'} • 
                                {order.restaurantId?.name || order.restaurantName || 'Restaurant'}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin size={14} className="mr-2" />
                              {order.deliveryAddress || 'Address not specified'}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <DollarSign size={14} className="mr-2" />
                              Delivery Fee: ₱{order.deliveryFee || 0} • Total: ₱{order.totalAmount || 0}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              {new Date(order.createdAt || order.orderDate).toLocaleDateString()}
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowCustomerDetails(true);
                                }}
                                className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                              >
                                <Eye size={14} />
                                <span>Details</span>
                              </button>
                              
                              {order.status === 'pending' && (
                                <button 
                                  onClick={() => handleAcceptOrder(order._id || order.id)}
                                  className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                                >
                                  <CheckCircle size={14} />
                                  <span>Accept</span>
                                </button>
                              )}
                              
                              {order.status === 'assigned' && (
                                <button 
                                  onClick={() => handleStartDelivery(order._id || order.id)}
                                  className="flex items-center space-x-1 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 text-sm"
                                >
                                  <Navigation size={14} />
                                  <span>Start</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'earnings' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Earnings History</h3>
                    
                    {dashboardData.earnings.length === 0 ? (
                      <div className="text-center py-8">
                        <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No earnings data available</p>
                      </div>
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
                          <p className="text-sm text-blue-800">
                            Next payout: Every Friday, 5:00 PM
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Minimum payout: ₱500 • Payment method: GCash
                          </p>
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
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="text-center">
                    <Package className="mx-auto text-blue-600 mb-1" size={20} />
                    <span className="text-xs font-medium text-gray-700">View Orders</span>
                  </div>
                </button>
                <button 
                  onClick={() => {
                    if (dashboardData.orders.length > 0) {
                      const firstOrder = dashboardData.orders[0];
                      startNavigation(firstOrder.customerId?.location || firstOrder.deliveryCoordinates);
                    }
                  }}
                  className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="text-center">
                    <Navigation className="mx-auto text-green-600 mb-1" size={20} />
                    <span className="text-xs font-medium text-gray-700">GPS Navigation</span>
                  </div>
                </button>
                <button className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="text-center">
                    <MessageCircle className="mx-auto text-purple-600 mb-1" size={20} />
                    <span className="text-xs font-medium text-gray-700">Support</span>
                  </div>
                </button>
                <button 
                  onClick={fetchRiderData}
                  className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="text-center">
                    <RefreshCw className="mx-auto text-orange-600 mb-1" size={20} />
                    <span className="text-xs font-medium text-gray-700">Refresh Data</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Rider Profile */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Rider Profile</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Vehicle</p>
                    <p className="font-medium">{user?.vehicleType || 'Motorcycle'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-medium text-green-600">Active</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Rating</p>
                    <p className="font-medium text-yellow-600">{dashboardData.stats.rating}/5</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Trips</p>
                    <p className="font-medium">{dashboardData.stats.completedDeliveries}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {showCustomerDetails && (
        <CustomerDetailsModal 
          order={selectedOrder} 
          onClose={() => {
            setShowCustomerDetails(false);
            setSelectedOrder(null);
          }} 
        />
      )}
    </div>
  );
};

export default RiderDashboard;