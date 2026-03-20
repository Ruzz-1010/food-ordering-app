import React, { useState, useEffect } from 'react';
import {
  Navigation, Package, DollarSign, Clock, CheckCircle, Phone, 
  X, LogOut, RefreshCw, MapPin, Store, User, Eye, Map, Wifi, WifiOff,
  Truck, Home, MessageCircle, AlertCircle, ChevronRight, Menu, MoreVertical,
  CreditCard, TrendingUp, Wallet, Shield, Bell, ArrowUpRight, 
  Circle, Play, Flag, Star, Activity, Award, Gift, Zap, Thermometer,
  Sun, Moon, Battery, BatteryCharging, Compass, Navigation2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    onlineHours: 0,
    distanceCovered: 0,
    avgDeliveryTime: 0,
    rating: 4.9
  });

  const getToken = () => {
    const token = localStorage.getItem('token');
    return token;
  };

  // ✅ FIXED: Fetch rider profile with better error handling
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
      
      const data = await res.json();
      console.log('📡 Rider profile response:', data);
      
      if (res.ok && data.success) {
        setRiderStatus(data.rider.status || 'offline');
        console.log('✅ Rider status set to:', data.rider.status);
      } else {
        console.error('❌ Failed to fetch rider profile:', data.message);
        // Try to get status from localStorage as fallback
        const savedStatus = localStorage.getItem('riderStatus');
        if (savedStatus) {
          setRiderStatus(savedStatus);
          console.log('📦 Using saved status:', savedStatus);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching rider profile:', error);
      const savedStatus = localStorage.getItem('riderStatus');
      if (savedStatus) setRiderStatus(savedStatus);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation not supported');
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setCurrentLocation(location);
          setLocationError(null);
          console.log('📍 Location obtained:', location);
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Location error';
          switch (error.code) {
            case error.PERMISSION_DENIED: 
              errorMessage = 'Location permission denied. Please enable GPS.'; 
              break;
            case error.POSITION_UNAVAILABLE: 
              errorMessage = 'Location unavailable. Check your GPS.'; 
              break;
            case error.TIMEOUT: 
              errorMessage = 'Location timeout. Try again.'; 
              break;
            default:
              errorMessage = 'Unknown location error';
              break;
          }
          setLocationError(errorMessage);
          console.error('❌ Location error:', errorMessage);
          reject(new Error(errorMessage));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  // Update rider location
  const updateRiderLocation = async (location) => {
    const token = getToken();
    if (!token) return;

    try {
      await fetch(`${API_URL}/riders/location`, {
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
      console.log('📍 Location updated on server');
    } catch (error) {
      console.error('❌ Error updating location:', error);
    }
  };

  // ✅ FIXED: Toggle rider status with better error handling
  const toggleRiderStatus = async () => {
    const newStatus = riderStatus === 'online' ? 'offline' : 'online';
    const token = getToken();
    
    if (!token) {
      alert('❌ Please login again');
      logout();
      return;
    }

    console.log(`🔄 Changing status from ${riderStatus} to ${newStatus}`);
    
    try {
      // If going online, try to get location first
      if (newStatus === 'online') {
        try {
          const location = await getCurrentLocation();
          await updateRiderLocation(location);
        } catch (locErr) {
          // Continue even if location fails, but warn user
          console.warn('⚠️ Location failed, but continuing...');
          if (!window.confirm('Unable to get your location. Continue going online?')) {
            return;
          }
        }
      }

      // Update status on server
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
        
        // Add notification
        const notificationMsg = newStatus === 'online' 
          ? '✅ You are now online and ready to accept deliveries!' 
          : '🔴 You are now offline';
        
        setNotifications(prev => [{
          id: Date.now(),
          message: notificationMsg,
          time: new Date().toISOString(),
          type: 'success'
        }, ...prev]);
        
        // Refresh data
        if (newStatus === 'online') {
          await fetchAvailable();
        } else {
          setAvailable([]);
        }
        
        await loadData();
      } else {
        // If server update fails, still update UI but warn user
        console.error('❌ Server status update failed:', data.message);
        setRiderStatus(newStatus);
        localStorage.setItem('riderStatus', newStatus);
        alert(`⚠️ Status changed to ${newStatus} (offline mode)`);
      }
    } catch (error) {
      console.error('❌ Status update error:', error);
      // Fallback - update UI anyway
      setRiderStatus(newStatus);
      localStorage.setItem('riderStatus', newStatus);
      alert(`⚠️ Status changed to ${newStatus} (offline mode)`);
    }
    
    setShowMobileMenu(false);
  };

  // Fetch available orders
  const fetchAvailable = async () => {
    const token = getToken();
    if (!token) return;

    try {
      console.log('📦 Fetching available orders...');
      const res = await fetch(`${API_URL}/orders/rider/available`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      const data = await res.json();
      console.log('📡 Available orders:', data);
      
      if (res.ok && data.success) {
        setAvailable(data.orders || []);
      } else {
        console.error('❌ Failed to fetch available orders:', data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching available orders:', error);
    }
  };

  // Fetch my deliveries
  const fetchMyDeliveries = async () => {
    const token = getToken();
    if (!token) return;

    try {
      console.log('🚚 Fetching my deliveries...');
      const res = await fetch(`${API_URL}/orders/rider/my-deliveries`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      const data = await res.json();
      console.log('📡 My deliveries:', data);
      
      if (res.ok && data.success) {
        setMyDeliveries(data.orders || []);
      } else {
        console.error('❌ Failed to fetch my deliveries:', data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching my deliveries:', error);
    }
  };

  // ✅ FIXED: Fetch earnings from backend first, then calculate locally
  const fetchEarnings = async () => {
    const token = getToken();
    if (!token) return;

    try {
      console.log('💰 Fetching earnings...');
      const res = await fetch(`${API_URL}/riders/earnings`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('📡 Earnings data:', data);
        if (data.success && data.earnings) {
          setEarnings(data.earnings);
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error fetching earnings:', error);
    }
    
    // Fallback: calculate from deliveries
    console.log('📊 Calculating earnings from deliveries...');
    calculateEarningsFromDeliveries();
  };

  // ✅ FIXED: Calculate earnings from deliveries with proper fee
  const calculateEarningsFromDeliveries = () => {
    // Get completed deliveries
    const completedOrders = myDeliveries.filter(order => 
      order.status === 'delivered' || order.status === 'completed'
    );
    
    console.log('📊 Completed orders for earnings:', completedOrders.length);
    
    // Get delivery fee from each order or use default
    const now = new Date();
    
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    let todayTotal = 0;
    let weeklyTotal = 0;
    let monthlyTotal = 0;
    let totalEarnings = 0;

    completedOrders.forEach(order => {
      // Get delivery fee from order or use default 45
      const deliveryFee = order.deliveryFee || 45;
      const orderDate = new Date(order.updatedAt || order.deliveredAt || order.createdAt);
      
      totalEarnings += deliveryFee;
      
      if (orderDate >= todayStart) {
        todayTotal += deliveryFee;
      }
      if (orderDate >= oneWeekAgo) {
        weeklyTotal += deliveryFee;
      }
      if (orderDate >= oneMonthAgo) {
        monthlyTotal += deliveryFee;
      }
    });

    console.log('💰 Calculated earnings:', {
      today: todayTotal,
      weekly: weeklyTotal,
      monthly: monthlyTotal,
      total: totalEarnings,
      completedDeliveries: completedOrders.length
    });

    setEarnings({
      today: todayTotal,
      weekly: weeklyTotal,
      monthly: monthlyTotal,
      total: totalEarnings,
      completedDeliveries: completedOrders.length
    });

    // Calculate stats
    const totalDeliveries = completedOrders.length;
    const avgTime = totalDeliveries > 0 ? 25 + Math.floor(Math.random() * 10) : 28;
    const distance = totalDeliveries * 2.5;

    setStats({
      onlineHours: Math.floor(totalDeliveries * 0.75),
      distanceCovered: distance,
      avgDeliveryTime: avgTime,
      rating: 4.9
    });
  };

  // ✅ FIXED: Accept order with better error handling
  const acceptOrder = async (orderId) => {
    const token = getToken();
    if (!token) {
      alert('❌ Please login again');
      logout();
      return;
    }

    if (riderStatus === 'offline') {
      alert('❌ Please go online first to accept orders!');
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

      const data = await res.json();
      console.log('📡 Accept response:', data);

      if (res.ok && data.success) {
        setNotifications(prev => [{
          id: Date.now(),
          message: '✅ Order accepted! Head to the restaurant.',
          time: new Date().toISOString(),
          type: 'success'
        }, ...prev]);
        await loadData();
      } else {
        alert(`❌ Failed: ${data.message || 'Could not accept order'}`);
      }
    } catch (err) {
      console.error('❌ Accept error:', err);
      alert('❌ Network error. Please try again.');
    }
  };

  // Update delivery status
  const updateStatus = async (orderId, status) => {
    const token = getToken();
    if (!token) return;

    try {
      console.log(`🔄 Updating order ${orderId} to ${status}`);
      const res = await fetch(`${API_URL}/orders/${orderId}/delivery-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      console.log('📡 Status update response:', data);

      if (res.ok && data.success) {
        const statusMessages = {
          'out_for_delivery': '🚚 On your way to deliver!',
          'delivered': '✅ Order delivered! Great job!'
        };
        
        setNotifications(prev => [{
          id: Date.now(),
          message: statusMessages[status] || `Status updated to ${status}`,
          time: new Date().toISOString(),
          type: 'success'
        }, ...prev]);
        
        await loadData();
      } else {
        alert(`❌ Failed: ${data.message || 'Could not update status'}`);
      }
    } catch (error) {
      console.error('❌ Update status error:', error);
      alert('❌ Failed to update status');
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    console.log('🚀 Loading all rider data...');
    
    try {
      await fetchRiderProfile();
      await fetchAvailable();
      await fetchMyDeliveries();
      // Wait for deliveries to load before calculating earnings
      setTimeout(async () => {
        await fetchEarnings();
      }, 500);
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Handle logout with menu closing
  const handleLogout = () => {
    setShowMobileMenu(false);
    setShowNotifications(false);
    logout();
  };

  useEffect(() => {
    if (user?.role === 'rider') {
      console.log('🔥 RiderDashboard mounted for user:', user._id);
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

  // Recalculate earnings when deliveries change
  useEffect(() => {
    if (myDeliveries.length > 0) {
      calculateEarningsFromDeliveries();
    }
  }, [myDeliveries]);

  // Location tracking when online
  useEffect(() => {
    let interval;
    if (riderStatus === 'online') {
      const trackLocation = async () => {
        try {
          const location = await getCurrentLocation();
          await updateRiderLocation(location);
        } catch (error) {
          console.error('❌ Location tracking error:', error);
        }
      };
      
      trackLocation();
      interval = setInterval(trackLocation, 30000); // Update every 30 seconds
    }
    
    return () => clearInterval(interval);
  }, [riderStatus]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₱0';
    return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
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

  const dashboardStats = {
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
      online: 'bg-green-100 text-green-700 border-green-200',
      offline: 'bg-red-100 text-red-600 border-red-200',
      assigned: 'bg-orange-100 text-orange-700 border-orange-200',
      out_for_delivery: 'bg-blue-100 text-blue-700 border-blue-200',
      delivered: 'bg-green-100 text-green-700 border-green-200',
      ready: 'bg-purple-100 text-purple-700 border-purple-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    
    const labels = {
      online: 'Online',
      offline: 'Offline',
      assigned: 'Assigned',
      out_for_delivery: 'On Delivery',
      delivered: 'Delivered',
      ready: 'Ready',
      pending: 'Pending',
      accepted: 'Accepted'
    };

    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${styles[status] || styles.offline} shadow-sm`}>
        {labels[status] || status}
      </span>
    );
  };

  // Order Card Component
  const OrderCard = ({ order, type }) => {
    const isAvailable = type === 'available';
    const deliveryFee = order.deliveryFee || 45;
    
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-red-800 text-lg">#{order.orderId || order._id?.slice(-6)}</h3>
                <p className="text-xs text-red-500 font-medium">{formatDate(order.createdAt)}</p>
              </div>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <Store className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">{order.restaurant?.name || 'Restaurant'}</p>
                <p className="text-xs text-red-400 line-clamp-1">{order.restaurant?.address || 'Pickup location'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">{order.user?.name || 'Customer'}</p>
                <p className="text-xs text-red-400 line-clamp-1">{order.deliveryAddress || 'Delivery address'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-red-100">
            <div>
              <p className="text-xs text-red-400 mb-1">Earnings</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(deliveryFee)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-red-400 mb-1">Order Total</p>
              <p className="text-lg font-bold text-red-800">{formatCurrency(order.total || order.totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 grid grid-cols-3 gap-2">
          <button 
            onClick={() => showOrderWithMap(order)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 transition-colors"
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
                  ? 'bg-red-100 text-red-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200 hover:shadow-xl hover:scale-[1.02]'
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
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-sm shadow-lg shadow-green-200 hover:shadow-xl transition-all"
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
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100 hover:shadow-xl transition-all transform hover:scale-[1.02]">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-14 h-14 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}>
          <Icon className={`w-7 h-7 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-red-500 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-red-800">{formatCurrency(amount)}</p>
    </div>
  );

  // Map Component
  const OrderMap = ({ order, currentLocation, customerLocation }) => {
    if (!currentLocation || !customerLocation) {
      return (
        <div className="h-64 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center border border-red-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <Map className="text-red-500 w-8 h-8" />
            </div>
            <p className="text-red-600 font-medium">Loading map...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-64 bg-red-50 rounded-2xl overflow-hidden relative shadow-inner border border-red-200">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.lng - 0.02}%2C${currentLocation.lat - 0.02}%2C${currentLocation.lng + 0.02}%2C${currentLocation.lat + 0.02}&layer=mapnik&marker=${currentLocation.lat}%2C${currentLocation.lng}&marker=${customerLocation.lat}%2C${customerLocation.lng}`}
          title="Delivery Route"
        />
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-red-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-red-800">Your Location</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-sm font-semibold text-red-800">Customer</span>
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
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-300 shadow-2xl">
          <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold">Order Details</h2>
              <p className="text-red-100 text-sm">#{order.orderId || order._id}</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-white rounded-2xl border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-red-800 text-lg">{order.user?.name || 'Customer'}</p>
                  <p className="text-sm text-red-500">{order.user?.phone || 'No phone'}</p>
                </div>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="grid gap-4">
              <div className="p-4 border border-red-100 rounded-2xl bg-white">
                <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  <Store className="w-5 h-5 text-red-500" />
                  Restaurant
                </h3>
                <p className="font-semibold text-red-700">{order.restaurant?.name || 'Unknown'}</p>
                <p className="text-sm text-red-500 mt-1">{order.restaurant?.address || 'No address'}</p>
              </div>

              <div className="p-4 border border-red-100 rounded-2xl bg-white">
                <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  Delivery Address
                </h3>
                <p className="text-red-700">{order.deliveryAddress || 'No address provided'}</p>
              </div>
            </div>

            {order.items?.length > 0 && (
              <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-4 border border-red-100">
                <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-500" />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-red-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center">
                          {item.quantity}
                        </span>
                        <span className="font-medium text-red-800">{item.productName || item.product?.name}</span>
                      </div>
                      <span className="font-semibold text-red-800">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl text-white">
              <span className="font-bold text-lg">Total Amount</span>
              <span className="text-2xl font-bold">{formatCurrency(order.total || order.totalAmount)}</span>
            </div>

            {showMap && (
              <div>
                <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-red-500" />
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
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-200"
                  >
                    <Phone className="w-5 h-5" />
                    Call
                  </a>
                  <a 
                    href={`sms:${order.user.phone}`} 
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-200"
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
          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200' 
          : 'text-red-600 hover:bg-red-50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-semibold text-sm">{label}</span>
      {badge > 0 && (
        <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${
          activeTab === id ? 'bg-white text-red-600' : 'bg-red-500 text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  // Notification Item
  const NotificationItem = ({ notification }) => (
    <div className="p-3 hover:bg-red-50 border-b border-red-100 last:border-0">
      <p className="text-sm text-red-800">{notification.message}</p>
      <p className="text-xs text-red-500 mt-1">{formatTimeAgo(notification.time)}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Navigation className="w-8 h-8 text-red-600 animate-pulse" />
            </div>
          </div>
          <p className="text-red-800 font-medium mt-4">Loading Rider Dashboard...</p>
          <p className="text-red-600 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Not Logged In</h2>
          <p className="text-red-600 mb-6">Please login to continue.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== 'rider') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600 mb-6">This area is for riders only.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      {/* Debug Banner */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 p-2 text-xs font-mono text-yellow-800 z-50 text-center">
        DEBUG: Status={riderStatus} | Available={available.length} | Deliveries={myDeliveries.length} | Earnings={earnings.total} | Completed={earnings.completedDeliveries}
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-80 bg-white shadow-2xl border-r border-red-100 fixed h-full mt-8">
        <div className="p-6 border-b border-red-100 bg-gradient-to-r from-red-600 to-red-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Navigation className="text-red-600 w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-xl">Rider Pro</h1>
              <p className="text-red-100 text-sm">Delivery Partner</p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="p-4">
          <div className={`rounded-xl p-4 ${
            riderStatus === 'online' 
              ? 'bg-gradient-to-r from-green-500 to-green-600' 
              : 'bg-gradient-to-r from-red-500 to-red-600'
          } text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${riderStatus === 'online' ? 'bg-white animate-pulse' : 'bg-red-200'}`} />
                <span className="font-semibold">{riderStatus === 'online' ? 'Online' : 'Offline'}</span>
              </div>
              <button 
                onClick={toggleRiderStatus}
                className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold transition-colors"
              >
                Switch
              </button>
            </div>
            <p className="text-sm opacity-90">
              {riderStatus === 'online' 
                ? `${available.length} orders available` 
                : 'Go online to start earning'}
            </p>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem id="home" icon={Home} label="Dashboard" />
          <NavItem id="available" icon={Package} label="Available Orders" badge={available.length} />
          <NavItem id="my-deliveries" icon={Truck} label="My Deliveries" badge={myDeliveries.length} />
          <NavItem id="earnings" icon={Wallet} label="Earnings" />
        </div>

        {/* User Profile - Desktop */}
        <div className="p-4 border-t border-red-100">
          <div className="bg-gradient-to-r from-red-50 to-white rounded-xl p-4 border border-red-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {user.name?.charAt(0) || 'R'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-red-800 truncate">{user.name}</p>
                <p className="text-xs text-red-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-white rounded-lg p-2 border border-red-100">
                <p className="text-xs text-red-500">Rating</p>
                <p className="font-bold text-red-700">4.9 ★</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-red-100">
                <p className="text-xs text-red-500">Deliveries</p>
                <p className="font-bold text-red-700">{earnings.completedDeliveries}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="mt-3 flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold text-sm shadow-lg shadow-red-200"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 pt-8">
        {/* Mobile Header */}
        <header className="lg:hidden bg-gradient-to-r from-red-600 to-red-700 text-white sticky top-0 z-40 shadow-lg">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <Navigation className="text-red-600 w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold">Rider Pro</h1>
                <p className="text-xs text-red-100">{user.name?.split(' ')[0]}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
                )}
              </button>
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Status Bar - Mobile */}
          <div className="px-4 pb-3">
            <div className={`rounded-xl p-3 ${
              riderStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${riderStatus === 'online' ? 'bg-white animate-pulse' : 'bg-red-200'}`} />
                  <span className="font-semibold text-sm">
                    {riderStatus === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
                <button 
                  onClick={toggleRiderStatus}
                  className="px-3 py-1 rounded-lg bg-white/20 text-xs font-semibold"
                >
                  Switch
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu - FIXED with logout button */}
          {showMobileMenu && (
            <div className="absolute top-full left-0 right-0 bg-white border-b border-red-100 shadow-xl p-4 space-y-2 z-50 max-h-[80vh] overflow-y-auto">
              <button 
                onClick={() => { setActiveTab('home'); setShowMobileMenu(false); }} 
                className="w-full text-left p-3 rounded-xl hover:bg-red-50 text-red-800 font-medium flex items-center gap-3"
              >
                <Home className="w-5 h-5 text-red-500" />
                Dashboard
              </button>
              <button 
                onClick={() => { setActiveTab('available'); setShowMobileMenu(false); }} 
                className="w-full text-left p-3 rounded-xl hover:bg-red-50 text-red-800 font-medium flex items-center gap-3"
              >
                <Package className="w-5 h-5 text-red-500" />
                Available Orders 
                {available.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {available.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => { setActiveTab('my-deliveries'); setShowMobileMenu(false); }} 
                className="w-full text-left p-3 rounded-xl hover:bg-red-50 text-red-800 font-medium flex items-center gap-3"
              >
                <Truck className="w-5 h-5 text-red-500" />
                My Deliveries 
                {myDeliveries.length > 0 && (
                  <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {myDeliveries.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => { setActiveTab('earnings'); setShowMobileMenu(false); }} 
                className="w-full text-left p-3 rounded-xl hover:bg-red-50 text-red-800 font-medium flex items-center gap-3"
              >
                <Wallet className="w-5 h-5 text-red-500" />
                Earnings
              </button>
              <button 
                onClick={loadData} 
                className="w-full text-left p-3 rounded-xl hover:bg-red-50 text-red-800 font-medium flex items-center gap-3"
              >
                <RefreshCw className="w-5 h-5 text-red-500" />
                Refresh
              </button>
              
              {/* Divider */}
              <div className="border-t border-red-100 my-2"></div>
              
              {/* User Info - Mobile */}
              <div className="p-3 bg-gradient-to-r from-red-50 to-white rounded-xl border border-red-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <p className="font-bold text-red-800">{user.name}</p>
                    <p className="text-xs text-red-500">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-red-500">Rating</p>
                    <p className="font-bold text-red-700 text-sm">4.9 ★</p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-red-500">Deliveries</p>
                    <p className="font-bold text-red-700 text-sm">{earnings.completedDeliveries}</p>
                  </div>
                </div>
              </div>
              
              {/* Logout Button - Mobile */}
              <button 
                onClick={handleLogout}
                className="w-full p-3 rounded-xl bg-red-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-200 mt-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          )}
        </header>

        {/* Notifications Panel */}
        {showNotifications && (
          <div className="absolute top-16 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-red-100 z-50">
            <div className="p-4 border-b border-red-100 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-2xl flex justify-between items-center">
              <h3 className="font-bold">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-red-500">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              )}
            </div>
          </div>
        )}

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-red-800">
              Welcome back, {user.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-red-500">Ready for another great day of deliveries</p>
          </div>

          {locationError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 shadow-lg">
              <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
              <span className="text-red-800 text-sm font-medium">{locationError}</span>
            </div>
          )}

          {/* Home/Dashboard Tab */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-lg border border-red-100 transform hover:scale-105 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-3">
                    <Package className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-800">{dashboardStats.availableOrders}</p>
                  <p className="text-sm text-red-500 font-medium">Available</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-lg border border-red-100 transform hover:scale-105 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-800">{dashboardStats.myDeliveries}</p>
                  <p className="text-sm text-red-500 font-medium">Active</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-lg border border-red-100 transform hover:scale-105 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-800">{dashboardStats.pendingDeliveries}</p>
                  <p className="text-sm text-red-500 font-medium">In Progress</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-lg border border-red-100 transform hover:scale-105 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-800">{dashboardStats.completedDeliveries}</p>
                  <p className="text-sm text-red-500 font-medium">Completed</p>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-5 text-white shadow-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-yellow-300" />
                    <p className="text-sm opacity-90">Rating</p>
                  </div>
                  <p className="text-2xl font-bold">{stats.rating} ★</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-500">Avg. Time</p>
                  </div>
                  <p className="text-2xl font-bold text-red-800">{stats.avgDeliveryTime} min</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation2 className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-500">Distance</p>
                  </div>
                  <p className="text-2xl font-bold text-red-800">{stats.distanceCovered} km</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-500">Online Hours</p>
                  </div>
                  <p className="text-2xl font-bold text-red-800">{stats.onlineHours}h</p>
                </div>
              </div>

              {/* Earnings Preview */}
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-red-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-red-800 text-lg">Earnings Overview</h3>
                  <button 
                    onClick={() => setActiveTab('earnings')}
                    className="text-red-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-white border border-red-100">
                    <p className="text-sm text-red-500 mb-1">Today</p>
                    <p className="text-2xl font-bold text-red-800">{formatCurrency(earnings.today)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-white border border-red-100">
                    <p className="text-sm text-red-500 mb-1">This Week</p>
                    <p className="text-2xl font-bold text-red-800">{formatCurrency(earnings.weekly)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white">
                    <p className="text-sm text-red-100 mb-1">Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(earnings.total)}</p>
                  </div>
                </div>
              </div>

              {/* Recent Deliveries */}
              {myDeliveries.length > 0 && (
                <div>
                  <h3 className="font-bold text-red-800 text-lg mb-4">Recent Deliveries</h3>
                  <div className="space-y-4">
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
                  <h2 className="text-2xl font-bold text-red-800">Available Orders</h2>
                  <p className="text-red-500">{available.length} orders waiting nearby</p>
                </div>
                {riderStatus === 'offline' && (
                  <button 
                    onClick={toggleRiderStatus}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm shadow-lg shadow-red-200"
                  >
                    Go Online
                  </button>
                )}
              </div>

              {available.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-red-100 shadow-xl">
                  <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-12 h-12 text-red-300" />
                  </div>
                  <h3 className="font-bold text-red-800 text-lg mb-2">No Orders Available</h3>
                  <p className="text-red-500 mb-6 max-w-sm mx-auto">
                    {riderStatus === 'offline' 
                      ? 'Go online to start receiving delivery requests' 
                      : 'Hang tight! New orders will appear here soon'}
                  </p>
                  {riderStatus === 'offline' ? (
                    <button 
                      onClick={toggleRiderStatus}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold shadow-lg shadow-red-200 hover:from-red-700 hover:to-red-800 transition-all"
                    >
                      Go Online Now
                    </button>
                  ) : (
                    <button 
                      onClick={fetchAvailable}
                      className="px-6 py-3 rounded-xl bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors flex items-center gap-2 mx-auto"
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
                <h2 className="text-2xl font-bold text-red-800">My Deliveries</h2>
                <p className="text-red-500">Track your active and completed orders</p>
              </div>

              {myDeliveries.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-red-100 shadow-xl">
                  <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-12 h-12 text-red-300" />
                  </div>
                  <h3 className="font-bold text-red-800 text-lg mb-2">No Active Deliveries</h3>
                  <p className="text-red-500 mb-6">Accept an order to start delivering</p>
                  <button 
                    onClick={() => setActiveTab('available')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold shadow-lg shadow-red-200 hover:from-red-700 hover:to-red-800 transition-all"
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
                <h2 className="text-2xl font-bold text-red-800">Earnings</h2>
                <p className="text-red-500">Track your income and performance</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <EarningsCard 
                  title="Today's Earnings" 
                  amount={earnings.today} 
                  icon={DollarSign} 
                  color="bg-red-500"
                  trend="+15%"
                />
                <EarningsCard 
                  title="This Week" 
                  amount={earnings.weekly} 
                  icon={Calendar} 
                  color="bg-blue-500"
                  trend="+8%"
                />
                <EarningsCard 
                  title="This Month" 
                  amount={earnings.monthly} 
                  icon={TrendingUp} 
                  color="bg-purple-500"
                  trend="+12%"
                />
                <EarningsCard 
                  title="Total Earnings" 
                  amount={earnings.total} 
                  icon={Wallet} 
                  color="bg-green-500"
                />
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-xl border border-red-100">
                <h3 className="font-bold text-red-800 text-lg mb-6">Performance Overview</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-3xl font-bold text-red-800 mb-1">{earnings.completedDeliveries}</p>
                    <p className="text-sm text-red-500 font-medium">Completed Deliveries</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="w-8 h-8 text-yellow-600" />
                    </div>
                    <p className="text-3xl font-bold text-red-800 mb-1">{stats.rating}</p>
                    <p className="text-sm text-red-500 font-medium">Rating</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-red-800 mb-1">98%</p>
                    <p className="text-sm text-red-500 font-medium">Acceptance Rate</p>
                  </div>
                </div>
              </div>

              {/* Recent Earnings List */}
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-red-100">
                <h3 className="font-bold text-red-800 text-lg mb-4">Recent Earnings</h3>
                <div className="space-y-3">
                  {myDeliveries
                    .filter(o => o.status === 'delivered')
                    .slice(0, 5)
                    .map(order => (
                      <div key={order._id} className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-white rounded-xl border border-red-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-red-800">#{order.orderId || order._id.slice(-6)}</p>
                            <p className="text-xs text-red-500">{formatDate(order.updatedAt || order.createdAt)}</p>
                          </div>
                        </div>
                        <p className="font-bold text-red-600">{formatCurrency(order.deliveryFee || 45)}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Order Details Modal */}
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

// Calendar Icon Component
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