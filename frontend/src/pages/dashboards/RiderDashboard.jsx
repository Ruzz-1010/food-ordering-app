import React, { useState, useEffect } from 'react';
import {
  Navigation, Package, DollarSign, Clock, CheckCircle, Phone, 
  X, LogOut, RefreshCw, MapPin, Store, User, Eye, Map, Wifi, WifiOff,
  Truck, Home, MessageCircle, AlertCircle, ChevronRight, Menu, MoreVertical,
  CreditCard, TrendingUp, Wallet, Shield
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

  const token = localStorage.getItem('token');

  // Fetch rider profile and status
  const fetchRiderProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/riders/profile`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.rider) {
          setRiderStatus(data.rider.status || 'offline');
          console.log('🔄 Rider profile loaded:', data.rider.status);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching rider profile:', error);
      // Check localStorage as fallback
      const savedStatus = localStorage.getItem('riderStatus');
      if (savedStatus) {
        setRiderStatus(savedStatus);
      }
    }
  };

  // Get rider's current location with better error handling
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by this browser.';
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
          console.log('📍 Rider location:', location);
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Unable to get your current location.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An unknown error occurred.';
              break;
          }
          
          setLocationError(errorMessage);
          console.error('📍 Location error:', error);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Update rider location to backend
  const updateRiderLocation = async (location) => {
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
      }
    } catch (error) {
      console.error('❌ Error updating location:', error);
    }
  };

  // Toggle rider status - COMPLETELY FIXED
  const toggleRiderStatus = async () => {
    const newStatus = riderStatus === 'online' ? 'offline' : 'online';
    
    console.log(`🔄 Changing status from ${riderStatus} to ${newStatus}`);
    
    try {
      // If going online, get location first
      if (newStatus === 'online') {
        try {
          const location = await getCurrentLocation();
          await updateRiderLocation(location);
        } catch (locationError) {
          // If location fails but user still wants to go online
          const proceed = window.confirm(
            'Unable to get your location. You may not receive nearby orders. Continue going online?'
          );
          if (!proceed) {
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
        
        if (newStatus === 'online') {
          alert('✅ You are now ONLINE and ready to accept orders');
          await fetchAvailable();
        } else {
          alert('🔴 You are now OFFLINE');
          setAvailable([]);
        }
        
        // Refresh data
        await loadData();
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('❌ Error updating rider status:', error);
      
      // Fallback: Update UI anyway for better UX
      setRiderStatus(newStatus);
      localStorage.setItem('riderStatus', newStatus);
      
      alert(`Status changed to ${newStatus} (offline mode)`);
      
      if (newStatus === 'online') {
        setAvailable([]); // Will be empty without backend
      }
    }
    
    setShowMobileMenu(false);
  };

  // Fetch available orders (only for online riders)
  const fetchAvailable = async () => {
    if (riderStatus !== 'online') {
      setAvailable([]);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/orders/rider/available`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('📦 Available orders:', data);
        if (data.success) {
          setAvailable(data.orders || []);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching available orders:', error);
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
      
      if (res.ok) {
        const data = await res.json();
        console.log('🚚 My deliveries:', data);
        if (data.success) {
          setMyDeliveries(data.orders || []);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching my deliveries:', error);
      setMyDeliveries([]);
    }
  };

  // Fetch earnings from API
  const fetchEarnings = async () => {
    try {
      const res = await fetch(`${API_URL}/riders/earnings`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('💰 Earnings data from API:', data);
        
        if (data.success && data.earnings) {
          setEarnings(data.earnings);
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error fetching earnings from API:', error);
    }
    
    // Fallback to local calculation
    calculateEarnings();
  };

  // Calculate earnings locally
  const calculateEarnings = () => {
    const completedOrders = myDeliveries.filter(order => 
      order.status === 'delivered' || order.status === 'completed'
    );
    
    const deliveryFee = 35;
    const now = new Date();
    
    // Today's earnings
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEarnings = completedOrders.filter(order => {
      const orderDate = new Date(order.updatedAt || order.deliveredAt || order.createdAt);
      return orderDate >= todayStart;
    }).length * deliveryFee;

    // Weekly earnings
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyEarnings = completedOrders.filter(order => {
      const orderDate = new Date(order.updatedAt || order.deliveredAt || order.createdAt);
      return orderDate >= oneWeekAgo;
    }).length * deliveryFee;

    // Monthly earnings
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const monthlyEarnings = completedOrders.filter(order => {
      const orderDate = new Date(order.updatedAt || order.deliveredAt || order.createdAt);
      return orderDate >= oneMonthAgo;
    }).length * deliveryFee;

    const earningsData = {
      today: todayEarnings,
      weekly: weeklyEarnings,
      monthly: monthlyEarnings,
      total: completedOrders.length * deliveryFee,
      completedDeliveries: completedOrders.length
    };

    setEarnings(earningsData);
  };

  // Accept order
  const acceptOrder = async (orderId) => {
    if (riderStatus === 'offline') {
      alert('❌ Please go online to accept orders');
      return;
    }

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
      if (res.ok && data.success) {
        alert('✅ Order assigned to you!');
        await loadData();
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
        await fetchEarnings();
      } else {
        alert(`❌ Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
      alert('❌ Failed to update status. Please try again.');
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRiderProfile(),
        fetchAvailable(),
        fetchMyDeliveries()
      ]);
      await fetchEarnings();
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    if (user && user.role === 'rider') {
      loadData();
      
      // Set up location tracking when online
      if (riderStatus === 'online') {
        getCurrentLocation();
      }
    }
  }, [user]);

  // Refresh available orders when status changes to online
  useEffect(() => {
    if (riderStatus === 'online') {
      fetchAvailable();
    } else {
      setAvailable([]);
    }
  }, [riderStatus]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₱0';
    return `₱${parseFloat(amount).toFixed(2)}`;
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

  // Get customer location coordinates
  const getCustomerLocation = (order) => {
    // This should come from order data in real implementation
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
          marginHeight="0"
          marginWidth="0"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.lng - 0.02}%2C${currentLocation.lat - 0.02}%2C${currentLocation.lng + 0.02}%2C${currentLocation.lat + 0.02}&layer=mapnik&marker=${currentLocation.lat}%2C${currentLocation.lng}&marker=${customerLocation.lat}%2C${customerLocation.lng}`}
          style={{ border: 0 }}
          title="Delivery Route Map"
        />
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs shadow">
          <div className="flex items-center space-x-1 mb-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-xs">You</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <span className="text-xs">Customer</span>
          </div>
        </div>
        
        <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-1 py-0.5 rounded text-xs">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            © OSM
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-2">
          {/* Header */}
          <div className="p-4 border-b sticky top-0 bg-white z-10">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 truncate pr-2">
                Order #{order.orderId || order._id}
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Order Summary */}
            <div className="space-y-4 mb-6">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                  <User className="mr-2 w-4 h-4" />
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{order.user?.name || 'Customer'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{order.user?.phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Address:</span>
                    <p className="font-medium text-sm mt-1">{order.deliveryAddress || 'No address provided'}</p>
                  </div>
                </div>
              </div>

              {/* Restaurant Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                  <Store className="mr-2 w-4 h-4" />
                  Restaurant Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{order.restaurant?.name || 'Unknown Restaurant'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Address:</span>
                    <p className="font-medium text-sm mt-1">{order.restaurant?.address || 'No address'}</p>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                  <Package className="mr-2 w-4 h-4" />
                  Order Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                      order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'ready' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium text-green-600">{formatCurrency(order.total || order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Order Items</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {order.items?.length > 0 ? (
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.productName || item.product?.name || `Item ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-sm ml-2 flex-shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No items information available</p>
                )}
              </div>
            </div>

            {/* Map Section */}
            {showMap && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                  <Map className="mr-2 w-4 h-4" />
                  Delivery Route
                </h3>
                <OrderMap 
                  order={order} 
                  currentLocation={currentLocation} 
                  customerLocation={customerLoc}
                />
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <MapPin className="text-blue-600 w-4 h-4" />
                    <span className="truncate">You: {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Unknown'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Home className="text-red-600 w-4 h-4" />
                    <span className="truncate">Customer: {customerLoc ? `${customerLoc.lat.toFixed(4)}, ${customerLoc.lng.toFixed(4)}` : 'Unknown'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2 pt-4 border-t">
              {order.user?.phone && (
                <div className="flex space-x-2">
                  <a 
                    href={`tel:${order.user.phone}`}
                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 text-sm flex-1"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Customer</span>
                  </a>
                  <a 
                    href={`sms:${order.user.phone}`}
                    className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 text-sm flex-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send SMS</span>
                  </a>
                </div>
              )}
              <button 
                onClick={() => setShowMap(!showMap)}
                className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 text-sm"
              >
                <Map className="w-4 h-4" />
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
            <Shield className="text-red-600 w-8 h-8" />
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
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Navigation className="text-white w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-gray-900 truncate">Rider Dashboard</h1>
                <p className="text-sm text-gray-500 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {riderStatus === 'online' ? '🟢 Online' : '🔴 Offline'} • {stats.availableOrders} available
                </p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2">
              {/* Status Toggle - Mobile Only */}
              <button 
                onClick={toggleRiderStatus}
                className={`sm:hidden p-2 rounded-lg ${
                  riderStatus === 'online' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-white'
                }`}
              >
                {riderStatus === 'online' ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </button>

              {/* Mobile Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {showMobileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                    <button 
                      onClick={toggleRiderStatus}
                      className={`flex items-center space-x-3 w-full px-4 py-2 text-left ${
                        riderStatus === 'online' 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {riderStatus === 'online' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                      <span>{riderStatus === 'online' ? 'Go Offline' : 'Go Online'}</span>
                    </button>
                    
                    <button 
                      onClick={getCurrentLocation}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Update Location</span>
                    </button>
                    
                    <button 
                      onClick={loadData} 
                      className="flex items-center space-x-3 w-full px-4 py-2 text-left text-gray-600 hover:bg-gray-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                    
                    <button 
                      onClick={logout} 
                      className="flex items-center space-x-3 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Desktop Buttons */}
              <div className="hidden sm:flex items-center space-x-2">
                <button 
                  onClick={toggleRiderStatus}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm ${
                    riderStatus === 'online' 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {riderStatus === 'online' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  <span>{riderStatus === 'online' ? 'Online' : 'Offline'}</span>
                </button>

                <button 
                  onClick={getCurrentLocation}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Location</span>
                </button>

                <button 
                  onClick={loadData} 
                  className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        {/* Location Error Alert */}
        {locationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-600 mr-3 flex-shrink-0 w-5 h-5" />
              <div className="flex-1">
                <p className="text-red-800 font-medium text-sm">Location Error</p>
                <p className="text-red-700 text-xs">{locationError}</p>
              </div>
              <button 
                onClick={() => setLocationError(null)}
                className="text-red-600 hover:text-red-800 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-600 mb-1">Available</p>
            <p className="text-xl font-bold text-gray-900">{stats.availableOrders}</p>
            <p className="text-xs text-blue-600">orders</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-600 mb-1">My Deliveries</p>
            <p className="text-xl font-bold text-gray-900">{stats.myDeliveries}</p>
            <p className="text-xs text-orange-600">assigned</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-600 mb-1">In Progress</p>
            <p className="text-xl font-bold text-orange-600">{stats.pendingDeliveries}</p>
            <p className="text-xs text-orange-600">active</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-600 mb-1">Completed</p>
            <p className="text-xl font-bold text-green-600">{stats.completedDeliveries}</p>
            <p className="text-xs text-green-600">delivered</p>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 mb-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold">Your Earnings</h3>
              <p className="text-green-100 text-sm">₱35 per delivery</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatCurrency(earnings.total)}</p>
              <p className="text-green-100 text-sm">Total</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-bold">{formatCurrency(earnings.today)}</p>
              <p className="text-green-100 text-xs">Today</p>
            </div>
            <div>
              <p className="font-bold">{formatCurrency(earnings.weekly)}</p>
              <p className="text-green-100 text-xs">Week</p>
            </div>
            <div>
              <p className="font-bold">{formatCurrency(earnings.monthly)}</p>
              <p className="text-green-100 text-xs">Month</p>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {riderStatus === 'offline' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <AlertCircle className="text-yellow-600 mr-3 flex-shrink-0 w-5 h-5" />
              <div>
                <p className="text-yellow-800 font-medium text-sm">You are offline</p>
                <p className="text-yellow-700 text-xs">Go online to receive orders</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Location Display */}
        {currentLocation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <MapPin className="text-blue-600 flex-shrink-0 w-5 h-5" />
                <div className="min-w-0 flex-1">
                  <p className="text-blue-800 font-medium text-sm truncate">Your Location</p>
                  <p className="text-blue-700 text-xs truncate">
                    {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </p>
                </div>
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium flex-shrink-0 ml-2">
                Active
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab('available')} 
            className={`px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap flex-shrink-0 ${
              activeTab === 'available' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Available ({available.length})
          </button>
          <button 
            onClick={() => setActiveTab('my-deliveries')} 
            className={`px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap flex-shrink-0 ${
              activeTab === 'my-deliveries' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            My Deliveries ({myDeliveries.length})
          </button>
          <button 
            onClick={() => setActiveTab('earnings')} 
            className={`px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap flex-shrink-0 ${
              activeTab === 'earnings' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Earnings
          </button>
        </div>

        {/* Available Orders */}
        {activeTab === 'available' && (
          <div className="space-y-3">
            {available.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <Package className="mx-auto text-gray-300 mb-4 w-12 h-12" />
                <p className="text-gray-500 text-lg mb-2">
                  {riderStatus === 'offline' ? 'Go online to see available orders' : 'No available orders'}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {riderStatus === 'offline' ? 'Switch to online mode to start receiving orders' : 'Orders ready for delivery will appear here'}
                </p>
                {riderStatus === 'offline' ? (
                  <button 
                    onClick={toggleRiderStatus}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Go Online
                  </button>
                ) : (
                  <button 
                    onClick={loadData} 
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                  >
                    Check Again
                  </button>
                )}
              </div>
            ) : (
              available.map(order => (
                <div key={order._id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-base truncate">
                          Order #{order.orderId || order._id}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ${
                          order.status === 'ready' ? 'bg-green-100 text-green-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2">
                        {formatDate(order.createdAt)}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start space-x-2">
                          <Store className="text-gray-400 mt-0.5 flex-shrink-0 w-4 h-4" />
                          <p className="text-gray-600 truncate">{order.restaurant?.name || 'Unknown Restaurant'}</p>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <MapPin className="text-gray-400 mt-0.5 flex-shrink-0 w-4 h-4" />
                          <p className="text-gray-600 truncate">{order.deliveryAddress || 'No address provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(order.total || order.totalAmount)}
                      </p>
                      <p className="text-sm text-green-500 font-medium">
                        +{formatCurrency(order.deliveryFee || 35)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 pt-3 border-t">
                    <button 
                      onClick={() => showOrderWithMap(order)}
                      className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details & Map</span>
                    </button>
                    
                    <div className="flex space-x-2">
                      {order.user?.phone && (
                        <a 
                          href={`tel:${order.user.phone}`}
                          className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm flex-1"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Call</span>
                        </a>
                      )}
                      <button 
                        onClick={() => acceptOrder(order._id)}
                        disabled={riderStatus === 'offline'}
                        className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm flex-1 ${
                          riderStatus === 'offline'
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept</span>
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
          <div className="space-y-3">
            {myDeliveries.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <Package className="mx-auto text-gray-300 mb-4 w-12 h-12" />
                <p className="text-gray-500 text-lg mb-2">No deliveries assigned</p>
                <p className="text-gray-400 text-sm mb-4">Accepted orders will appear here</p>
                <button 
                  onClick={() => setActiveTab('available')}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                >
                  View Available Orders
                </button>
              </div>
            ) : (
              myDeliveries.map(order => (
                <div key={order._id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-base truncate">
                          Order #{order.orderId || order._id}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                          order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2">
                        {formatDate(order.createdAt)}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start space-x-2">
                          <Store className="text-gray-400 mt-0.5 flex-shrink-0 w-4 h-4" />
                          <p className="text-gray-600 truncate">{order.restaurant?.name || 'Unknown Restaurant'}</p>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <MapPin className="text-gray-400 mt-0.5 flex-shrink-0 w-4 h-4" />
                          <p className="text-gray-600 truncate">{order.deliveryAddress || 'No address provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(order.total || order.totalAmount)}
                      </p>
                      <p className="text-sm text-green-500 font-medium">
                        +{formatCurrency(order.deliveryFee || 35)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 pt-3 border-t">
                    <button 
                      onClick={() => showOrderWithMap(order)}
                      className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details & Map</span>
                    </button>
                    
                    <div className="flex space-x-2">
                      {order.user?.phone && (
                        <a 
                          href={`tel:${order.user.phone}`}
                          className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm flex-1"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Call</span>
                        </a>
                      )}
                      
                      {order.status === 'assigned' && (
                        <button 
                          onClick={() => updateStatus(order._id, 'out_for_delivery')}
                          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm flex-1"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Start Delivery</span>
                        </button>
                      )}
                      
                      {order.status === 'out_for_delivery' && (
                        <button 
                          onClick={() => updateStatus(order._id, 'delivered')}
                          className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm flex-1"
                        >
                          <CheckCircle className="w-4 h-4" />
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

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Earnings Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-800 font-semibold">Today</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(earnings.today)}</p>
                    </div>
                    <TrendingUp className="text-green-600 w-8 h-8" />
                  </div>
                  <p className="text-green-700 text-sm mt-2">{Math.round(earnings.today / 35)} deliveries today</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-800 font-semibold">This Week</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(earnings.weekly)}</p>
                    </div>
                    <CreditCard className="text-blue-600 w-8 h-8" />
                  </div>
                  <p className="text-blue-700 text-sm mt-2">{Math.round(earnings.weekly / 35)} deliveries this week</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-800 font-semibold">This Month</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(earnings.monthly)}</p>
                    </div>
                    <Wallet className="text-purple-600 w-8 h-8" />
                  </div>
                  <p className="text-purple-700 text-sm mt-2">{Math.round(earnings.monthly / 35)} deliveries this month</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Earnings Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completed Deliveries</span>
                    <span className="font-semibold">{earnings.completedDeliveries}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rate per Delivery</span>
                    <span className="font-semibold text-green-600">₱35.00</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-gray-900 font-semibold">Total Earnings</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(earnings.total)}</span>
                  </div>
                </div>
              </div>
            </div>
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
            setShowMobileMenu(false);
          }} 
          showMap={showMap}
        />
      )}
    </div>
  );
};

export default RiderDashboard;