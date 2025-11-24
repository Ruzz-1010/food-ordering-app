import React, { useState, useEffect } from 'react';
import {
  Store, Plus, Package, DollarSign, Clock, Star, Eye, X, Save,
  LogOut, RefreshCw, Image, MapPin, Navigation, ChefHat,
  CheckCircle, Users, TrendingUp, Phone, MessageCircle, Settings,
  User, Edit, Camera, Upload, Map, Crosshair
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

const RestaurantDashboard = () => {
  const { user, logout, getRestaurantId, getRestaurantData, refreshRestaurantData, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurant, setRestaurant] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', description: '', category: 'main course', preparationTime: '', ingredients: '', image: ''
  });

  // Profile state with location fields
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    cuisine: '',
    description: '',
    deliveryTime: '',
    deliveryFee: '',
    openingHours: {
      open: '08:00',
      close: '22:00'
    },
    image: '',
    bannerImage: '',
    location: {
      type: 'Point',
      coordinates: [0, 0]
    }
  });

  // Get current location using GPS
  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          // Update profile data with coordinates
          setProfileData(prev => ({
            ...prev,
            location: {
              type: 'Point',
              coordinates: [longitude, latitude] // MongoDB uses [longitude, latitude]
            }
          }));
          
          console.log('📍 Restaurant location captured:', { lat: latitude, lng: longitude });
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationLoading(false);
          alert('Unable to get your current location. Please enable location services or enter address manually.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      setLocationLoading(false);
    }
  };

  // Initialize restaurant data
  const initializeRestaurantData = async () => {
    const token = localStorage.getItem('token');
    let currentRestaurantId = getRestaurantId();
    let restaurantData = getRestaurantData();

    console.log('🏪 Initializing restaurant data...');

    if (currentRestaurantId && restaurantData) {
      setRestaurantId(currentRestaurantId);
      setRestaurant(restaurantData);
      // Initialize profile data with location
      setProfileData({
        name: restaurantData.name || '',
        email: restaurantData.email || user?.email || '',
        phone: restaurantData.phone || user?.phone || '',
        address: restaurantData.address || user?.address || '',
        cuisine: restaurantData.cuisine || '',
        description: restaurantData.description || '',
        deliveryTime: restaurantData.deliveryTime || '20-30 min',
        deliveryFee: restaurantData.deliveryFee || 35,
        openingHours: restaurantData.openingHours || { open: '08:00', close: '22:00' },
        image: restaurantData.image || '',
        bannerImage: restaurantData.bannerImage || '',
        location: restaurantData.location || {
          type: 'Point',
          coordinates: [0, 0]
        }
      });
      console.log('✅ Using existing restaurant data');
      return currentRestaurantId;
    }

    // Try to fetch restaurant data
    if (user?._id) {
      try {
        console.log('🔄 Fetching restaurant by owner ID:', user._id);
        const res = await fetch(`${API_URL}/restaurants/owner/${user._id}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          
          if (data.success && data.restaurant) {
            currentRestaurantId = data.restaurant._id;
            setRestaurantId(currentRestaurantId);
            setRestaurant(data.restaurant);
            // Initialize profile data with location
            setProfileData({
              name: data.restaurant.name || '',
              email: data.restaurant.email || user?.email || '',
              phone: data.restaurant.phone || user?.phone || '',
              address: data.restaurant.address || user?.address || '',
              cuisine: data.restaurant.cuisine || '',
              description: data.restaurant.description || '',
              deliveryTime: data.restaurant.deliveryTime || '20-30 min',
              deliveryFee: data.restaurant.deliveryFee || 35,
              openingHours: data.restaurant.openingHours || { open: '08:00', close: '22:00' },
              image: data.restaurant.image || '',
              bannerImage: data.restaurant.bannerImage || '',
              location: data.restaurant.location || {
                type: 'Point',
                coordinates: [0, 0]
              }
            });
            refreshRestaurantData();
            console.log('✅ Restaurant found by owner ID:', currentRestaurantId);
            return currentRestaurantId;
          }
        }
      } catch (e) { 
        console.error('❌ Error fetching restaurant by owner:', e);
      }
    }

    console.log('❌ No restaurant found through any method');
    return null;
  };

  // Fetch orders
  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/orders/restaurant`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders || []);
        } else {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setOrders([]);
    }
  };

  // Fetch menu
  const fetchMenu = async (restaurantId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/products/restaurant/${restaurantId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMenuItems(data.products || []);
        } else {
          setMenuItems([]);
        }
      } else {
        setMenuItems([]);
      }
    } catch (error) {
      console.error('❌ Error fetching menu:', error);
      setMenuItems([]);
    }
  };

  // Load all data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const id = await initializeRestaurantData();
      if (id) {
        await fetchMenu(id);
        await fetchOrders();
      } else {
        setError(new Error('No restaurant data found. Please contact support.'));
      }
    } catch (error) {
      console.error('❌ Error in fetchData:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'restaurant') {
      fetchData();
    }
  }, [user]);

  // Stats
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => ['delivered', 'completed'].includes(o.status)).length,
    todayRevenue: orders
      .filter(o => {
        const orderDate = new Date(o.createdAt).toDateString();
        const today = new Date().toDateString();
        return orderDate === today && ['delivered', 'completed'].includes(o.status);
      })
      .reduce((sum, o) => sum + (o.total || o.totalAmount || 0), 0),
    totalRevenue: orders
      .filter(o => ['delivered', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + (o.total || o.totalAmount || 0), 0)
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₱0';
    return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Add product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!restaurantId) {
      alert('❌ Restaurant not found');
      return;
    }
    
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      const productData = {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        description: newProduct.description?.trim() || '',
        category: newProduct.category,
        restaurant: restaurantId,
        preparationTime: parseInt(newProduct.preparationTime) || 15,
        ingredients: newProduct.ingredients?.trim() || '',
        image: newProduct.image?.trim() || ''
      };

      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('✅ Product added successfully!');
        setShowAddProduct(false);
        setNewProduct({ 
          name: '', price: '', description: '', category: 'main course', 
          preparationTime: '', ingredients: '', image: '' 
        });
        await fetchMenu(restaurantId);
      } else {
        alert(`❌ Failed: ${data.message || 'Error adding product'}`);
      }
    } catch (error) {
      console.error('❌ Error adding product:', error);
      alert('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await fetchData();
        alert(`✅ Order status updated to ${newStatus}`);
      } else {
        alert(`❌ Failed to update status: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      alert('❌ Network error. Please try again.');
    }
  };

  // Update Profile with location
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!restaurantId) {
      alert('❌ Restaurant not found');
      return;
    }
    
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      console.log('📝 Updating restaurant profile with location:', profileData);
      
      const res = await fetch(`${API_URL}/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('✅ Profile updated successfully!');
        setShowProfile(false);
        setRestaurant(data.restaurant);
        refreshRestaurantData();
        if (user.name !== profileData.name) {
          updateUser({ name: profileData.name });
        }
      } else {
        alert(`❌ Failed to update profile: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fix for sample products
  const handleQuickFix = async () => {
    const token = localStorage.getItem('token');
    if (!restaurantId) return;
    
    try {
      const res = await fetch(`${API_URL}/products/quick-fix/${restaurantId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('✅ Sample products added!');
        await fetchMenu(restaurantId);
      } else {
        alert('❌ Quick fix failed');
      }
    } catch (error) {
      console.error('❌ Quick fix error:', error);
    }
  };

  // Map Component for Location Preview
  const LocationMap = ({ coordinates }) => {
    if (!coordinates || coordinates[0] === 0 || coordinates[1] === 0) {
      return (
        <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Map className="mx-auto text-gray-400 mb-2 w-8 h-8" />
            <p className="text-gray-500 text-sm">No location set</p>
          </div>
        </div>
      );
    }

    const [lng, lat] = coordinates;

    return (
      <div className="h-48 bg-gray-100 rounded-lg overflow-hidden relative">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
          style={{ border: 0 }}
          title="Restaurant Location"
        />
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs shadow">
          📍 Your Restaurant
        </div>
        <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-1 py-0.5 rounded text-xs">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            © OSM
          </a>
        </div>
      </div>
    );
  };

  // Earnings array
  const earningsArray = Object.entries(
    orders
      .filter(order => order.status === 'completed' || order.status === 'delivered')
      .reduce((groups, order) => {
        const date = new Date(order.createdAt).toLocaleDateString();
        if (!groups[date]) groups[date] = { revenue: 0, orders: 0 };
        groups[date].revenue += order.total || order.totalAmount || 0;
        groups[date].orders += 1;
        return groups;
      }, {})
  ).map(([date, data]) => ({ date, ...data }))
   .slice(0, 7);

  // Error handling UI
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <div className="space-y-2">
            <button onClick={() => { setError(null); fetchData(); }} className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 block mx-auto">Try Again</button>
            <button onClick={logout} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 block mx-auto">Logout</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Restaurant Data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600">Please login to access the restaurant dashboard.</p>
        </div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="text-yellow-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Restaurant Setup Required</h2>
          <p className="text-gray-600 mb-4">Your restaurant account needs to be set up.</p>
          <div className="space-y-2">
            <button onClick={fetchData} className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 block mx-auto">Retry</button>
            <button onClick={logout} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 block mx-auto">Logout</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Store className="text-white w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Restaurant Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{restaurant.name || 'Your Restaurant'} - {user?.name}</p>
                <p className="text-xs text-gray-400 truncate">Orders: {stats.totalOrders} | Products: {menuItems.length}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button onClick={handleQuickFix} className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Add Products</span>
              </button>
              <button onClick={() => setShowProfile(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button onClick={fetchData} className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button onClick={logout} className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Stats - Responsive */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Today's Revenue</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</p>
            <p className="text-xs text-gray-500">{stats.completedOrders} completed</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            <p className="text-xs text-blue-600">all time</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Pending Orders</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
            <p className="text-xs text-orange-600">need attention</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Menu Items</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{menuItems.length}</p>
            <p className="text-xs text-green-600">available</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
              <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => setShowAddProduct(true)} className="w-full flex items-center space-x-2 bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700 text-sm">
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
                <button onClick={() => setActiveTab('orders')} className="w-full flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm">
                  <Package className="w-4 h-4" />
                  <span>View Orders ({orders.length})</span>
                </button>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
              <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Restaurant Info</h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <p><strong>Name:</strong> {restaurant.name || 'Your Restaurant'}</p>
                <p><strong>Cuisine:</strong> {restaurant.cuisine || 'Not set'}</p>
                <p><strong>Status:</strong> <span className={`ml-1 ${restaurant.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>{restaurant.isApproved ? 'Approved' : 'Pending Approval'}</span></p>
                <p><strong>Address:</strong> {restaurant.address || 'Not set'}</p>
                <p><strong>Phone:</strong> {restaurant.phone || 'Not set'}</p>
                {restaurant.location && restaurant.location.coordinates && 
                 restaurant.location.coordinates[0] !== 0 && (
                  <p><strong>Location:</strong> <span className="text-green-600">✓ Set</span></p>
                )}
                <button 
                  onClick={() => setShowProfile(true)}
                  className="w-full mt-3 flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-xs sm:text-sm"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Tabs - Responsive */}
              <div className="flex border-b overflow-x-auto">
                <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-3 sm:py-4 font-medium text-xs sm:text-base whitespace-nowrap px-2 sm:px-4 ${activeTab === 'dashboard' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600'}`}>📊 Dashboard</button>
                <button onClick={() => setActiveTab('orders')} className={`flex-1 py-3 sm:py-4 font-medium text-xs sm:text-base whitespace-nowrap px-2 sm:px-4 ${activeTab === 'orders' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600'}`}>📦 Orders ({orders.length})</button>
                <button onClick={() => setActiveTab('menu')} className={`flex-1 py-3 sm:py-4 font-medium text-xs sm:text-base whitespace-nowrap px-2 sm:px-4 ${activeTab === 'menu' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600'}`}>🍽️ Menu ({menuItems.length})</button>
                <button onClick={() => setActiveTab('earnings')} className={`flex-1 py-3 sm:py-4 font-medium text-xs sm:text-base whitespace-nowrap px-2 sm:px-4 ${activeTab === 'earnings' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600'}`}>💰 Earnings</button>
              </div>

              <div className="p-4 sm:p-6">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Overview</h2>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Recent Orders</h3>
                      {orders.slice(0, 5).length > 0 ? (
                        orders.slice(0, 5).map((order) => (
                          <div key={order._id} className="border rounded-lg p-3 sm:p-4 mb-2 sm:mb-3">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base truncate">Order #{order.orderId || order._id}</p>
                                <p className="text-xs sm:text-sm text-gray-600 truncate">{order.user?.name || order.customerId?.name || 'Customer'}</p>
                                <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ml-2 ${order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-green-600 font-semibold text-sm sm:text-base">{formatCurrency(order.total || order.totalAmount)}</span>
                              <button onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }} className="text-orange-600 hover:text-orange-700">
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 sm:py-8">
                          <Package className="mx-auto text-gray-300 mb-3 sm:mb-4 w-8 h-8 sm:w-12 sm:h-12" />
                          <p className="text-gray-500 text-sm sm:text-base">No orders yet</p>
                          <p className="text-xs sm:text-sm text-gray-400 mt-2">When customers place orders, they will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">All Orders ({orders.length})</h2>
                    {orders.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <Package className="mx-auto text-gray-300 mb-3 sm:mb-4 w-8 h-8 sm:w-12 sm:h-12" />
                        <p className="text-gray-500 text-sm sm:text-base">No orders yet</p>
                        <div className="mt-4 space-y-2">
                          <button onClick={fetchData} className="bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-orange-700 text-sm block mx-auto">Refresh Data</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {orders.map((order) => (
                          <div key={order._id} className="border rounded-lg p-3 sm:p-4">
                            <div className="flex justify-between items-start mb-2 sm:mb-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Order #{order.orderId || order._id}</h3>
                                <p className="text-xs sm:text-sm text-gray-600 truncate">{order.user?.name || order.customerId?.name || 'Customer'} • {formatDate(order.createdAt)}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ml-2 ${order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-gray-600 truncate">{order.deliveryAddress || 'No address provided'}</p>
                                <p className="text-base sm:text-lg font-bold text-green-600">{formatCurrency(order.total || order.totalAmount)}</p>
                              </div>
                              <div className="flex flex-wrap gap-1 sm:gap-2">
                                <button onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }} className="bg-orange-600 text-white px-2 sm:px-3 py-1 rounded text-xs hover:bg-orange-700">Details</button>
                                {order.status === 'pending' && <button onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')} className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded text-xs hover:bg-blue-700">Accept</button>}
                                {order.status === 'confirmed' && <button onClick={() => handleUpdateOrderStatus(order._id, 'preparing')} className="bg-purple-600 text-white px-2 sm:px-3 py-1 rounded text-xs hover:bg-purple-700">Start Preparing</button>}
                                {order.status === 'preparing' && <button onClick={() => handleUpdateOrderStatus(order._id, 'ready')} className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded text-xs hover:bg-green-700">Mark Ready</button>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Menu Tab */}
                {activeTab === 'menu' && (
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Menu Items ({menuItems.length})</h2>
                      <button onClick={() => setShowAddProduct(true)} className="flex items-center space-x-2 bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 text-sm w-full sm:w-auto justify-center">
                        <Plus className="w-4 h-4" />
                        <span>Add Item</span>
                      </button>
                    </div>
                    {menuItems.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <Package className="mx-auto text-gray-300 mb-3 sm:mb-4 w-8 h-8 sm:w-12 sm:h-12" />
                        <p className="text-gray-500 text-sm sm:text-base">No menu items yet</p>
                        <div className="mt-4 space-y-2">
                          <button onClick={() => setShowAddProduct(true)} className="bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-orange-700 text-sm block mx-auto">Add Your First Item</button>
                          <button onClick={handleQuickFix} className="bg-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-purple-700 text-sm block mx-auto">Add Sample Products</button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {menuItems.map((item) => (
                          <div key={item._id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0" />
                              ) : (
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Image className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.name}</h3>
                                  <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ml-2 ${item.isAvailable !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 capitalize truncate">{item.category}</p>
                              </div>
                            </div>
                            {item.description && <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>}
                            {item.ingredients && <p className="text-xs text-gray-500 mb-2 sm:mb-3 line-clamp-1">Ingredients: {item.ingredients}</p>}
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-base sm:text-lg font-bold text-green-600">{formatCurrency(item.price)}</p>
                                {item.preparationTime && <p className="text-xs text-gray-500">{item.preparationTime} min prep</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Earnings Tab */}
                {activeTab === 'earnings' && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Earnings Overview</h2>
                    {earningsArray.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <DollarSign className="mx-auto text-gray-300 mb-3 sm:mb-4 w-8 h-8 sm:w-12 sm:h-12" />
                        <p className="text-gray-500 text-sm sm:text-base">No earnings data available</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-2">Complete some orders to see earnings data</p>
                      </div>
                    ) : (
                      <div className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          {earningsArray.map((earning, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                              <p className="text-xs sm:text-sm font-medium text-gray-600">{earning.date}</p>
                              <p className="text-lg sm:text-xl font-bold text-gray-900">{formatCurrency(earning.revenue)}</p>
                              <p className="text-xs text-gray-500">{earning.orders} orders</p>
                            </div>
                          ))}
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                          <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">💰 Total Revenue</h4>
                          <p className="text-xl sm:text-2xl font-bold text-blue-900">{formatCurrency(stats.totalRevenue)}</p>
                          <p className="text-xs sm:text-sm text-blue-700">From {stats.completedOrders} completed orders</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-lg font-bold text-gray-900">Add Menu Item</h3>
                <button onClick={() => setShowAddProduct(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image URL</label>
                  <input type="url" value={newProduct.image} onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" placeholder="https://example.com/image.jpg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" placeholder="e.g., Chicken Burger" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input type="number" required value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" placeholder="₱ 0.00" step="0.01" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                    <option value="main course">Main Course</option>
                    <option value="appetizer">Appetizer</option>
                    <option value="dessert">Dessert</option>
                    <option value="beverage">Beverage</option>
                    <option value="side dish">Side Dish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (minutes)</label>
                  <input type="number" value={newProduct.preparationTime} onChange={(e) => setNewProduct({...newProduct, preparationTime: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" placeholder="15" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
                  <textarea value={newProduct.ingredients} onChange={(e) => setNewProduct({...newProduct, ingredients: e.target.value})} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" placeholder="List main ingredients..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" placeholder="Describe your menu item..." />
                </div>
                <div className="flex space-x-2 sm:space-x-3 pt-3 sm:pt-4">
                  <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm">
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Adding...' : 'Add Item'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Profile Update Modal with GPS Location */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Update Restaurant Profile</h3>
                <button onClick={() => setShowProfile(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={profileData.name} 
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                        placeholder="Your Restaurant Name" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type *</label>
                      <input 
                        type="text" 
                        required 
                        value={profileData.cuisine} 
                        onChange={(e) => setProfileData({...profileData, cuisine: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                        placeholder="e.g., Filipino, Chinese, Italian" 
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input 
                        type="email" 
                        required 
                        value={profileData.email} 
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                        placeholder="restaurant@example.com" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input 
                        type="tel" 
                        required 
                        value={profileData.phone} 
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                        placeholder="+63 XXX XXX XXXX" 
                      />
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <textarea 
                      required 
                      value={profileData.address} 
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})} 
                      rows="2" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                      placeholder="Full restaurant address" 
                    />
                  </div>
                </div>

                {/* GPS Location Section */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">📍 Restaurant Location</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-3">
                      <div>
                        <p className="text-blue-800 font-medium text-sm sm:text-base">GPS Location</p>
                        <p className="text-blue-700 text-xs sm:text-sm">
                          Set your exact location for better delivery accuracy
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={locationLoading}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm w-full sm:w-auto justify-center"
                      >
                        {locationLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Crosshair className="w-4 h-4" />
                        )}
                        <span>{locationLoading ? 'Getting Location...' : 'Use Current Location'}</span>
                      </button>
                    </div>
                    
                    {/* Location Coordinates Display */}
                    {profileData.location && profileData.location.coordinates && 
                     profileData.location.coordinates[0] !== 0 && (
                      <div className="bg-white rounded p-2 sm:p-3 border">
                        <p className="text-sm font-medium text-gray-700 mb-2">Current Coordinates:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Longitude:</span>
                            <p className="font-mono">{profileData.location.coordinates[0].toFixed(6)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Latitude:</span>
                            <p className="font-mono">{profileData.location.coordinates[1].toFixed(6)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Map Preview */}
                  <LocationMap coordinates={profileData.location?.coordinates} />
                  <p className="text-xs text-gray-500 mt-2">
                    This map shows your restaurant's location for delivery purposes
                  </p>
                </div>

                {/* Business Details */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Business Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
                      <input 
                        type="text" 
                        value={profileData.deliveryTime} 
                        onChange={(e) => setProfileData({...profileData, deliveryTime: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                        placeholder="e.g., 20-30 min" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (₱)</label>
                      <input 
                        type="number" 
                        value={profileData.deliveryFee} 
                        onChange={(e) => setProfileData({...profileData, deliveryFee: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                        placeholder="35" 
                        step="0.01" 
                        min="0" 
                      />
                    </div>
                  </div>
                </div>

                {/* Opening Hours */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Opening Hours</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Open Time</label>
                      <input 
                        type="time" 
                        value={profileData.openingHours.open} 
                        onChange={(e) => setProfileData({
                          ...profileData, 
                          openingHours: {...profileData.openingHours, open: e.target.value}
                        })} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Close Time</label>
                      <input 
                        type="time" 
                        value={profileData.openingHours.close} 
                        onChange={(e) => setProfileData({
                          ...profileData, 
                          openingHours: {...profileData.openingHours, close: e.target.value}
                        })} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                      />
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Restaurant Images</h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
                      <input 
                        type="url" 
                        value={profileData.image} 
                        onChange={(e) => setProfileData({...profileData, image: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                        placeholder="https://example.com/profile-image.jpg" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL</label>
                      <input 
                        type="url" 
                        value={profileData.bannerImage} 
                        onChange={(e) => setProfileData({...profileData, bannerImage: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                        placeholder="https://example.com/banner-image.jpg" 
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={profileData.description} 
                    onChange={(e) => setProfileData({...profileData, description: e.target.value})} 
                    rows="3" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                    placeholder="Describe your restaurant, specialities, etc..." 
                  />
                </div>

                <div className="flex space-x-2 sm:space-x-3 pt-3 sm:pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowProfile(false)} 
                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Updating...' : 'Update Profile'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Order Details</h3>
                <button onClick={() => setShowOrderDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Order Information</h4>
                  <p className="text-sm"><strong>Order ID:</strong> {selectedOrder.orderId || selectedOrder._id}</p>
                  <p className="text-sm"><strong>Status:</strong> <span className={`ml-2 px-2 py-1 text-xs rounded ${selectedOrder.status === 'delivered' || selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' : selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{selectedOrder.status}</span></p>
                  <p className="text-sm"><strong>Total Amount:</strong> {formatCurrency(selectedOrder.total || selectedOrder.totalAmount)}</p>
                  <p className="text-sm"><strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Customer Information</h4>
                  <p className="text-sm"><strong>Name:</strong> {selectedOrder.user?.name || selectedOrder.customerId?.name || 'Customer'}</p>
                  <p className="text-sm"><strong>Phone:</strong> {selectedOrder.user?.phone || selectedOrder.customerId?.phone || 'No phone'}</p>
                  <p className="text-sm"><strong>Address:</strong> {selectedOrder.deliveryAddress || 'No address'}</p>
                </div>
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Order Items</h4>
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between border-b py-2 text-sm">
                        <div>
                          <span>{item.quantity}x {item.product?.name || item.productName}</span>
                          {item.product?.category && <span className="text-xs text-gray-500 ml-2">({item.product.category})</span>}
                        </div>
                        <span>{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-2 mt-2 font-semibold text-sm">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedOrder.total || selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
                  {selectedOrder.status === 'pending' && <button onClick={() => { handleUpdateOrderStatus(selectedOrder._id, 'confirmed'); setShowOrderDetails(false); }} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm">Accept Order</button>}
                  {selectedOrder.status === 'confirmed' && <button onClick={() => { handleUpdateOrderStatus(selectedOrder._id, 'preparing'); setShowOrderDetails(false); }} className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 text-sm">Start Preparing</button>}
                  {selectedOrder.status === 'preparing' && <button onClick={() => { handleUpdateOrderStatus(selectedOrder._id, 'ready'); setShowOrderDetails(false); }} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm">Mark Ready</button>}
                  {(selectedOrder.user?.phone || selectedOrder.customerId?.phone) && <a href={`tel:${selectedOrder.user?.phone || selectedOrder.customerId?.phone}`} className="px-4 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 flex items-center justify-center text-sm"><Phone className="w-4 h-4" /></a>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;