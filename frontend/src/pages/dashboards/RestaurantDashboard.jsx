import React, { useState, useEffect } from 'react';
import {
  Store, Plus, Package, DollarSign, Clock, Star, Eye, X, Save,
  LogOut, RefreshCw, Image, MapPin, Navigation, ChefHat,
  CheckCircle, Users, TrendingUp, Phone, MessageCircle, Settings,
  User, Edit, Camera, Upload, Map, Crosshair, Trash2, 
  ToggleLeft, ToggleRight, BarChart3, Calendar, FileText, 
  Truck, UserCheck, Ban, Filter, Download, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ✅ CRITICAL FIX: API_URL must include /api path
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

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

  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [showRiderAssignment, setShowRiderAssignment] = useState(false);
  const [selectedOrderForRider, setSelectedOrderForRider] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('today');
  const [showReports, setShowReports] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    cuisine: '',
    description: '',
    deliveryTime: '',
    deliveryFee: '',
    openingHours: { open: '08:00', close: '22:00' },
    image: '',
    bannerImage: '',
    location: { type: 'Point', coordinates: [0, 0] }
  });

  // ✅ CRITICAL FIX: Centralized token getter with logging
  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ NO TOKEN FOUND in localStorage!');
      return null;
    }
    return token;
  };

  const showConfirmation = (message, onConfirm) => {
    setConfirmMessage(message);
    setConfirmAction(() => onConfirm);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (confirmAction) confirmAction();
    setShowConfirmDialog(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          setProfileData(prev => ({
            ...prev,
            location: { type: 'Point', coordinates: [longitude, latitude] }
          }));
          console.log('📍 Location captured:', { lat: latitude, lng: longitude });
          setLocationLoading(false);
        },
        (error) => {
          console.error('❌ Location error:', error);
          setLocationLoading(false);
          alert('Unable to get location. Please enable GPS.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      alert('Geolocation not supported.');
      setLocationLoading(false);
    }
  };

  // ✅ FIXED: Initialize with proper logging
  const initializeRestaurantData = async () => {
    const token = getToken();
    let currentRestaurantId = getRestaurantId();
    let restaurantData = getRestaurantData();

    console.log('🏪 Initializing...');
    console.log('   Context restaurantId:', currentRestaurantId);
    console.log('   Context restaurantData:', restaurantData ? 'exists' : 'null');

    if (currentRestaurantId && restaurantData) {
      setRestaurantId(currentRestaurantId);
      setRestaurant(restaurantData);
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
        location: restaurantData.location || { type: 'Point', coordinates: [0, 0] }
      });
      return currentRestaurantId;
    }

    if (user?._id) {
      try {
        console.log('🔄 Fetching restaurant by owner:', user._id);
        const res = await fetch(`${API_URL}/restaurants/owner/${user._id}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        console.log('📡 Restaurant fetch status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('📡 Restaurant data:', data);
          
          if (data.success && data.restaurant) {
            currentRestaurantId = data.restaurant._id;
            setRestaurantId(currentRestaurantId);
            setRestaurant(data.restaurant);
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
              location: data.restaurant.location || { type: 'Point', coordinates: [0, 0] }
            });
            refreshRestaurantData();
            return currentRestaurantId;
          }
        } else {
          const errText = await res.text();
          console.error('❌ Restaurant fetch failed:', res.status, errText);
        }
      } catch (e) {
        console.error('❌ Error fetching restaurant:', e);
      }
    }

    console.error('❌ No restaurant found');
    return null;
  };

  // ✅ FIXED: Fetch orders with proper error handling
  const fetchOrders = async () => {
    const token = getToken();
    if (!token) return;

    try {
      console.log('📦 Fetching orders...');
      const res = await fetch(`${API_URL}/orders/restaurant`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      console.log('📡 Orders status:', res.status);
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('❌ Invalid JSON from orders:', text.substring(0, 200));
        setOrders([]);
        return;
      }

      if (res.ok && data.success) {
        setOrders(data.orders || []);
        console.log('✅ Orders loaded:', data.orders?.length || 0);
      } else {
        console.error('❌ Orders fetch failed:', data.message || 'Unknown error');
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setOrders([]);
    }
  };

  // ✅ FIXED: Fetch menu with comprehensive logging
  const fetchMenu = async (restaurantId) => {
    const token = getToken();
    if (!token || !restaurantId) {
      console.error('❌ Missing token or restaurantId');
      return;
    }

    try {
      console.log('🍽️ Fetching menu for:', restaurantId);
      const url = `${API_URL}/products/restaurant/${restaurantId}`;
      console.log('🔗 URL:', url);

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      console.log('📡 Products status:', res.status);
      
      const text = await res.text();
      console.log('📡 Raw response:', text.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('❌ Invalid JSON:', e);
        setMenuItems([]);
        return;
      }

      if (res.ok && data.success) {
        setMenuItems(data.products || []);
        console.log('✅ Products loaded:', data.products?.length || 0);
      } else {
        console.error('❌ Products fetch failed:', data.message);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('❌ Error fetching menu:', error);
      setMenuItems([]);
    }
  };

  // ✅ FIXED: Fetch riders
  const fetchAvailableRiders = async () => {
    const token = getToken();
    if (!token) return;

    try {
      console.log('🚴 Fetching riders...');
      const res = await fetch(`${API_URL}/riders/active`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAvailableRiders(data.riders || []);
        console.log('✅ Riders loaded:', data.riders?.length || 0);
      } else {
        setAvailableRiders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching riders:', error);
      setAvailableRiders([]);
    }
  };

  // ✅ FIXED: Main data fetch with sequential loading
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const id = await initializeRestaurantData();
      if (id) {
        await fetchMenu(id);
        await fetchOrders();
        await fetchAvailableRiders();
      } else {
        setError(new Error('No restaurant found. Please setup your restaurant.'));
      }
    } catch (error) {
      console.error('❌ fetchData error:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'restaurant') {
      fetchData();
    }
  }, [user]);

  // Stats calculation
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

  // ✅ FIXED: Add product (no restaurant in body - from auth)
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !restaurantId) {
      alert('❌ Authentication error');
      return;
    }
    
    setLoading(true);
    
    try {
      const productData = {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        description: newProduct.description?.trim() || '',
        category: newProduct.category,
        preparationTime: parseInt(newProduct.preparationTime) || 15,
        ingredients: newProduct.ingredients?.trim() || '',
        image: newProduct.image?.trim() || ''
        // ❌ DON'T send restaurant - backend gets from auth token!
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
      
      if (res.ok && data.success) {
        alert('✅ Product added!');
        setShowAddProduct(false);
        setNewProduct({ name: '', price: '', description: '', category: 'main course', preparationTime: '', ingredients: '', image: '' });
        await fetchMenu(restaurantId);
      } else {
        alert(`❌ Failed: ${data.message}`);
      }
    } catch (error) {
      alert('❌ Network error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Edit product
  const handleEditProduct = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !editingProduct) return;
    
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingProduct.name.trim(),
          price: parseFloat(editingProduct.price),
          description: editingProduct.description?.trim() || '',
          category: editingProduct.category,
          preparationTime: parseInt(editingProduct.preparationTime) || 15,
          ingredients: editingProduct.ingredients?.trim() || '',
          image: editingProduct.image?.trim() || '',
          isAvailable: editingProduct.isAvailable
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert('✅ Product updated!');
        setShowEditProduct(false);
        setEditingProduct(null);
        await fetchMenu(restaurantId);
      } else {
        alert(`❌ Failed: ${data.message}`);
      }
    } catch (error) {
      alert('❌ Network error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Delete product
  const handleDeleteProduct = async (productId) => {
    const token = getToken();
    if (!token) return;

    showConfirmation('Delete this product?', async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products/${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
          alert('✅ Deleted!');
          await fetchMenu(restaurantId);
        } else {
          alert(`❌ Failed: ${data.message}`);
        }
      } catch (error) {
        alert('❌ Network error');
      } finally {
        setLoading(false);
      }
    });
  };

  // ✅ FIXED: Toggle availability
  const handleToggleAvailability = async (product) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: !product.isAvailable })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        await fetchMenu(restaurantId);
      } else {
        alert(`❌ Failed: ${data.message}`);
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  // ✅ FIXED: Update order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const token = getToken();
    if (!token) return;

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
      
      if (res.ok && data.success) {
        await fetchData();
        alert(`✅ Status: ${newStatus}`);
      } else {
        alert(`❌ Failed: ${data.message}`);
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  // ✅ FIXED: Reject order
  const handleRejectOrder = async (orderId) => {
    const token = getToken();
    if (!token) return;

    showConfirmation('Reject this order?', async () => {
      try {
        const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'cancelled' })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
          await fetchData();
          alert('✅ Order rejected');
          setShowOrderDetails(false);
        } else {
          alert(`❌ Failed: ${data.message}`);
        }
      } catch (error) {
        alert('❌ Network error');
      }
    });
  };

  // ✅ FIXED: Assign rider
  const handleAssignRider = async (orderId, riderId) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/assign-rider`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ riderId })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        await fetchData();
        setShowRiderAssignment(false);
        setSelectedOrderForRider(null);
        alert('✅ Rider assigned!');
      } else {
        alert(`❌ Failed: ${data.message}`);
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  // ✅ FIXED: Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !restaurantId) {
      alert('❌ Authentication error');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert('✅ Profile updated!');
        setShowProfile(false);
        setRestaurant(data.restaurant);
        refreshRestaurantData();
        if (user.name !== profileData.name) {
          updateUser({ name: profileData.name });
        }
      } else {
        alert(`❌ Failed: ${data.message}`);
      }
    } catch (error) {
      alert('❌ Network error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Quick fix with auth
  const handleQuickFix = async () => {
    const token = getToken();
    if (!token || !restaurantId) return;
    
    try {
      const res = await fetch(`${API_URL}/products/quick-fix/${restaurantId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert(`✅ ${data.message}`);
        await fetchMenu(restaurantId);
      } else {
        alert('❌ Quick fix failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      alert('❌ Quick fix error');
    }
  };

  // Generate sales report
  const generateSalesReport = () => {
    const now = new Date();
    let startDate, endDate;

    switch (reportPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      default:
        startDate = new Date(0);
        endDate = new Date();
    }

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate && 
             ['delivered', 'completed'].includes(order.status);
    });

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || order.totalAmount || 0), 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const categoryBreakdown = {};
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        const category = item.product?.category || 'uncategorized';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { revenue: 0, orders: 0 };
        }
        categoryBreakdown[category].revenue += item.price * item.quantity;
        categoryBreakdown[category].orders += 1;
      });
    });

    return {
      period: reportPeriod,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      categoryBreakdown,
      orders: filteredOrders,
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString()
    };
  };

  // Export CSV
  const exportReportToCSV = (report) => {
    const headers = ['Date', 'Order ID', 'Customer', 'Items', 'Total', 'Status'];
    const csvData = [
      headers,
      ...report.orders.map(order => [
        new Date(order.createdAt).toLocaleDateString(),
        order.orderId || order._id,
        order.user?.name || 'Customer',
        order.items?.map(item => `${item.quantity}x ${item.product?.name}`).join('; ') || '',
        order.total || order.totalAmount,
        order.status
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Location Map Component
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
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
          title="Location"
        />
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs">📍 Restaurant</div>
      </div>
    );
  };

  // Earnings data
  const earningsArray = Object.entries(
    orders
      .filter(order => ['completed', 'delivered'].includes(order.status))
      .reduce((groups, order) => {
        const date = new Date(order.createdAt).toLocaleDateString();
        if (!groups[date]) groups[date] = { revenue: 0, orders: 0 };
        groups[date].revenue += order.total || order.totalAmount || 0;
        groups[date].orders += 1;
        return groups;
      }, {})
  ).map(([date, data]) => ({ date, ...data })).slice(0, 7);

  const salesReport = generateSalesReport();

  // Loading state
  if (loading && !menuItems.length && !orders.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Restaurant Data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-4 text-sm">{error.message}</p>
          <button onClick={fetchData} className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg mb-2">Retry</button>
          <button onClick={logout} className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg">Logout</button>
        </div>
      </div>
    );
  }

  // No user
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Not Logged In</h2>
          <p className="text-gray-600">Please login to continue.</p>
        </div>
      </div>
    );
  }

  // No restaurant
  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="text-yellow-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Setup Required</h2>
          <p className="text-gray-600 mb-4 text-sm">Restaurant not found.</p>
          <button onClick={fetchData} className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg mb-2">Retry</button>
          <button onClick={logout} className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg">Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Store className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{restaurant.name || 'Restaurant'}</h1>
                <p className="text-xs text-gray-500">Orders: {orders.length} | Products: {menuItems.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowProfile(true)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                <User className="w-4 h-4 mr-1" /> Profile
              </button>
              <button onClick={fetchData} className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                <RefreshCw className="w-4 h-4 mr-1" /> Refresh
              </button>
              <button onClick={logout} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Debug Banner - Remove after fixing */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-4 text-xs font-mono">
          DEBUG: ID={restaurantId} | Products={menuItems.length} | Orders={orders.length} | API={API_URL}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-600">Today's Revenue</p>
            <p className="text-xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-600">Total Orders</p>
            <p className="text-xl font-bold">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-600">Pending</p>
            <p className="text-xl font-bold text-orange-600">{stats.pendingOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-600">Menu Items</p>
            <p className="text-xl font-bold text-green-600">{menuItems.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => setShowAddProduct(true)} className="w-full bg-orange-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                  <Plus className="w-4 h-4 mr-2" /> Add Product
                </button>
                <button onClick={() => setActiveTab('orders')} className="w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                  <Package className="w-4 h-4 mr-2" /> Orders ({orders.length})
                </button>
                <button onClick={() => setShowReports(true)} className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" /> Reports
                </button>
                <button onClick={handleQuickFix} className="w-full bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                  <Plus className="w-4 h-4 mr-2" /> Sample Products
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold mb-3">Restaurant Info</h3>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {restaurant.name}</p>
                <p><strong>Cuisine:</strong> {restaurant.cuisine || 'Not set'}</p>
                <p><strong>Status:</strong> <span className={restaurant.isApproved ? 'text-green-600' : 'text-yellow-600'}>{restaurant.isApproved ? 'Approved' : 'Pending'}</span></p>
                <p><strong>Address:</strong> {restaurant.address || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Tabs */}
              <div className="flex border-b overflow-x-auto">
                {['dashboard', 'orders', 'menu', 'earnings'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 text-sm font-medium whitespace-nowrap ${activeTab === tab ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600'}`}
                  >
                    {tab === 'dashboard' && '📊 Dashboard'}
                    {tab === 'orders' && `📦 Orders (${orders.length})`}
                    {tab === 'menu' && `🍽️ Menu (${menuItems.length})`}
                    {tab === 'earnings' && '💰 Earnings'}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Overview</h2>
                    {orders.slice(0, 5).length > 0 ? (
                      <div className="space-y-3">
                        {orders.slice(0, 5).map(order => (
                          <div key={order._id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">#{order.orderId || order._id}</p>
                                <p className="text-sm text-gray-600">{order.user?.name || 'Customer'}</p>
                                <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>{order.status}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-green-600 font-semibold">{formatCurrency(order.total || order.totalAmount)}</span>
                              <button onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }} className="text-orange-600 text-sm flex items-center">
                                <Eye className="w-4 h-4 mr-1" /> View
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="mx-auto w-12 h-12 mb-4 text-gray-300" />
                        <p>No orders yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">All Orders ({orders.length})</h2>
                      <button onClick={fetchData} className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                        <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                      </button>
                    </div>
                    {orders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="mx-auto w-12 h-12 mb-4 text-gray-300" />
                        <p>No orders yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map(order => (
                          <div key={order._id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">#{order.orderId || order._id}</h3>
                                <p className="text-sm text-gray-600">{order.user?.name || 'Customer'} • {formatDate(order.createdAt)}</p>
                                {order.rider && <p className="text-sm text-blue-600">Rider: {order.rider.name}</p>}
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>{order.status}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }} className="bg-orange-600 text-white px-3 py-1 rounded text-sm">Details</button>
                              {order.status === 'pending' && (
                                <>
                                  <button onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Accept</button>
                                  <button onClick={() => handleRejectOrder(order._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                                </>
                              )}
                              {order.status === 'confirmed' && (
                                <>
                                  <button onClick={() => handleUpdateOrderStatus(order._id, 'preparing')} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">Preparing</button>
                                  <button onClick={() => { setSelectedOrderForRider(order); setShowRiderAssignment(true); }} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">Assign Rider</button>
                                </>
                              )}
                              {order.status === 'preparing' && (
                                <button onClick={() => handleUpdateOrderStatus(order._id, 'ready')} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Mark Ready</button>
                              )}
                              {order.status === 'ready' && !order.rider && (
                                <button onClick={() => { setSelectedOrderForRider(order); setShowRiderAssignment(true); }} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">Assign Rider</button>
                              )}
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
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Menu Items ({menuItems.length})</h2>
                      <div className="flex gap-2">
                        <button onClick={() => setShowAddProduct(true)} className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </button>
                        <button onClick={handleQuickFix} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                          <Plus className="w-4 h-4 mr-1" /> Samples
                        </button>
                      </div>
                    </div>
                    {menuItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="mx-auto w-12 h-12 mb-4 text-gray-300" />
                        <p>No menu items</p>
                        <button onClick={handleQuickFix} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">Add Sample Products</button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {menuItems.map(item => (
                          <div key={item._id} className="border rounded-lg p-4">
                            <div className="flex items-start space-x-3 mb-2">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Image className="text-gray-400 w-6 h-6" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-semibold">{item.name}</h3>
                                  <button onClick={() => handleToggleAvailability(item)} className={`text-xs px-2 py-1 rounded ${item.isAvailable !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                                  </button>
                                </div>
                                <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-lg font-bold text-green-600">{formatCurrency(item.price)}</p>
                                {item.preparationTime && <p className="text-xs text-gray-500">{item.preparationTime} min</p>}
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => { setEditingProduct(item); setShowEditProduct(true); }} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Edit</button>
                                <button onClick={() => handleDeleteProduct(item._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Delete</button>
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
                    <h2 className="text-xl font-bold mb-4">Earnings</h2>
                    {earningsArray.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <DollarSign className="mx-auto w-12 h-12 mb-4 text-gray-300" />
                        <p>No earnings data</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {earningsArray.map((earning, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-4">
                              <p className="text-sm text-gray-600">{earning.date}</p>
                              <p className="text-xl font-bold">{formatCurrency(earning.revenue)}</p>
                              <p className="text-xs text-gray-500">{earning.orders} orders</p>
                            </div>
                          ))}
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900">Total Revenue</h4>
                          <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.totalRevenue)}</p>
                          <p className="text-sm text-blue-700">{stats.completedOrders} completed orders</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Add Product</h3>
                <button onClick={() => setShowAddProduct(false)} className="text-gray-500"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input type="url" value={newProduct.image} onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <input type="number" required value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" step="0.01" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="main course">Main Course</option>
                    <option value="appetizer">Appetizer</option>
                    <option value="dessert">Dessert</option>
                    <option value="beverage">Beverage</option>
                    <option value="side dish">Side Dish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prep Time (min)</label>
                  <input type="number" value={newProduct.preparationTime} onChange={(e) => setNewProduct({...newProduct, preparationTime: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} rows="2" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm disabled:opacity-50">
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Edit Product</h3>
                <button onClick={() => { setShowEditProduct(false); setEditingProduct(null); }} className="text-gray-500"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleEditProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input type="url" value={editingProduct.image} onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input type="text" required value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <input type="number" required value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" step="0.01" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="main course">Main Course</option>
                    <option value="appetizer">Appetizer</option>
                    <option value="dessert">Dessert</option>
                    <option value="beverage">Beverage</option>
                    <option value="side dish">Side Dish</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isAvailable" checked={editingProduct.isAvailable !== false} onChange={(e) => setEditingProduct({...editingProduct, isAvailable: e.target.checked})} className="w-4 h-4" />
                  <label htmlFor="isAvailable" className="text-sm">Available for ordering</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowEditProduct(false); setEditingProduct(null); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReports && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Sales Reports</h3>
                <button onClick={() => setShowReports(false)} className="text-gray-500"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex gap-2 mb-4">
                {['today', 'week', 'month', 'all'].map(period => (
                  <button key={period} onClick={() => setReportPeriod(period)} className={`px-4 py-2 rounded-lg text-sm ${reportPeriod === period ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              {salesReport.totalOrders === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="mx-auto w-12 h-12 mb-4 text-gray-300" />
                  <p>No sales data for this period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-700">Revenue</p>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(salesReport.totalRevenue)}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-700">Orders</p>
                      <p className="text-2xl font-bold text-green-900">{salesReport.totalOrders}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-700">Avg Order</p>
                      <p className="text-2xl font-bold text-purple-900">{formatCurrency(salesReport.averageOrderValue)}</p>
                    </div>
                  </div>
                  <button onClick={() => exportReportToCSV(salesReport)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rider Assignment Modal */}
      {showRiderAssignment && selectedOrderForRider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Assign Rider</h3>
                <button onClick={() => { setShowRiderAssignment(false); setSelectedOrderForRider(null); }} className="text-gray-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm">
                <p className="font-medium">Order #{selectedOrderForRider.orderId || selectedOrderForRider._id}</p>
                <p>Customer: {selectedOrderForRider.user?.name || 'Customer'}</p>
              </div>
              {availableRiders.filter(r => r.status === 'online').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Truck className="mx-auto w-12 h-12 mb-4 text-gray-300" />
                  <p>No riders available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableRiders.filter(r => r.status === 'online').map(rider => (
                    <div key={rider._id} className="border rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{rider.name}</p>
                        <p className="text-sm text-gray-600">{rider.phone}</p>
                      </div>
                      <button onClick={() => handleAssignRider(selectedOrderForRider._id, rider._id)} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm">Assign</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Edit Profile</h3>
                <button onClick={() => setShowProfile(false)} className="text-gray-500"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input type="text" required value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cuisine *</label>
                    <input type="text" required value={profileData.cuisine} onChange={(e) => setProfileData({...profileData, cuisine: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input type="email" required value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <input type="tel" required value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address *</label>
                  <textarea required value={profileData.address} onChange={(e) => setProfileData({...profileData, address: e.target.value})} rows="2" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-medium text-blue-900">GPS Location</p>
                      <p className="text-sm text-blue-700">Set exact location for delivery</p>
                    </div>
                    <button type="button" onClick={getCurrentLocation} disabled={locationLoading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center disabled:opacity-50">
                      {locationLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Crosshair className="w-4 h-4 mr-2" />}
                      {locationLoading ? 'Getting...' : 'Get Location'}
                    </button>
                  </div>
                  {profileData.location?.coordinates?.[0] !== 0 && (
                    <div className="bg-white p-2 rounded text-xs font-mono">
                      Lat: {profileData.location.coordinates[1]?.toFixed(6)}, Lng: {profileData.location.coordinates[0]?.toFixed(6)}
                    </div>
                  )}
                  <LocationMap coordinates={profileData.location?.coordinates} />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowProfile(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Order Details</h3>
                <button onClick={() => setShowOrderDetails(false)} className="text-gray-500"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Order ID</p>
                    <p className="font-medium">{selectedOrder.orderId || selectedOrder._id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>{selectedOrder.status}</span>
                  </div>
                  <div>
                    <p className="text-gray-600">Customer</p>
                    <p className="font-medium">{selectedOrder.user?.name || 'Customer'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total</p>
                    <p className="font-bold text-green-600">{formatCurrency(selectedOrder.total || selectedOrder.totalAmount)}</p>
                  </div>
                </div>
                {selectedOrder.items?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Items</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm border-b pb-2">
                          <span>{item.quantity}x {item.product?.name || item.productName}</span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-4">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button onClick={() => { handleUpdateOrderStatus(selectedOrder._id, 'confirmed'); setShowOrderDetails(false); }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Accept</button>
                      <button onClick={() => { handleRejectOrder(selectedOrder._id); setShowOrderDetails(false); }} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm">Reject</button>
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <>
                      <button onClick={() => { handleUpdateOrderStatus(selectedOrder._id, 'preparing'); setShowOrderDetails(false); }} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm">Preparing</button>
                      <button onClick={() => { setSelectedOrderForRider(selectedOrder); setShowRiderAssignment(true); setShowOrderDetails(false); }} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm">Assign Rider</button>
                    </>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <button onClick={() => { handleUpdateOrderStatus(selectedOrder._id, 'ready'); setShowOrderDetails(false); }} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm">Mark Ready</button>
                  )}
                  {selectedOrder.user?.phone && (
                    <a href={`tel:${selectedOrder.user.phone}`} className="flex items-center justify-center bg-gray-600 text-white py-2 rounded-lg text-sm">
                      <Phone className="w-4 h-4 mr-2" /> Call Customer
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-yellow-600 w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Confirm</h3>
            </div>
            <p className="text-gray-600 mb-6">{confirmMessage}</p>
            <div className="flex gap-3">
              <button onClick={handleCancelConfirm} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;