import React, { useState, useEffect } from 'react';
import {
  Navigation, Package, DollarSign, Clock, CheckCircle, Phone, 
  X, LogOut, RefreshCw, MapPin, Store, User, Eye, Map, Wifi, WifiOff,
  Truck, Home, MessageCircle, AlertCircle, ChevronRight, Menu, MoreVertical,
  CreditCard, TrendingUp, Wallet, Shield, Bell, ArrowUpRight, 
  Circle, Play, Flag, Star, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ✅ CRITICAL FIX: Use environment variable, not hardcoded localhost
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
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
  const [notifications, setNotifications] = useState([]);

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
            case error.PERMISSION_DENIED: 
              errorMessage = 'Location permission denied'; 
              break;
            case error.POSITION_UNAVAILABLE: 
              errorMessage = 'Location unavailable'; 
              break;
            case error.TIMEOUT: 
              errorMessage = 'Location timeout'; 
              break;
            default: // ✅ ADDED DEFAULT CASE
              errorMessage = 'Unknown location error';
              break;
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

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const styles = {
      online: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      offline: 'bg-slate-100 text-slate-600 border-slate-200',
      assigned: 'bg-amber-100 text-amber-700 border-amber-200',
      out_for_delivery: 'bg-blue-100 text-blue-700 border-blue-200',
      delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      ready: 'bg-rose-100 text-rose-700 border-rose-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200'
    };
    
    const labels = {
      online: 'Online',
      offline: 'Offline',
      assigned: 'Assigned',
      out_for_delivery: 'On Delivery',
      delivered: 'Delivered',
      ready: 'Ready',
      pending: 'Pending'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.offline}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Order Card Component
  const OrderCard = ({ order, type }) => {
    const isAvailable = type === 'available';
    
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">#{order.orderId || order._id?.slice(-6)}</h3>
                <p className="text-xs text-slate-500 font-medium">{formatDate(order.createdAt)}</p>
              </div>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                <Store className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{order.restaurant?.name || 'Restaurant'}</p>
                <p className="text-xs text-slate-400 line-clamp-1">{order.restaurant?.address || 'Pickup location'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{order.user?.name || 'Customer'}</p>
                <p className="text-xs text-slate-400 line-clamp-1">{order.deliveryAddress || 'Delivery address'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400 mb-1">Earnings</p>
              <p className="text-xl font-bold text-rose-600">{formatCurrency(order.deliveryFee || 35)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Order Total</p>
              <p className="text-lg font-bold text-slate-700">{formatCurrency(order.total || order.totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
          <button 
            onClick={() => showOrderWithMap(order)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          
          {order.user?.phone && (
            <a 
              href={`tel:${order.user.phone}`}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm hover:bg-blue-100 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
          
          {isAvailable ? (
            <button 
              onClick={() => acceptOrder(order._id)}
              disabled={riderStatus === 'offline'}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                riderStatus === 'offline' 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-200 hover:shadow-xl hover:scale-[1.02]'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Accept
            </button>
          ) : (
            <>
              {order.status === 'assigned' && (
                <button 
                  onClick={() => updateStatus(order._id, 'out_for_delivery')}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-200 hover:shadow-xl transition-all"
                >
                  <Play className="w-4 h-4" />
                  Start
                </button>
              )}
              {order.status === 'out_for_delivery' && (
                <button 
                  onClick={() => updateStatus(order._id, 'delivered')}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
                >
                  <Flag className="w-4 h-4" />
                  Deliver
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Earnings Card Component
  const EarningsCard = ({ title, amount, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{formatCurrency(amount)}</p>
    </div>
  );

  // Map Component
  const OrderMap = ({ order, currentLocation, customerLocation }) => {
    if (!currentLocation || !customerLocation) {
      return (
        <div className="h-64 bg-slate-100 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <Map className="text-slate-400 w-8 h-8" />
            </div>
            <p className="text-slate-500 font-medium">Loading map...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-64 bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.lng - 0.02}%2C${currentLocation.lat - 0.02}%2C${currentLocation.lng + 0.02}%2C${currentLocation.lat + 0.02}&layer=mapnik&marker=${currentLocation.lat}%2C${currentLocation.lng}&marker=${customerLocation.lat}%2C${customerLocation.lng}`}
          title="Delivery Route"
          className="grayscale-[20%]"
        />
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-slate-700">You</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
            <span className="text-sm font-semibold text-slate-700">Customer</span>
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-300">
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Order Details</h2>
              <p className="text-sm text-slate-500">#{order.orderId || order._id}</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{order.user?.name || 'Customer'}</p>
                  <p className="text-sm text-slate-500">{order.user?.phone || 'No phone'}</p>
                </div>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="grid gap-4">
              <div className="p-4 border border-slate-100 rounded-2xl">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Store className="w-5 h-5 text-rose-500" />
                  Restaurant
                </h3>
                <p className="font-semibold text-slate-700">{order.restaurant?.name || 'Unknown'}</p>
                <p className="text-sm text-slate-500 mt-1">{order.restaurant?.address || 'No address'}</p>
              </div>

              <div className="p-4 border border-slate-100 rounded-2xl">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  Delivery Address
                </h3>
                <p className="text-slate-700">{order.deliveryAddress || 'No address provided'}</p>
              </div>
            </div>

            {order.items?.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-rose-500" />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center">
                          {item.quantity}
                        </span>
                        <span className="font-medium text-slate-700">{item.productName || item.product?.name}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-2xl border border-rose-100">
              <span className="font-bold text-slate-800">Total Amount</span>
              <span className="text-2xl font-bold text-rose-600">{formatCurrency(order.total || order.totalAmount)}</span>
            </div>

            {showMap && (
              <div>
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-rose-500" />
                  Route Map
                </h3>
                <OrderMap order={order} currentLocation={currentLocation} customerLocation={customerLoc} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              {order.user?.phone && (
                <>
                  <a 
                    href={`tel:${order.user.phone}`} 
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
                  >
                    <Phone className="w-5 h-5" />
                    Call Customer
                  </a>
                  <a 
                    href={`sms:${order.user.phone}`} 
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Message
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Navigation Item
  const NavItem = ({ id, icon: Icon, label, badge }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 ${
        activeTab === id 
          ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-semibold text-sm">{label}</span>
      {badge > 0 && (
        <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${
          activeTab === id ? 'bg-white text-rose-500' : 'bg-rose-500 text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-3xl shadow-lg">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Not Logged In</h2>
          <p className="text-slate-500">Please login to continue.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'rider') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-3xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500">Riders only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 fixed h-full">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
              <Navigation className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg">Rider Pro</h1>
              <p className="text-xs text-slate-500">Delivery Partner</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem id="home" icon={Home} label="Dashboard" />
          <NavItem id="available" icon={Package} label="Available Orders" badge={available.length} />
          <NavItem id="my-deliveries" icon={Truck} label="My Deliveries" badge={myDeliveries.length} />
          <NavItem id="earnings" icon={Wallet} label="Earnings" />
          
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={toggleRiderStatus}
              className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
                riderStatus === 'online' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${riderStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="font-semibold text-sm flex-1 text-left">
                {riderStatus === 'online' ? 'Online' : 'Offline'}
              </span>
              <span className="text-xs font-medium opacity-75">
                {riderStatus === 'online' ? 'Accepting' : 'Tap to go'}
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0) || 'R'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-semibold text-sm"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center">
                <Navigation className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">Rider Pro</h1>
                <p className="text-xs text-slate-500">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleRiderStatus}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  riderStatus === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {riderStatus === 'online' ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg p-4 space-y-2">
              <button onClick={() => { setActiveTab('home'); setShowMobileMenu(false); }} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 font-medium">Dashboard</button>
              <button onClick={() => { setActiveTab('available'); setShowMobileMenu(false); }} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 font-medium">Available Orders ({available.length})</button>
              <button onClick={() => { setActiveTab('my-deliveries'); setShowMobileMenu(false); }} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 font-medium">My Deliveries ({myDeliveries.length})</button>
              <button onClick={() => { setActiveTab('earnings'); setShowMobileMenu(false); }} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 font-medium">Earnings</button>
              <button onClick={loadData} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 font-medium flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
              <button onClick={logout} className="w-full text-left p-3 rounded-xl hover:bg-red-50 text-red-600 font-medium flex items-center gap-2"><LogOut className="w-4 h-4" /> Logout</button>
            </div>
          )}
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Debug Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs font-mono text-amber-800">
            DEBUG: Status={riderStatus} | Available={available.length} | MyDeliveries={myDeliveries.length} | API={API_URL}
          </div>

          {locationError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
              <span className="text-red-800 text-sm font-medium">{locationError}</span>
            </div>
          )}

          {/* Home/Dashboard Tab */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                  <p className="text-slate-500">Welcome back, {user.name?.split(' ')[0]}</p>
                </div>
                <button 
                  onClick={loadData}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Status Card */}
              <div className={`rounded-2xl p-6 text-white relative overflow-hidden ${
                riderStatus === 'online' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                  : 'bg-gradient-to-r from-slate-700 to-slate-800'
              }`}>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${riderStatus === 'online' ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                      <span className="font-semibold opacity-90">
                        {riderStatus === 'online' ? 'You are Online' : 'You are Offline'}
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1">
                      {riderStatus === 'online' ? 'Receiving Orders' : 'Go Online to Start'}
                    </h3>
                    <p className="opacity-80 text-sm">
                      {riderStatus === 'online' 
                        ? `${available.length} orders available nearby` 
                        : 'Tap the button to start accepting deliveries'}
                    </p>
                  </div>
                  <button 
                    onClick={toggleRiderStatus}
                    className={`px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105 ${
                      riderStatus === 'online' 
                        ? 'bg-white text-emerald-600' 
                        : 'bg-rose-500 text-white hover:bg-rose-600'
                    }`}
                  >
                    {riderStatus === 'online' ? 'Go Offline' : 'Go Online'}
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center mb-3">
                    <Package className="w-5 h-5 text-rose-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats.availableOrders}</p>
                  <p className="text-sm text-slate-500 font-medium">Available</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats.myDeliveries}</p>
                  <p className="text-sm text-slate-500 font-medium">Active</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats.pendingDeliveries}</p>
                  <p className="text-sm text-slate-500 font-medium">In Progress</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats.completedDeliveries}</p>
                  <p className="text-sm text-slate-500 font-medium">Completed</p>
                </div>
              </div>

              {/* Earnings Preview */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800 text-lg">Earnings Overview</h3>
                  <button 
                    onClick={() => setActiveTab('earnings')}
                    className="text-rose-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50">
                    <p className="text-sm text-slate-500 mb-1">Today</p>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(earnings.today)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50">
                    <p className="text-sm text-slate-500 mb-1">This Week</p>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(earnings.weekly)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white">
                    <p className="text-sm text-rose-100 mb-1">Total Earnings</p>
                    <p className="text-2xl font-bold">{formatCurrency(earnings.total)}</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {myDeliveries.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-4">Recent Deliveries</h3>
                  <div className="space-y-3">
                    {myDeliveries.slice(0, 3).map(order => (
                      <OrderCard key={order._id} order={order} type="delivery" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Available Orders Tab */}
          {activeTab === 'available' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Available Orders</h2>
                  <p className="text-slate-500">{available.length} orders waiting nearby</p>
                </div>
                {riderStatus === 'offline' && (
                  <button 
                    onClick={toggleRiderStatus}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-200"
                  >
                    Go Online
                  </button>
                )}
              </div>

              {available.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg mb-2">No Orders Available</h3>
                  <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                    {riderStatus === 'offline' 
                      ? 'Go online to start receiving delivery requests in your area' 
                      : 'Hang tight! New orders will appear here soon'}
                  </p>
                  {riderStatus === 'offline' ? (
                    <button 
                      onClick={toggleRiderStatus}
                      className="px-6 py-3 rounded-xl bg-rose-500 text-white font-semibold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors"
                    >
                      Go Online Now
                    </button>
                  ) : (
                    <button 
                      onClick={fetchAvailable}
                      className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {available.map(order => (
                    <OrderCard key={order._id} order={order} type="available" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Deliveries Tab */}
          {activeTab === 'my-deliveries' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">My Deliveries</h2>
                <p className="text-slate-500">Track your active and completed orders</p>
              </div>

              {myDeliveries.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg mb-2">No Active Deliveries</h3>
                  <p className="text-slate-500 mb-6">Accept an order to start delivering</p>
                  <button 
                    onClick={() => setActiveTab('available')}
                    className="px-6 py-3 rounded-xl bg-rose-500 text-white font-semibold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors"
                  >
                    Find Orders
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myDeliveries.map(order => (
                    <OrderCard key={order._id} order={order} type="delivery" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Earnings</h2>
                <p className="text-slate-500">Track your income and performance</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <EarningsCard 
                  title="Today's Earnings" 
                  amount={earnings.today} 
                  icon={DollarSign} 
                  color="bg-rose-500"
                  trend="+12%"
                />
                <EarningsCard 
                  title="This Week" 
                  amount={earnings.weekly} 
                  icon={Calendar} 
                  color="bg-blue-500"
                />
                <EarningsCard 
                  title="This Month" 
                  amount={earnings.monthly} 
                  icon={TrendingUp} 
                  color="bg-purple-500"
                  trend="+8%"
                />
                <EarningsCard 
                  title="Total Earnings" 
                  amount={earnings.total} 
                  icon={Wallet} 
                  color="bg-emerald-500"
                />
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg mb-6">Performance Overview</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 rounded-2xl bg-slate-50">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-rose-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-800 mb-1">{earnings.completedDeliveries}</p>
                    <p className="text-sm text-slate-500 font-medium">Completed Deliveries</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-slate-50">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="w-8 h-8 text-amber-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-800 mb-1">4.9</p>
                    <p className="text-sm text-slate-500 font-medium">Rating</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-slate-50">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-800 mb-1">98%</p>
                    <p className="text-sm text-slate-500 font-medium">Acceptance Rate</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

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

// Missing import for Calendar
const Calendar = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export default RiderDashboard;