import React, { useState, useEffect } from 'react';
import {
  Navigation, Package, DollarSign, Clock, CheckCircle, Phone, 
  X, LogOut, RefreshCw, MapPin, Store, User, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

const RiderDashboard = () => {
  const { user, logout, getUserId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const token = localStorage.getItem('token');

  // ✅ Fetch available orders
  const fetchAvailable = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/rider/available`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      const data = await res.json();
      if (data.success) setAvailable(data.orders || []);
    } catch (error) {
      console.error('Error fetching available orders:', error);
      setAvailable([]);
    }
  };

  // ✅ Fetch my deliveries
  const fetchMyDeliveries = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/rider/my-deliveries`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      const data = await res.json();
      if (data.success) setMyDeliveries(data.orders || []);
    } catch (error) {
      console.error('Error fetching my deliveries:', error);
      setMyDeliveries([]);
    }
  };

  // ✅ ACCEPT ORDER - FIXED!
  const acceptOrder = async (orderId) => {
    try {
      const riderId = getUserId();
      
      if (!riderId) {
        alert('❌ Error: Rider ID not found.');
        return;
      }

      const res = await fetch(`${API_URL}/orders/${orderId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ riderId }) // DITO ANG FIX - kasama ang riderId
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('✅ Order assigned to you!');
        await fetchAvailable();
        await fetchMyDeliveries();
      } else {
        alert(`❌ Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error accepting order:', error);
      alert('❌ Failed to accept order. Please try again.');
    }
  };

  // ✅ Update delivery status
  const updateStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/delivery-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(`✅ Status updated to ${status}`);
        await fetchMyDeliveries();
      } else {
        alert(`❌ Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
      alert('❌ Failed to update status. Please try again.');
    }
  };

  // 🔄 Load data
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchAvailable(), fetchMyDeliveries()]);
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Load on mount
  useEffect(() => {
    if (user && user.role === 'rider') {
      loadData();
    }
  }, [user]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₱0';
    return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Stats
  const stats = {
    availableOrders: available.length,
    myDeliveries: myDeliveries.length,
    pendingDeliveries: myDeliveries.filter(order => 
      ['assigned', 'out_for_delivery'].includes(order.status)
    ).length,
    completedDeliveries: myDeliveries.filter(order => 
      order.status === 'delivered'
    ).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Rider Data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600">Please login to access the rider dashboard.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'rider') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This dashboard is for riders only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Navigation className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Rider Dashboard</h1>
                <p className="text-sm text-gray-500">{user.name} • {user.email}</p>
                <p className="text-xs text-gray-400">
                  Available: {stats.availableOrders} | My Deliveries: {stats.myDeliveries}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={loadData} 
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
              <button 
                onClick={logout} 
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Available Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.availableOrders}</p>
            <p className="text-xs text-blue-600">ready for pickup</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">My Deliveries</p>
            <p className="text-2xl font-bold text-gray-900">{stats.myDeliveries}</p>
            <p className="text-xs text-orange-600">assigned to me</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingDeliveries}</p>
            <p className="text-xs text-orange-600">to be delivered</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completedDeliveries}</p>
            <p className="text-xs text-green-600">delivered</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button 
            onClick={() => setActiveTab('available')} 
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'available' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Available Orders ({available.length})
          </button>
          <button 
            onClick={() => setActiveTab('my-deliveries')} 
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'my-deliveries' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            My Deliveries ({myDeliveries.length})
          </button>
        </div>

        {/* Available Orders */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {available.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No available orders</p>
                <p className="text-gray-400">Orders ready for delivery will appear here</p>
                <button 
                  onClick={loadData} 
                  className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                >
                  Check Again
                </button>
              </div>
            ) : (
              available.map(order => (
                <div key={order._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        Order #{order.orderId || order._id}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {formatDate(order.createdAt)}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start space-x-2">
                          <Store size={16} className="text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium text-sm">Restaurant</p>
                            <p className="text-gray-600">{order.restaurant?.name || 'Unknown Restaurant'}</p>
                            <p className="text-xs text-gray-500">{order.restaurant?.address || 'No address'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <MapPin size={16} className="text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium text-sm">Delivery Address</p>
                            <p className="text-gray-600">{order.deliveryAddress || 'No address provided'}</p>
                          </div>
                        </div>
                      </div>

                      {order.user && (
                        <div className="flex items-start space-x-2 mb-3">
                          <User size={16} className="text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium text-sm">Customer</p>
                            <p className="text-gray-600">{order.user.name || 'Customer'}</p>
                            {order.user.phone && (
                              <p className="text-xs text-gray-500">{order.user.phone}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(order.total || order.totalAmount)}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded ${
                        order.status === 'ready' ? 'bg-green-100 text-green-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                      className="flex items-center space-x-2 text-orange-600 hover:text-orange-700"
                    >
                      <Eye size={16} />
                      <span>View Details</span>
                    </button>
                    
                    <div className="flex space-x-3">
                      {order.user?.phone && (
                        <a 
                          href={`tel:${order.user.phone}`}
                          className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                          <Phone size={16} />
                          <span>Call Customer</span>
                        </a>
                      )}
                      <button 
                        onClick={() => acceptOrder(order._id)}
                        className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                      >
                        <CheckCircle size={16} />
                        <span>Accept Order</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* My Deliveries */}
        {activeTab === 'my-deliveries' && (
          <div className="space-y-4">
            {myDeliveries.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No deliveries assigned</p>
                <p className="text-gray-400">Accepted orders will appear here</p>
                <button 
                  onClick={() => setActiveTab('available')}
                  className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                >
                  View Available Orders
                </button>
              </div>
            ) : (
              myDeliveries.map(order => (
                <div key={order._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          Order #{order.orderId || order._id}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                          order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        {formatDate(order.createdAt)}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start space-x-2">
                          <Store size={16} className="text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium text-sm">Restaurant</p>
                            <p className="text-gray-600">{order.restaurant?.name || 'Unknown Restaurant'}</p>
                            <p className="text-xs text-gray-500">{order.restaurant?.address || 'No address'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <MapPin size={16} className="text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium text-sm">Delivery Address</p>
                            <p className="text-gray-600">{order.deliveryAddress || 'No address provided'}</p>
                          </div>
                        </div>
                      </div>

                      {order.user && (
                        <div className="flex items-start space-x-2 mb-3">
                          <User size={16} className="text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium text-sm">Customer</p>
                            <p className="text-gray-600">{order.user.name || 'Customer'}</p>
                            {order.user.phone && (
                              <p className="text-xs text-gray-500">{order.user.phone}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(order.total || order.totalAmount)}
                      </p>
                      <p className="text-sm text-gray-500">Delivery Fee</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                      className="flex items-center space-x-2 text-orange-600 hover:text-orange-700"
                    >
                      <Eye size={16} />
                      <span>View Details</span>
                    </button>
                    
                    <div className="flex space-x-3">
                      {order.user?.phone && (
                        <a 
                          href={`tel:${order.user.phone}`}
                          className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                          <Phone size={16} />
                          <span>Call Customer</span>
                        </a>
                      )}
                      
                      {order.status === 'assigned' && (
                        <button 
                          onClick={() => updateStatus(order._id, 'out_for_delivery')}
                          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          <Navigation size={16} />
                          <span>Start Delivery</span>
                        </button>
                      )}
                      
                      {order.status === 'out_for_delivery' && (
                        <button 
                          onClick={() => updateStatus(order._id, 'delivered')}
                          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          <CheckCircle size={16} />
                          <span>Mark Delivered</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;