import React, { useState, useEffect } from 'react';
import {
  Navigation, Package, DollarSign, Clock, CheckCircle, Phone, 
  X, LogOut, RefreshCw, MapPin, Store, User, Eye, Map, Wifi, WifiOff,
  Truck, Home, MessageCircle, AlertCircle, ChevronRight, Menu, MoreVertical,
  CreditCard, TrendingUp, Wallet, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ✅ CRITICAL FIX: Use environment variable, not hardcoded localhost
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [riderStatus, setRiderStatus] = useState('offline');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [earnings, setEarnings] = useState({
    today: 0,
    weekly: 0,
    monthly: 0,
    total: 0,
    completedDeliveries: 0
  });
  const [locationError, setLocationError] = useState(null);

  // ✅ FIXED: Get token helper with logging
  const getToken = () => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token check:', token ? 'Present' : 'MISSING!');
    return token;
  };

  // Fetch rider profile and status
  const fetchRiderProfile = async () => {
    const token = getToken();
    if (!token) return;

    try {
      console.log('🔄 Fetching rider profile...');
      const res = await fetch(`${API_URL}/riders/profile`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      console.log('📡 Rider profile status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('📡 Rider profile data:', data);
        if (data.success && data.rider) {
          setRiderStatus(data.rider.status || 'offline');
          console.log('✅ Rider status:', data.rider.status);
        }
      } else {
        const errText = await res.text();
        console.error('❌ Rider profile error:', res.status, errText);
      }
    } catch (error) {
      console.error('❌ Error fetching rider profile:', error);
      const savedStatus = localStorage.getItem('riderStatus');
      if (savedStatus) setRiderStatus(savedStatus);
    }
  };

  // Get rider's current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation not supported';
        setLocationError(error);
        reject(new Error(error));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setCurrentLocation(location);
          setLocationError(null);
          console.log('📍 Location:', location);
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Location error';
          switch (error.code) {
            case error.PERMISSION_DENIED: errorMessage = 'Location permission denied'; break;
            case error.POSITION_UNAVAILABLE: errorMessage = 'Location unavailable'; break;
            case error.TIMEOUT: errorMessage = 'Location timeout'; break;
          }
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  // Update rider location to backend
  const updateRiderLocation = async (location) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/riders/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng
        })
      });

      if (res.ok) {
        console.log('📍 Location updated on server');
      } else {
        console.error('❌ Failed to update location:', res.status);
      }
    } catch (error) {
      console.error('❌ Error updating location:', error);
    }
  };

  // Toggle rider status
  const toggleRiderStatus = async () => {
    const newStatus = riderStatus === 'online' ? 'offline' : 'online';
    const token = getToken();
    
    console.log(`🔄 Changing status: ${riderStatus} → ${newStatus}`);
    
    try {
      if (newStatus === 'online') {
        try {
          const location = await getCurrentLocation();
          await updateRiderLocation(location);
        } catch (locErr) {
          const proceed = window.confirm('Location failed. Continue going online?');
          if (!proceed) return;
        }
      }

      const res = await fetch(`${API_URL}/riders/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      console.log('📡 Status update response:', data);

      if (res.ok && data.success) {
        setRiderStatus(newStatus);
        localStorage.setItem('riderStatus', newStatus);
        
        if (newStatus === 'online') {
          alert('✅ You are ONLINE');
          await fetchAvailable();
        } else {
          alert('🔴 You are OFFLINE');
          setAvailable([]);
        }
        
        await loadData();
      } else {
        throw new Error(data.message || 'Status update failed');
      }
    } catch (error) {
      console.error('❌ Status update error:', error);
      // Fallback
      setRiderStatus(newStatus);
      localStorage.setItem('riderStatus', newStatus);
      alert(`Status: ${newStatus} (offline mode)`);
    }
    
    setShowMobileMenu(false);
  };

  // ✅ FIXED: Fetch available orders with better logging
  const fetchAvailable = async () => {
    const token = getToken();
    if (!token) {
      console.error('❌ No token for fetchAvailable');
      return;
    }

    console.log('📦 Fetching available orders...');
    console.log('🔗 URL:', `${API_URL}/orders/rider/available`);

    try {
      const res = await fetch(`${API_URL}/orders/rider/available`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      console.log('📡 Available orders status:', res.status);
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('❌ Invalid JSON:', text.substring(0, 200));
        setAvailable([]);
        return;
      }
      
      console.log('📡 Available orders data:', data);
      
      if (res.ok && data.success) {
        setAvailable(data.orders || []);
        console.log('✅ Available orders loaded:', data.orders?.length || 0);
      } else {
        console.error('❌ Failed to load available orders:', data.message);
        setAvailable([]);
      }
    } catch (error) {
      console.error('❌ Error fetching available orders:', error);
      setAvailable([]);
    }
  };

  // ✅ FIXED: Fetch my deliveries with better logging
  const fetchMyDeliveries = async () => {
    const token = getToken();
    if (!token) {
      console.error('❌ No token for fetchMyDeliveries');
      return;
    }

    console.log('🚚 Fetching my deliveries...');

    try {
      const res = await fetch(`${API_URL}/orders/rider/my-deliveries`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      console.log('📡 My deliveries status:', res.status);
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('❌ Invalid JSON:', text.substring(0, 200));
        setMyDeliveries([]);
        return;
      }
      
      console.log('📡 My deliveries data:', data);
      
      if (res.ok && data.success) {
        setMyDeliveries(data.orders || []);
        console.log('✅ My deliveries loaded:', data.orders?.length || 0);
      } else {
        console.error('❌ Failed to load deliveries:', data.message);
        setMyDeliveries([]);
      }
    } catch (error) {
      console.error('❌ Error fetching my deliveries:', error);
      setMyDeliveries([]);
    }
  };

  // Fetch earnings
  const fetchEarnings = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/riders/earnings`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.earnings) {
          setEarnings(data.earnings);
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error fetching earnings:', error);
    }
    
    // Fallback calculation
    calculateEarnings();
  };

  // Calculate earnings locally
  const calculateEarnings = () => {
    const completedOrders = myDeliveries.filter(order => 
      order.status === 'delivered' || order.status === 'completed'
    );
    
    const deliveryFee = 35;
    const now = new Date();
    
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEarnings = completedOrders.filter(order => {
      const orderDate = new Date(order.updatedAt || order.deliveredAt || order.createdAt);
      return orderDate >= todayStart;
    }).length * deliveryFee;

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyEarnings = completedOrders.filter(order => {
      const orderDate = new Date(order.updatedAt || order.deliveredAt || order.createdAt);
      return orderDate >= oneWeekAgo;
    }).length * deliveryFee;

    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const monthlyEarnings = completedOrders.filter(order => {
      const orderDate = new Date(order.updatedAt || order.deliveredAt || order.createdAt);
      return orderDate >= oneMonthAgo;
    }).length * deliveryFee;

    setEarnings({
      today: todayEarnings,
      weekly: weeklyEarnings,
      monthly: monthlyEarnings,
      total: completedOrders.length * deliveryFee,
      completedDeliveries: completedOrders.length
    });
  };

  // ✅ FIXED: Accept order with better logging
  const acceptOrder = async (orderId) => {
    const token = getToken();
    if (!token) {
      alert('❌ Not authenticated');
      return;
    }

    if (riderStatus === 'offline') {
      alert('❌ Go online first!');
      return;
    }

    console.log('✅ Accepting order:', orderId);

    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ riderId: user._id })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('❌ Invalid JSON:', text);
        alert('❌ Server error');
        return;
      }

      console.log('📡 Accept response:', data);

      if (res.ok && data.success) {
        alert('✅ Order assigned to you!');
        await loadData();
      } else {
        alert(`❌ Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Accept error:', err);
      alert('❌ Network error');
    }
  };

  // Update delivery status
  const updateStatus = async (orderId, status) => {
    const token = getToken();
    if (!token) return;

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
        alert(`✅ Status: ${status}`);
        await loadData();
      } else {
        alert(`❌ Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Update status error:', error);
      alert('❌ Failed to update status');
    }
  };

  // ✅ FIXED: Load all data with sequential loading
  const loadData = async () => {
    setLoading(true);
    console.log('🚀 Loading all rider data...');
    
    try {
      await fetchRiderProfile();
      await fetchAvailable();
      await fetchMyDeliveries();
      await fetchEarnings();
      console.log('✅ All data loaded');
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'rider') {
      console.log('🔥 RiderDashboard mounted, user:', user._id);
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (riderStatus === 'online') {
      fetchAvailable();
    } else {
      setAvailable([]);
    }
  }, [riderStatus]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₱0';
    return `₱${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getCustomerLocation = (order) => {
    return {
      lat: 9.7392 + (Math.random() - 0.5) * 0.1,
      lng: 118.7353 + (Math.random() - 0.5) * 0.1
    };
  };

  const showOrderWithMap = (order) => {
    setSelectedOrder(order);
    const customerLoc = getCustomerLocation(order);
    setCustomerLocation(customerLoc);
    setShowOrderDetails(true);
    setShowMap(true);
  };

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
        <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Map className="mx-auto text-gray-400 mb-2 w-8 h-8" />
            <p className="text-gray-500 text-sm">Loading map...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-48 bg-gray-100 rounded-lg overflow-hidden relative">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.lng - 0.02}%2C${currentLocation.lat - 0.02}%2C${currentLocation.lng + 0.02}%2C${currentLocation.lat + 0.02}&layer=mapnik&marker=${currentLocation.lat}%2C${currentLocation.lng}&marker=${customerLocation.lat}%2C${customerLocation.lng}`}
          title="Delivery Route"
        />
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs">
          <div className="flex items-center space-x-1 mb-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span>You</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <span>Customer</span>
          </div>
        </div>
      </div>
    );
  };

  // Order Details Modal
  const OrderDetailsModal = ({ order, onClose, showMap }) => {
    if (!order) return null;
    const customerLoc = customerLocation || getCustomerLocation(order);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b sticky top-0 bg-white flex justify-between items-center">
            <h2 className="text-lg font-bold">Order #{order.orderId || order._id}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center"><User className="mr-2 w-4 h-4" /> Customer</h3>
              <p><strong>Name:</strong> {order.user?.name || 'Customer'}</p>
              <p><strong>Phone:</strong> {order.user?.phone || 'Not provided'}</p>
              <p><strong>Address:</strong> {order.deliveryAddress || 'No address'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center"><Store className="mr-2 w-4 h-4" /> Restaurant</h3>
              <p><strong>Name:</strong> {order.restaurant?.name || 'Unknown'}</p>
              <p><strong>Address:</strong> {order.restaurant?.address || 'No address'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center"><Package className="mr-2 w-4 h-4" /> Order Info</h3>
              <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{order.status}</span></p>
              <p><strong>Total:</strong> <span className="text-green-600 font-bold">{formatCurrency(order.total || order.totalAmount)}</span></p>
            </div>

            {order.items?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.quantity}x {item.productName || item.product?.name}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showMap && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center"><Map className="mr-2 w-4 h-4" /> Map</h3>
                <OrderMap order={order} currentLocation={currentLocation} customerLocation={customerLoc} />
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {order.user?.phone && (
                <>
                  <a href={`tel:${order.user.phone}`} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm flex items-center justify-center">
                    <Phone className="w-4 h-4 mr-2" /> Call
                  </a>
                  <a href={`sms:${order.user.phone}`} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-center text-sm flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 mr-2" /> SMS
                  </a>
                </>
              )}
              <button onClick={() => setShowMap(!showMap)} className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center">
                <Map className="w-4 h-4 mr-2" /> {showMap ? 'Hide' : 'Show'} Map
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Not Logged In</h2>
          <p className="text-gray-600">Please login to continue.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'rider') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto text-red-600 w-16 h-16 mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Riders only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Navigation className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Rider Dashboard</h1>
                <p className="text-sm text-gray-500">{user.name}</p>
                <p className="text-xs text-gray-400">
                  {riderStatus === 'online' ? '🟢 Online' : '🔴 Offline'} • {stats.availableOrders} available
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button onClick={toggleRiderStatus} className={`p-2 rounded-lg ${riderStatus === 'online' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}`}>
                {riderStatus === 'online' ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </button>
              
              <div className="relative">
                <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {showMobileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                    <button onClick={toggleRiderStatus} className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-gray-50">
                      {riderStatus === 'online' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                      <span>{riderStatus === 'online' ? 'Go Offline' : 'Go Online'}</span>
                    </button>
                    <button onClick={getCurrentLocation} className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-gray-50">
                      <MapPin className="w-4 h-4" /> <span>Update Location</span>
                    </button>
                    <button onClick={loadData} className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-gray-50">
                      <RefreshCw className="w-4 h-4" /> <span>Refresh</span>
                    </button>
                    <button onClick={logout} className="w-full px-4 py-2 text-left flex items-center space-x-2 text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4" /> <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        {/* Debug Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-4 text-xs font-mono">
          DEBUG: Status={riderStatus} | Available={available.length} | MyDeliveries={myDeliveries.length} | API={API_URL}
        </div>

        {locationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center">
            <AlertCircle className="text-red-600 mr-2 w-5 h-5" />
            <span className="text-red-800 text-sm">{locationError}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-600">Available</p>
            <p className="text-xl font-bold">{stats.availableOrders}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-600">My Deliveries</p>
            <p className="text-xl font-bold">{stats.myDeliveries}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-600">In Progress</p>
            <p className="text-xl font-bold text-orange-600">{stats.pendingDeliveries}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-600">Completed</p>
            <p className="text-xl font-bold text-green-600">{stats.completedDeliveries}</p>
          </div>
        </div>

        {/* Earnings */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 mb-4 text-white">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Earnings</h3>
            <span className="text-2xl font-bold">{formatCurrency(earnings.total)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div><p className="font-bold">{formatCurrency(earnings.today)}</p><p className="text-green-100 text-xs">Today</p></div>
            <div><p className="font-bold">{formatCurrency(earnings.weekly)}</p><p className="text-green-100 text-xs">Week</p></div>
            <div><p className="font-bold">{formatCurrency(earnings.monthly)}</p><p className="text-green-100 text-xs">Month</p></div>
          </div>
        </div>

        {riderStatus === 'offline' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center">
            <AlertCircle className="text-yellow-600 mr-2 w-5 h-5" />
            <span className="text-yellow-800 text-sm">You are offline. Go online to receive orders.</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 mb-4 overflow-x-auto">
          {['available', 'my-deliveries', 'earnings'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${activeTab === tab ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              {tab === 'available' && `Available (${available.length})`}
              {tab === 'my-deliveries' && `My Deliveries (${myDeliveries.length})`}
              {tab === 'earnings' && 'Earnings'}
            </button>
          ))}
        </div>

        {/* Available Orders */}
        {activeTab === 'available' && (
          <div className="space-y-3">
            {available.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Package className="mx-auto text-gray-300 w-12 h-12 mb-4" />
                <p className="text-gray-500">{riderStatus === 'offline' ? 'Go online to see orders' : 'No available orders'}</p>
                {riderStatus === 'offline' ? (
                  <button onClick={toggleRiderStatus} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg">Go Online</button>
                ) : (
                  <button onClick={loadData} className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg">Refresh</button>
                )}
              </div>
            ) : (
              available.map(order => (
                <div key={order._id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">#{order.orderId || order._id}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${order.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{order.status}</span>
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      <p className="text-sm text-gray-600 mt-1">{order.restaurant?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{order.deliveryAddress || 'No address'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(order.total || order.totalAmount)}</p>
                      <p className="text-sm text-green-500">+{formatCurrency(order.deliveryFee || 35)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <button onClick={() => showOrderWithMap(order)} className="flex-1 bg-gray-600 text-white py-2 rounded-lg text-sm flex items-center justify-center">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </button>
                    {order.user?.phone && (
                      <a href={`tel:${order.user.phone}`} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm flex items-center justify-center">
                        <Phone className="w-4 h-4 mr-1" /> Call
                      </a>
                    )}
                    <button 
                      onClick={() => acceptOrder(order._id)}
                      disabled={riderStatus === 'offline'}
                      className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center ${riderStatus === 'offline' ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 text-white'}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* My Deliveries */}
        {activeTab === 'my-deliveries' && (
          <div className="space-y-3">
            {myDeliveries.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Package className="mx-auto text-gray-300 w-12 h-12 mb-4" />
                <p className="text-gray-500">No deliveries assigned</p>
                <button onClick={() => setActiveTab('available')} className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg">View Available</button>
              </div>
            ) : (
              myDeliveries.map(order => (
                <div key={order._id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">#{order.orderId || order._id}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{order.status}</span>
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      <p className="text-sm text-gray-600 mt-1">{order.restaurant?.name || 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(order.total || order.totalAmount)}</p>
                      <p className="text-sm text-green-500">+{formatCurrency(order.deliveryFee || 35)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <button onClick={() => showOrderWithMap(order)} className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </button>
                    {order.user?.phone && (
                      <a href={`tel:${order.user.phone}`} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                        <Phone className="w-4 h-4 mr-1" /> Call
                      </a>
                    )}
                    {order.status === 'assigned' && (
                      <button onClick={() => updateStatus(order._id, 'out_for_delivery')} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                        <Navigation className="w-4 h-4 mr-1" /> Start
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button onClick={() => updateStatus(order._id, 'delivered')} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" /> Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-bold mb-4">Earnings Summary</h3>
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-800 font-semibold">Today</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(earnings.today)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-800 font-semibold">This Week</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(earnings.weekly)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-purple-800 font-semibold">This Month</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(earnings.monthly)}</p>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Earnings</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(earnings.total)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{earnings.completedDeliveries} completed deliveries</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showOrderDetails && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => { setShowOrderDetails(false); setShowMap(false); setSelectedOrder(null); }}
          showMap={showMap}
        />
      )}
    </div>
  );
};

export default RiderDashboard;