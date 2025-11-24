import React, { useState, useEffect } from 'react';
import {
  Navigation, Package, DollarSign, Clock, CheckCircle, Phone, 
  X, LogOut, RefreshCw, MapPin, Store, User, Eye, Map, Wifi, WifiOff,
  Truck, Home, MessageCircle, AlertCircle, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [riderStatus, setRiderStatus] = useState('online'); // online, offline
  const [currentLocation, setCurrentLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);

  const token = localStorage.getItem('token');

  // Get rider's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          console.log('📍 Rider location:', { lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Toggle rider status
  const toggleRiderStatus = async () => {
    const newStatus = riderStatus === 'online' ? 'offline' : 'online';
    
    try {
      // Update rider status in backend
      const res = await fetch(`${API_URL}/riders/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setRiderStatus(newStatus);
        if (newStatus === 'online') {
          getCurrentLocation();
          alert('✅ You are now ONLINE and ready to accept orders');
        } else {
          alert('🔴 You are now OFFLINE');
        }
      }
    } catch (error) {
      console.error('Error updating rider status:', error);
      // Still update UI even if backend fails
      setRiderStatus(newStatus);
    }
  };

  // Fetch available orders
  const fetchAvailable = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/rider/available`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      const data = await res.json();
      console.log('📦 Available orders:', data);
      if (data.success) setAvailable(data.orders || []);
    } catch (error) {
      console.error('Error fetching available orders:', error);
      setAvailable([]);
    }
  };

  // Fetch my deliveries
  const fetchMyDeliveries = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/rider/my-deliveries`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      const data = await res.json();
      console.log('🚚 My deliveries:', data);
      if (data.success) setMyDeliveries(data.orders || []);
    } catch (error) {
      console.error('Error fetching my deliveries:', error);
      setMyDeliveries([]);
    }
  };

  const acceptOrder = async (orderId) => {
    if (riderStatus === 'offline') {
      alert('❌ Please go online to accept orders');
      return;
    }

    const riderId = user?._id;
    if (!riderId) { alert('❌ Rider ID not found'); return; }
  
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ riderId })
      });
  
      const data = await res.json();
      if (res.ok && data.success) {
        alert('✅ Order assigned to you!');
        await fetchAvailable();
        await fetchMyDeliveries();
      } else {
        alert(`❌ Failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Network error');
    }
  };

  // Update delivery status
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

  // Load data
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

  // Load on mount
  useEffect(() => {
    if (user && user.role === 'rider') {
      getCurrentLocation();
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

  // Get customer location coordinates (simulated - in real app, get from order data)
  const getCustomerLocation = (order) => {
    // This would typically come from the order data
    // For demo, using random coordinates near Puerto Princesa
    return {
      lat: 9.7392 + (Math.random() - 0.5) * 0.1,
      lng: 118.7353 + (Math.random() - 0.5) * 0.1
    };
  };

  // Show order details with map
  const showOrderWithMap = (order) => {
    setSelectedOrder(order);
    const customerLoc = getCustomerLocation(order);
    setCustomerLocation(customerLoc);
    setShowOrderDetails(true);
    setShowMap(true);
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

  // Map Component
  const OrderMap = ({ order, currentLocation, customerLocation }) => {
    if (!currentLocation || !customerLocation) {
      return (
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Map className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-500">Loading map...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-64 bg-gray-100 rounded-lg overflow-hidden relative">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.lng - 0.02}%2C${currentLocation.lat - 0.02}%2C${currentLocation.lng + 0.02}%2C${currentLocation.lat + 0.02}&layer=mapnik&marker=${currentLocation.lat}%2C${currentLocation.lng}&marker=${customerLocation.lat}%2C${customerLocation.lng}`}
          style={{ border: 0 }}
          title="Delivery Route Map"
        />
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-3 py-1 rounded text-sm shadow">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>You</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span>Customer</span>
          </div>
        </div>
        
        <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            © OpenStreetMap
          </a>
        </div>
      </div>
    );
  };

  // Order Details Modal
  const OrderDetailsModal = ({ order, onClose, showMap }) => {
    if (!order) return null;

    const customerLoc = customerLocation || getCustomerLocation(order);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Order Details - #{order.orderId || order._id}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="mr-2" size={18} />
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {order.user?.name || 'Customer'}</p>
                    <p><strong>Phone:</strong> {order.user?.phone || 'Not provided'}</p>
                    <p><strong>Address:</strong> {order.deliveryAddress || 'No address provided'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Store className="mr-2" size={18} />
                    Restaurant Information
                  </h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {order.restaurant?.name || 'Unknown Restaurant'}</p>
                    <p><strong>Address:</strong> {order.restaurant?.address || 'No address'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="mr-2" size={18} />
                    Order Information
                  </h3>
                  <div className="space-y-2">
                    <p><strong>Order ID:</strong> {order.orderId || order._id}</p>
                    <p><strong>Order Date:</strong> {formatDate(order.createdAt)}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                        order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {order.status}
                      </span>
                    </p>
                    <p><strong>Total Amount:</strong> {formatCurrency(order.total || order.totalAmount)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="mr-2" size={18} />
                    Payment Information
                  </h3>
                  <div className="space-y-2">
                    <p><strong>Payment Method:</strong> {order.paymentMethod || 'Cash on Delivery'}</p>
                    <p><strong>Delivery Fee:</strong> {formatCurrency(order.deliveryFee || 35)}</p>
                    {order.specialInstructions && (
                      <p><strong>Instructions:</strong> {order.specialInstructions}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {order.items?.length > 0 ? (
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{item.productName || item.product?.name || `Item ${index + 1}`}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No items information available</p>
                )}
              </div>
            </div>

            {/* Map Section */}
            {showMap && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Map className="mr-2" size={18} />
                  Delivery Route
                </h3>
                <OrderMap 
                  order={order} 
                  currentLocation={currentLocation} 
                  customerLocation={customerLoc}
                />
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="text-blue-600" size={16} />
                    <span>Your Location: {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Unknown'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Home className="text-red-600" size={16} />
                    <span>Customer Location: {customerLoc ? `${customerLoc.lat.toFixed(4)}, ${customerLoc.lng.toFixed(4)}` : 'Unknown'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              {order.user?.phone && (
                <a 
                  href={`tel:${order.user.phone}`}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Phone size={16} />
                  <span>Call Customer</span>
                </a>
              )}
              {order.user?.phone && (
                <a 
                  href={`sms:${order.user.phone}`}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <MessageCircle size={16} />
                  <span>Send SMS</span>
                </a>
              )}
              <button 
                onClick={() => setShowMap(!showMap)}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                <Map size={16} />
                <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
              </button>
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
              {/* Online/Offline Toggle */}
              <button 
                onClick={toggleRiderStatus}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                  riderStatus === 'online' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {riderStatus === 'online' ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span>{riderStatus === 'online' ? 'Online' : 'Offline'}</span>
              </button>

              <button 
                onClick={getCurrentLocation}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <MapPin size={16} />
                <span>Update Location</span>
              </button>

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

        {/* Status Alert */}
        {riderStatus === 'offline' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="text-yellow-600 mr-3" size={20} />
              <div>
                <p className="text-yellow-800 font-medium">You are currently offline</p>
                <p className="text-yellow-700 text-sm">Go online to receive and accept delivery orders.</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Location Display */}
        {currentLocation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="text-blue-600" size={20} />
                <div>
                  <p className="text-blue-800 font-medium">Your Current Location</p>
                  <p className="text-blue-700 text-sm">
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                Location Active
              </span>
            </div>
          </div>
        )}

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
                      onClick={() => showOrderWithMap(order)}
                      className="flex items-center space-x-2 text-orange-600 hover:text-orange-700"
                    >
                      <Eye size={16} />
                      <span>View Details & Map</span>
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
                        disabled={riderStatus === 'offline'}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                          riderStatus === 'offline'
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
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
                      onClick={() => showOrderWithMap(order)}
                      className="flex items-center space-x-2 text-orange-600 hover:text-orange-700"
                    >
                      <Eye size={16} />
                      <span>View Details & Map</span>
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

      {/* Order Details Modal */}
      {showOrderDetails && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => {
            setShowOrderDetails(false);
            setShowMap(false);
            setSelectedOrder(null);
          }} 
          showMap={showMap}
        />
      )}
    </div>
  );
};

export default RiderDashboard;