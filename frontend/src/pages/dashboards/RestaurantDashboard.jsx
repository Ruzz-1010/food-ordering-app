import React, { useState, useEffect } from 'react';
import {
  Store, Plus, Package, DollarSign, Clock, Star, Eye, X, Save,
  LogOut, RefreshCw, Image, MapPin, Navigation, ChefHat,
  CheckCircle, Users, TrendingUp, Phone, MessageCircle, Settings,
  User, Edit, Camera, Upload, Map, Crosshair, Trash2, 
  ToggleLeft, ToggleRight, BarChart3, Calendar, FileText, 
  Truck, UserCheck, Ban, Filter, Download, AlertTriangle,
  TrendingUp as TrendingUpIcon, Award, CreditCard, ShoppingBag,
  Heart, Share2, MoreVertical, Bell, Search, Menu, Grid,
  List, ChevronDown, ChevronRight, Home, PieChart, Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurant, setRestaurant] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', description: '', category: 'main course', 
    preparationTime: '15', ingredients: '', image: ''
  });

  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [showRiderAssignment, setShowRiderAssignment] = useState(false);
  const [selectedOrderForRider, setSelectedOrderForRider] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('today');
  const [showReports, setShowReports] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

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

  // Fix user object on mount
  useEffect(() => {
    if (user && user.restaurantId && !user.restaurant) {
      console.log('🔄 Fixing user object - adding restaurant field');
      const fixedUser = { ...user, restaurant: user.restaurantId };
      updateUser(fixedUser);
      
      // Also update localStorage directly
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        userData.restaurant = userData.restaurantId;
        localStorage.setItem('user', JSON.stringify(userData));
      }
    }
  }, [user]);

  // Get token helper
  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return null;
    }
    return token;
  };

  // Fetch with auth helper
  const fetchWithAuth = async (url, options = {}) => {
    const token = getToken();
    if (!token) throw new Error('No authentication token');

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    if (response.status === 401) {
      logout();
      throw new Error('Session expired');
    }

    return response;
  };

  // Debug auth status
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    console.log('🔐 Auth Check:');
    console.log('Token:', token ? '✅ Present' : '❌ Missing');
    console.log('User:', user);
    console.log('Restaurant ID from user:', user?.restaurantId);
    console.log('Restaurant from user:', user?.restaurant);
    console.log('Restaurant ID from state:', restaurantId);
    
    if (token) {
      try {
        const res = await fetch(`${API_URL}/products/test-auth`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        console.log('Auth test response:', data);
        setDebugInfo(data);
      } catch (error) {
        console.error('Auth test failed:', error);
      }
    }
  };

  // Initialize data
  const initializeRestaurantData = async () => {
    try {
      let currentRestaurantId = getRestaurantId();
      let restaurantData = getRestaurantData();

      console.log('Initializing with:', { currentRestaurantId, restaurantData: !!restaurantData });

      // FIX: If user has restaurantId but not restaurant field, update user
      if (user && user.restaurantId && !user.restaurant) {
        console.log('⚠️ Fixing user object - adding restaurant field');
        const updatedUser = { ...user, restaurant: user.restaurantId };
        updateUser(updatedUser);
        
        // Also update localStorage directly
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.restaurant = userData.restaurantId;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }

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

      // Try to fetch restaurant by owner
      if (user?._id) {
        const response = await fetchWithAuth(`${API_URL}/restaurants/owner/${user._id}`);
        const data = await response.json();
        
        if (data.success && data.restaurant) {
          currentRestaurantId = data.restaurant._id;
          setRestaurantId(currentRestaurantId);
          setRestaurant(data.restaurant);
          
          // FIX: Update user with both restaurantId and restaurant fields
          const updatedUser = { 
            ...user, 
            restaurantId: currentRestaurantId,
            restaurant: currentRestaurantId 
          };
          updateUser(updatedUser);
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
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
      }

      return null;
    } catch (error) {
      console.error('Initialize error:', error);
      return null;
    }
  };

  // Fetch menu
  const fetchMenu = async (id) => {
    if (!id) return;
    
    try {
      console.log('Fetching menu for restaurant:', id);
      const response = await fetch(`${API_URL}/products/restaurant/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setMenuItems(data.products || []);
        console.log('Menu loaded:', data.products?.length);
      } else {
        console.error('Failed to fetch menu:', data);
      }
    } catch (error) {
      console.error('Fetch menu error:', error);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/orders/restaurant`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
        console.log('Orders loaded:', data.orders?.length);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
    }
  };

  // Fetch riders
  const fetchAvailableRiders = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/riders/active`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableRiders(data.riders || []);
        console.log('Riders loaded:', data.riders?.length);
      }
    } catch (error) {
      console.error('Fetch riders error:', error);
    }
  };

  // Main data fetch
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const id = await initializeRestaurantData();
      console.log('Restaurant ID from init:', id);
      
      if (id) {
        setRestaurantId(id);
        await fetchMenu(id);
        await fetchOrders();
        await fetchAvailableRiders();
        await checkAuthStatus();
      } else {
        setError(new Error('No restaurant found. Please setup your restaurant.'));
      }
    } catch (error) {
      console.error('fetchData error:', error);
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
    preparingOrders: orders.filter(o => o.status === 'preparing').length,
    readyOrders: orders.filter(o => o.status === 'ready').length,
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
      .reduce((sum, o) => sum + (o.total || o.totalAmount || 0), 0),
    averageOrderValue: orders
      .filter(o => ['delivered', 'completed'].includes(o.status))
      .reduce((sum, o, _, arr) => arr.length ? sum + (o.total || o.totalAmount || 0) / arr.length : 0, 0)
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₱0';
    return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
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

  // Add product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please login again');
      logout();
      return;
    }
    
    if (!restaurantId) {
      alert('Restaurant ID not found. Please refresh.');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔍 Current state before add:');
      console.log('Restaurant ID:', restaurantId);
      console.log('User object:', user);
      console.log('User restaurantId:', user?.restaurantId);
      console.log('User restaurant:', user?.restaurant);
      
      const productData = {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        description: newProduct.description?.trim() || '',
        category: newProduct.category,
        preparationTime: parseInt(newProduct.preparationTime) || 15,
        ingredients: newProduct.ingredients?.trim() || '',
        image: newProduct.image?.trim() || '',
        restaurant: restaurantId
      };

      console.log('📤 Sending product data:', productData);

      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      const data = await res.json();
      console.log('📥 Add product response:', data);
      console.log('Response status:', res.status);
      
      if (res.ok && data.success) {
        alert('✅ Product added successfully!');
        setShowAddProduct(false);
        setNewProduct({ 
          name: '', 
          price: '', 
          description: '', 
          category: 'main course', 
          preparationTime: '15', 
          ingredients: '', 
          image: '' 
        });
        await fetchMenu(restaurantId);
        
        setNotifications(prev => [{
          id: Date.now(),
          message: `Product "${productData.name}" added successfully`,
          time: new Date().toISOString(),
          read: false
        }, ...prev]);
      } else {
        if (res.status === 401) {
          alert('Session expired. Please login again.');
          logout();
        } else if (res.status === 403) {
          alert(`❌ Not authorized: ${data.message || 'You cannot add products to this restaurant'}`);
          console.error('Auth error details:', data);
        } else {
          alert(`❌ Failed: ${data.message || 'Unknown error'}`);
          console.error('Add product error details:', data);
        }
      }
    } catch (error) {
      console.error('Add product error:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Edit product
  const handleEditProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please login again');
      logout();
      return;
    }
    
    if (!editingProduct) return;
    
    setLoading(true);
    
    try {
      console.log('🔍 Editing product:', editingProduct._id);
      console.log('Current restaurant ID:', restaurantId);
      
      const productData = {
        name: editingProduct.name.trim(),
        price: parseFloat(editingProduct.price),
        description: editingProduct.description?.trim() || '',
        category: editingProduct.category,
        preparationTime: parseInt(editingProduct.preparationTime) || 15,
        ingredients: editingProduct.ingredients?.trim() || '',
        image: editingProduct.image?.trim() || '',
        isAvailable: editingProduct.isAvailable !== false
      };

      console.log('📤 Updating product with data:', productData);

      const res = await fetch(`${API_URL}/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      const data = await res.json();
      console.log('📥 Update response:', data);
      console.log('Response status:', res.status);
      
      if (res.ok && data.success) {
        alert('✅ Product updated successfully!');
        setShowEditProduct(false);
        setEditingProduct(null);
        await fetchMenu(restaurantId);
        
        setNotifications(prev => [{
          id: Date.now(),
          message: `Product "${productData.name}" updated`,
          time: new Date().toISOString(),
          read: false
        }, ...prev]);
      } else {
        if (res.status === 401) {
          alert('Session expired. Please login again.');
          logout();
        } else if (res.status === 403) {
          alert('❌ You are not authorized to edit this product.');
          console.error('Auth error details:', data);
        } else {
          alert(`❌ Failed: ${data.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Edit product error:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please login again');
      logout();
      return;
    }

    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setLoading(true);
    try {
      console.log('========== DELETE DEBUG ==========');
      console.log('🗑️ Attempting to delete product:', productId);
      
      // Log current user state
      console.log('👤 Current user from state:', user);
      console.log('👤 User from localStorage:', JSON.parse(localStorage.getItem('user')));
      console.log('🔑 Token exists:', !!token);
      
      // Log restaurant IDs
      console.log('🏪 Restaurant ID from state:', restaurantId);
      console.log('🏪 User restaurantId:', user?.restaurantId);
      console.log('🏪 User restaurant field:', user?.restaurant);
      console.log('🏪 User restaurantData:', user?.restaurantData);
      console.log('🏪 getRestaurantId():', getRestaurantId());
      
      // Try to get the product first
      console.log('📥 Fetching product details...');
      const productRes = await fetch(`${API_URL}/products/${productId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const productData = await productRes.json();
      console.log('📦 Product data:', productData);
      
      if (productData.success) {
        console.log('📦 Product restaurant ID:', productData.product.restaurant);
        console.log('📦 Product restaurant ID type:', typeof productData.product.restaurant);
        console.log('📦 Product restaurant ID as string:', productData.product.restaurant?.toString());
        
        console.log('🏪 Your restaurant ID:', restaurantId);
        console.log('🏪 Your restaurant ID type:', typeof restaurantId);
        console.log('🏪 Your restaurant ID as string:', restaurantId?.toString());
        
        console.log('🔍 Comparison:', {
          strict: productData.product.restaurant === restaurantId,
          toString: productData.product.restaurant?.toString() === restaurantId?.toString(),
          userRestaurant: productData.product.restaurant?.toString() === user?.restaurant?.toString(),
          userRestaurantId: productData.product.restaurant?.toString() === user?.restaurantId?.toString()
        });
      }
      
      // Now try to delete
      console.log('📤 Sending DELETE request...');
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      console.log('📥 Delete response:', data);
      console.log('📥 Response status:', res.status);
      console.log('=================================');
      
      if (res.ok && data.success) {
        alert('✅ Product deleted successfully!');
        await fetchMenu(restaurantId);
        
        setNotifications(prev => [{
          id: Date.now(),
          message: `Product deleted`,
          time: new Date().toISOString(),
          read: false
        }, ...prev]);
      } else {
        if (res.status === 401) {
          alert('Session expired. Please login again.');
          logout();
        } else if (res.status === 403) {
          console.error('❌ Authorization failed - ownership mismatch');
          console.error('Response data:', data);
          
          // Show more helpful error message
          alert(`❌ Cannot delete: ${data.message || 'Not authorized'}. Check console for details.`);
        } else {
          alert(`❌ Failed: ${data.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Delete product error:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fix auth issues
  const fixAuthIssues = async () => {
    const token = localStorage.getItem('token');
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log('Current user data:', userData);
        
        // Fix the user object
        if (userData.restaurantId && !userData.restaurant) {
          userData.restaurant = userData.restaurantId;
          localStorage.setItem('user', JSON.stringify(userData));
          updateUser(userData);
          console.log('✅ Fixed user object - added restaurant field');
        }
        
        // Try to update via API
        const res = await fetch(`${API_URL}/users/fix-restaurant-id`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userData._id,
            restaurantId: restaurantId || userData.restaurantId
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          console.log('API fix response:', data);
        }
        
        alert('✅ Fixed! Please refresh the page.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Fix error:', error);
      alert('Error fixing: ' + error.message);
    }
  };

  // Toggle availability
  const handleToggleAvailability = async (product) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please login again');
      logout();
      return;
    }

    try {
      console.log('🔄 Toggling availability for:', product._id, 'to:', !product.isAvailable);
      
      const res = await fetch(`${API_URL}/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: !product.isAvailable })
      });
      
      const data = await res.json();
      console.log('📥 Toggle response:', data);
      
      if (res.ok && data.success) {
        await fetchMenu(restaurantId);
      } else {
        if (res.status === 401) {
          alert('Session expired. Please login again.');
          logout();
        } else {
          alert(`❌ Failed: ${data.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Toggle availability error:', error);
      alert('Network error. Please try again.');
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
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
        setNotifications(prev => [{
          id: Date.now(),
          message: `Order #${orderId.slice(-6)} status updated to ${newStatus}`,
          time: new Date().toISOString(),
          read: false
        }, ...prev]);
      } else {
        alert(`Failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Update order error:', error);
      alert('Network error');
    }
  };

  // Assign rider
  const handleAssignRider = async (orderId, riderId) => {
    const token = localStorage.getItem('token');
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
        alert('Rider assigned successfully!');
      } else {
        alert(`Failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Assign rider error:', error);
      alert('Network error');
    }
  };

  // Quick fix
  const handleQuickFix = async () => {
    const token = localStorage.getItem('token');
    if (!token || !restaurantId) return;
    
    try {
      console.log('🚀 Running quick fix for restaurant:', restaurantId);
      
      const res = await fetch(`${API_URL}/products/quick-fix/${restaurantId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      console.log('📥 Quick fix response:', data);
      
      if (res.ok && data.success) {
        alert(`✅ ${data.message}`);
        await fetchMenu(restaurantId);
        
        setNotifications(prev => [{
          id: Date.now(),
          message: `Added ${data.count} sample products`,
          time: new Date().toISOString(),
          read: false
        }, ...prev]);
      } else {
        alert('Quick fix failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Quick fix error:', error);
      alert('Quick fix error: ' + error.message);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !restaurantId) {
      alert('Authentication error');
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
        alert('Profile updated!');
        setShowProfile(false);
        setRestaurant(data.restaurant);
        refreshRestaurantData();
        if (user.name !== profileData.name) {
          updateUser({ name: profileData.name });
        }
      } else {
        alert(`Failed: ${data.message}`);
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Get current location
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
          setLocationLoading(false);
        },
        (error) => {
          console.error('Location error:', error);
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

    return {
      period: reportPeriod,
      totalRevenue,
      totalOrders,
      averageOrderValue,
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

  // Filter menu items by search
  const filteredMenuItems = menuItems.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (loading && !menuItems.length && !orders.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="w-8 h-8 text-red-600 animate-pulse" />
            </div>
          </div>
          <p className="text-red-800 font-medium mt-4">Loading Restaurant Dashboard...</p>
          <p className="text-red-600 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-red-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-red-600 mb-6">{error.message}</p>
          <div className="space-y-3">
            <button 
              onClick={fetchData} 
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 shadow-lg"
            >
              Try Again
            </button>
            <button 
              onClick={logout} 
              className="w-full bg-red-100 text-red-700 px-6 py-3 rounded-xl font-medium hover:bg-red-200 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <Store className="w-16 h-16 text-red-600 mx-auto mb-4" />
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

  // No restaurant
  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="text-yellow-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Setup Required</h2>
          <p className="text-red-600 mb-6">Restaurant not found. Please complete your restaurant setup.</p>
          <div className="space-y-3">
            <button 
              onClick={fetchData} 
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all"
            >
              Retry
            </button>
            <button 
              onClick={logout} 
              className="w-full bg-red-100 text-red-700 px-6 py-3 rounded-xl font-medium hover:bg-red-200 transition-all"
            >
              Logout
            </button>
          </div>

          {/* Debug Info */}
          {debugInfo && (
            <div className="mt-6 p-4 bg-gray-100 rounded-xl text-left">
              <p className="font-bold text-sm mb-2">Debug Info:</p>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  const salesReport = generateSalesReport();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-red-800 to-red-900 text-white transition-all duration-300 shadow-2xl z-30 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-red-600" />
                </div>
                <span className="font-bold text-lg">Restaurant</span>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto">
                <Store className="w-6 h-6 text-red-600" />
              </div>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-red-700 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: Home, label: 'Dashboard' },
              { id: 'orders', icon: Package, label: 'Orders', badge: stats.pendingOrders },
              { id: 'menu', icon: ShoppingBag, label: 'Menu', badge: menuItems.length },
              { id: 'earnings', icon: TrendingUpIcon, label: 'Earnings' },
              { id: 'reports', icon: PieChart, label: 'Reports' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'reports') setShowReports(true);
                }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-white text-red-600 shadow-lg' 
                    : 'text-red-100 hover:bg-red-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-red-600' : ''}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>
                {!sidebarCollapsed && item.badge > 0 && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === item.id 
                      ? 'bg-red-600 text-white' 
                      : 'bg-red-700 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={() => setShowProfile(true)}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-xl hover:bg-red-700 transition-colors text-red-100`}
          >
            <User className="w-5 h-5" />
            {!sidebarCollapsed && <span>Profile</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-lg border-b border-red-100 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                  {restaurant.name || 'Restaurant Dashboard'}
                </h1>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {restaurant.cuisine || 'Restaurant'}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent w-64"
                  />
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 hover:bg-red-50 rounded-xl relative"
                  >
                    <Bell className="w-5 h-5 text-red-600" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-red-100 z-50">
                      <div className="p-3 border-b border-red-100">
                        <h3 className="font-semibold text-red-800">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-red-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                          </div>
                        ) : (
                          notifications.map(notification => (
                            <div key={notification.id} className="p-3 hover:bg-red-50 border-b border-red-100 last:border-0">
                              <p className="text-sm text-red-800">{notification.message}</p>
                              <p className="text-xs text-red-500 mt-1">{formatTimeAgo(notification.time)}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-800">{user?.name}</p>
                    <p className="text-xs text-red-500">{user?.email}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0) || 'R'}
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-600 transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 mb-1">Today's Revenue</p>
                  <p className="text-2xl font-bold text-red-800">{formatCurrency(stats.todayRevenue)}</p>
                  <p className="text-xs text-red-500 mt-1">+{stats.completedOrders} orders today</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-600 transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-red-800">{stats.totalOrders}</p>
                  <p className="text-xs text-red-500 mt-1">{stats.pendingOrders} pending</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-600 transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 mb-1">Menu Items</p>
                  <p className="text-2xl font-bold text-red-800">{menuItems.length}</p>
                  <p className="text-xs text-red-500 mt-1">{menuItems.filter(i => i.isAvailable !== false).length} available</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-600 transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 mb-1">Avg Order Value</p>
                  <p className="text-2xl font-bold text-red-800">{formatCurrency(stats.averageOrderValue)}</p>
                  <p className="text-xs text-red-500 mt-1">Per order</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <TrendingUpIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
            <button
              onClick={handleQuickFix}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all"
            >
              <Package className="w-4 h-4" />
              <span>Add Sample Products</span>
            </button>
            <button
              onClick={() => setShowReports(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Reports</span>
            </button>
            <button
              onClick={fetchData}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={fixAuthIssues}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Fix Auth Issues</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-red-100">
              {['dashboard', 'orders', 'menu', 'earnings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-all relative ${
                    activeTab === tab 
                      ? 'text-red-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600' 
                      : 'text-red-400 hover:text-red-600'
                  }`}
                >
                  <span className="capitalize">{tab}</span>
                  {tab === 'orders' && stats.pendingOrders > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                      {stats.pendingOrders}
                    </span>
                  )}
                </button>
              ))}
              
              {/* View Toggle for Menu */}
              {activeTab === 'menu' && (
                <div className="flex items-center px-4 border-l border-red-100">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-red-400 hover:text-red-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-red-600 text-white' : 'text-red-400 hover:text-red-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-red-800">Recent Orders</h2>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-red-600 hover:text-red-700 text-sm flex items-center"
                    >
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>

                  {orders.slice(0, 5).length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-red-300 mx-auto mb-4" />
                      <p className="text-red-600 text-lg">No orders yet</p>
                      <p className="text-red-400 text-sm mt-2">When customers place orders, they'll appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map(order => (
                        <div key={order._id} className="bg-gradient-to-r from-red-50 to-white rounded-xl p-4 border border-red-100 hover:shadow-lg transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-red-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-red-800">#{order.orderId || order._id.slice(-6)}</h3>
                                <p className="text-sm text-red-600">{order.user?.name || 'Customer'}</p>
                                <p className="text-xs text-red-400">{formatDate(order.createdAt)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-red-800">{formatCurrency(order.total || order.totalAmount)}</p>
                              <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                                order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-red-800">All Orders</h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-red-600">Total: {orders.length}</span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        {stats.pendingOrders} pending
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {stats.preparingOrders} preparing
                      </span>
                    </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-red-300 mx-auto mb-4" />
                      <p className="text-red-600 text-lg">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <div key={order._id} className="bg-white rounded-xl p-4 border border-red-100 hover:shadow-lg transition-all">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 mb-2">
                                <h3 className="font-semibold text-red-800">#{order.orderId || order._id.slice(-6)}</h3>
                                <span className={`px-3 py-1 text-xs rounded-full ${
                                  order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {order.status}
                                </span>
                                {order.rider && (
                                  <span className="flex items-center text-xs text-blue-600">
                                    <Truck className="w-3 h-3 mr-1" />
                                    {order.rider.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-red-600 mb-1">{order.user?.name || 'Customer'} • {formatDate(order.createdAt)}</p>
                              <p className="text-sm text-red-800 font-medium">{formatCurrency(order.total || order.totalAmount)}</p>
                              <p className="text-xs text-red-400 mt-1">
                                {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowOrderDetails(true);
                                }}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                              >
                                Details
                              </button>
                              
                              {order.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      handleUpdateOrderStatus(order._id, 'cancelled');
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {order.status === 'confirmed' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order._id, 'preparing')}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                                  >
                                    Start Preparing
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedOrderForRider(order);
                                      setShowRiderAssignment(true);
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                                  >
                                    Assign Rider
                                  </button>
                                </>
                              )}

                              {order.status === 'preparing' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'ready')}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                                >
                                  Mark Ready
                                </button>
                              )}

                              {order.status === 'ready' && !order.rider && (
                                <button
                                  onClick={() => {
                                    setSelectedOrderForRider(order);
                                    setShowRiderAssignment(true);
                                  }}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                                >
                                  Assign Rider
                                </button>
                              )}
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
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-red-800">Menu Items</h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-red-600">Total: {filteredMenuItems.length}</span>
                      <button
                        onClick={() => setShowAddProduct(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                      </button>
                    </div>
                  </div>

                  {filteredMenuItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-red-300 mx-auto mb-4" />
                      <p className="text-red-600 text-lg">No menu items</p>
                      <p className="text-red-400 text-sm mt-2">Click "Add Product" to create your first menu item</p>
                      <button
                        onClick={handleQuickFix}
                        className="mt-4 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all"
                      >
                        Add Sample Products
                      </button>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredMenuItems.map(item => (
                        <div key={item._id} className="bg-white rounded-xl border border-red-100 overflow-hidden hover:shadow-xl transition-all group">
                          <div className="relative h-48 bg-gradient-to-br from-red-100 to-red-200">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-12 h-12 text-red-400" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <button
                                onClick={() => handleToggleAvailability(item)}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  item.isAvailable !== false 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                              </button>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-red-800">{item.name}</h3>
                              <p className="text-lg font-bold text-red-600">{formatCurrency(item.price)}</p>
                            </div>
                            <p className="text-sm text-red-600 mb-2 capitalize">{item.category}</p>
                            {item.description && (
                              <p className="text-xs text-red-400 mb-3 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs text-red-500">
                                <Clock className="w-3 h-3" />
                                <span>{item.preparationTime || 15} min</span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingProduct(item);
                                    setShowEditProduct(true);
                                  }}
                                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(item._id)}
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredMenuItems.map(item => (
                        <div key={item._id} className="bg-white rounded-xl p-4 border border-red-100 hover:shadow-lg transition-all">
                          <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-lg overflow-hidden flex-shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Image className="w-8 h-8 text-red-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-red-800">{item.name}</h3>
                                <p className="text-lg font-bold text-red-600">{formatCurrency(item.price)}</p>
                              </div>
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="text-red-600 capitalize">{item.category}</span>
                                <span className="flex items-center text-red-500">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {item.preparationTime || 15} min
                                </span>
                                <button
                                  onClick={() => handleToggleAvailability(item)}
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    item.isAvailable !== false 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                                </button>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingProduct(item);
                                  setShowEditProduct(true);
                                }}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(item._id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
                  <h2 className="text-xl font-bold text-red-800 mb-6">Earnings Overview</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white">
                      <p className="text-red-100 mb-2">Total Revenue</p>
                      <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                      <p className="text-red-200 text-sm mt-2">{stats.completedOrders} completed orders</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 border border-red-100">
                      <p className="text-red-600 mb-2">This Week</p>
                      <p className="text-2xl font-bold text-red-800">
                        {formatCurrency(orders
                          .filter(o => {
                            const date = new Date(o.createdAt);
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return date >= weekAgo && ['delivered', 'completed'].includes(o.status);
                          })
                          .reduce((sum, o) => sum + (o.total || o.totalAmount || 0), 0)
                        )}
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 border border-red-100">
                      <p className="text-red-600 mb-2">This Month</p>
                      <p className="text-2xl font-bold text-red-800">
                        {formatCurrency(orders
                          .filter(o => {
                            const date = new Date(o.createdAt);
                            const monthAgo = new Date();
                            monthAgo.setMonth(monthAgo.getMonth() - 1);
                            return date >= monthAgo && ['delivered', 'completed'].includes(o.status);
                          })
                          .reduce((sum, o) => sum + (o.total || o.totalAmount || 0), 0)
                        )}
                      </p>
                    </div>
                  </div>

                  <h3 className="font-semibold text-red-800 mb-4">Recent Earnings</h3>
                  <div className="space-y-4">
                    {orders
                      .filter(o => ['delivered', 'completed'].includes(o.status))
                      .slice(0, 10)
                      .map(order => (
                        <div key={order._id} className="bg-white rounded-xl p-4 border border-red-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-red-800">#{order.orderId || order._id.slice(-6)}</p>
                              <p className="text-sm text-red-600">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-red-800">{formatCurrency(order.total || order.totalAmount)}</p>
                              <p className="text-xs text-red-500">{order.items?.length} items</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-red-800">Add New Product</h3>
                <button 
                  onClick={() => setShowAddProduct(false)} 
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-red-600" />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., Classic Burger"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Price *</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="main course">Main Course</option>
                    <option value="appetizer">Appetizer</option>
                    <option value="dessert">Dessert</option>
                    <option value="beverage">Beverage</option>
                    <option value="side dish">Side Dish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Preparation Time (minutes)</label>
                  <input
                    type="number"
                    value={newProduct.preparationTime}
                    onChange={(e) => setNewProduct({...newProduct, preparationTime: e.target.value})}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="0"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Description</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Describe your product..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Ingredients</label>
                  <textarea
                    value={newProduct.ingredients}
                    onChange={(e) => setNewProduct({...newProduct, ingredients: e.target.value})}
                    rows="2"
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="List ingredients..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="flex-1 px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Product'}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-red-800">Edit Product</h3>
                <button 
                  onClick={() => {
                    setShowEditProduct(false);
                    setEditingProduct(null);
                  }} 
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-red-600" />
                </button>
              </div>
              <form onSubmit={handleEditProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={editingProduct.image || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Price *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'main course'}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="main course">Main Course</option>
                    <option value="appetizer">Appetizer</option>
                    <option value="dessert">Dessert</option>
                    <option value="beverage">Beverage</option>
                    <option value="side dish">Side Dish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Preparation Time (minutes)</label>
                  <input
                    type="number"
                    value={editingProduct.preparationTime || 15}
                    onChange={(e) => setEditingProduct({...editingProduct, preparationTime: e.target.value})}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Description</label>
                  <textarea
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Ingredients</label>
                  <textarea
                    value={editingProduct.ingredients || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, ingredients: e.target.value})}
                    rows="2"
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={editingProduct.isAvailable !== false}
                    onChange={(e) => setEditingProduct({...editingProduct, isAvailable: e.target.checked})}
                    className="w-4 h-4 text-red-600 focus:ring-red-500 border-red-300 rounded"
                  />
                  <label htmlFor="isAvailable" className="text-sm text-red-700">
                    Available for ordering
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditProduct(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-red-800">Sales Reports</h3>
                <button 
                  onClick={() => setShowReports(false)} 
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-red-600" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {['today', 'week', 'month', 'all'].map(period => (
                  <button
                    key={period}
                    onClick={() => setReportPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      reportPeriod === period 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>

              {salesReport.totalOrders === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-red-300 mx-auto mb-4" />
                  <p className="text-red-600 text-lg">No sales data for this period</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white">
                      <p className="text-red-100 text-sm mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(salesReport.totalRevenue)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-red-100">
                      <p className="text-red-600 text-sm mb-1">Total Orders</p>
                      <p className="text-2xl font-bold text-red-800">{salesReport.totalOrders}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-red-100">
                      <p className="text-red-600 text-sm mb-1">Average Order</p>
                      <p className="text-2xl font-bold text-red-800">{formatCurrency(salesReport.averageOrderValue)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => exportReportToCSV(salesReport)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export as CSV</span>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-red-800">Assign Rider</h3>
                <button 
                  onClick={() => {
                    setShowRiderAssignment(false);
                    setSelectedOrderForRider(null);
                  }} 
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-red-600" />
                </button>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-white rounded-xl p-4 mb-6 border border-red-100">
                <p className="font-medium text-red-800 mb-1">Order #{selectedOrderForRider.orderId || selectedOrderForRider._id.slice(-6)}</p>
                <p className="text-sm text-red-600">Customer: {selectedOrderForRider.user?.name || 'Customer'}</p>
                <p className="text-sm text-red-600">Total: {formatCurrency(selectedOrderForRider.total || selectedOrderForRider.totalAmount)}</p>
              </div>

              {availableRiders.filter(r => r.status === 'online').length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-red-300 mx-auto mb-4" />
                  <p className="text-red-600">No riders available</p>
                  <p className="text-sm text-red-400 mt-2">Check back later</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableRiders.filter(r => r.status === 'online').map(rider => (
                    <div key={rider._id} className="bg-white rounded-xl p-4 border border-red-100 hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-red-800">{rider.name}</p>
                          <p className="text-sm text-red-600">{rider.phone}</p>
                          <p className="text-xs text-green-600 mt-1">Online</p>
                        </div>
                        <button
                          onClick={() => handleAssignRider(selectedOrderForRider._id, rider._id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
                        >
                          Assign
                        </button>
                      </div>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-red-800">Edit Profile</h3>
                <button 
                  onClick={() => setShowProfile(false)} 
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-red-600" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Restaurant Name *</label>
                    <input
                      type="text"
                      required
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Cuisine Type *</label>
                    <input
                      type="text"
                      required
                      value={profileData.cuisine}
                      onChange={(e) => setProfileData({...profileData, cuisine: e.target.value})}
                      className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., Italian, Japanese, Filipino"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Address *</label>
                  <textarea
                    required
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    rows="2"
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Description</label>
                  <textarea
                    value={profileData.description}
                    onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Tell customers about your restaurant..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Delivery Time</label>
                    <input
                      type="text"
                      value={profileData.deliveryTime}
                      onChange={(e) => setProfileData({...profileData, deliveryTime: e.target.value})}
                      className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., 20-30 min"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Delivery Fee</label>
                    <input
                      type="number"
                      value={profileData.deliveryFee}
                      onChange={(e) => setProfileData({...profileData, deliveryFee: e.target.value})}
                      className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Opening Hours</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={profileData.openingHours.open}
                      onChange={(e) => setProfileData({
                        ...profileData, 
                        openingHours: { ...profileData.openingHours, open: e.target.value }
                      })}
                      className="flex-1 px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <span className="text-red-600">to</span>
                    <input
                      type="time"
                      value={profileData.openingHours.close}
                      onChange={(e) => setProfileData({
                        ...profileData, 
                        openingHours: { ...profileData.openingHours, close: e.target.value }
                      })}
                      className="flex-1 px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-white rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-medium text-red-800">Location</p>
                      <p className="text-sm text-red-600">Set your restaurant location for delivery</p>
                    </div>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                    >
                      {locationLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Getting...</span>
                        </>
                      ) : (
                        <>
                          <Crosshair className="w-4 h-4" />
                          <span>Get Current Location</span>
                        </>
                      )}
                    </button>
                  </div>
                  {profileData.location?.coordinates?.[0] !== 0 && (
                    <div className="bg-white p-3 rounded-lg text-xs font-mono border border-red-100">
                      <p>Latitude: {profileData.location.coordinates[1]?.toFixed(6)}</p>
                      <p>Longitude: {profileData.location.coordinates[0]?.toFixed(6)}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProfile(false)}
                    className="flex-1 px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-red-800">Order Details</h3>
                <button 
                  onClick={() => setShowOrderDetails(false)} 
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-red-600" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-red-50 to-white rounded-xl p-4">
                    <p className="text-sm text-red-600 mb-1">Order ID</p>
                    <p className="font-medium text-red-800">#{selectedOrder.orderId || selectedOrder._id}</p>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-white rounded-xl p-4">
                    <p className="text-sm text-red-600 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                      selectedOrder.status === 'delivered' || selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrder.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-white rounded-xl p-4">
                    <p className="text-sm text-red-600 mb-1">Customer</p>
                    <p className="font-medium text-red-800">{selectedOrder.user?.name || 'Customer'}</p>
                    {selectedOrder.user?.phone && (
                      <p className="text-sm text-red-600">{selectedOrder.user.phone}</p>
                    )}
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-white rounded-xl p-4">
                    <p className="text-sm text-red-600 mb-1">Total Amount</p>
                    <p className="text-xl font-bold text-red-800">{formatCurrency(selectedOrder.total || selectedOrder.totalAmount)}</p>
                  </div>
                </div>

                {selectedOrder.items?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-800 mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white rounded-xl p-3 border border-red-100">
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-700">
                              {item.quantity}
                            </span>
                            <div>
                              <p className="font-medium text-red-800">{item.product?.name || item.productName}</p>
                              {item.notes && (
                                <p className="text-xs text-red-500">Note: {item.notes}</p>
                              )}
                            </div>
                          </div>
                          <p className="font-medium text-red-800">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOrder.deliveryAddress && (
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">Delivery Address</h4>
                    <div className="bg-gradient-to-r from-red-50 to-white rounded-xl p-4">
                      <p className="text-red-800">{selectedOrder.deliveryAddress}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleUpdateOrderStatus(selectedOrder._id, 'confirmed');
                          setShowOrderDetails(false);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateOrderStatus(selectedOrder._id, 'cancelled');
                          setShowOrderDetails(false);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all"
                      >
                        Reject Order
                      </button>
                    </>
                  )}

                  {selectedOrder.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => {
                          handleUpdateOrderStatus(selectedOrder._id, 'preparing');
                          setShowOrderDetails(false);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all"
                      >
                        Start Preparing
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrderForRider(selectedOrder);
                          setShowRiderAssignment(true);
                          setShowOrderDetails(false);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all"
                      >
                        Assign Rider
                      </button>
                    </>
                  )}

                  {selectedOrder.status === 'preparing' && (
                    <button
                      onClick={() => {
                        handleUpdateOrderStatus(selectedOrder._id, 'ready');
                        setShowOrderDetails(false);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all"
                    >
                      Mark as Ready
                    </button>
                  )}

                  {selectedOrder.user?.phone && (
                    <a
                      href={`tel:${selectedOrder.user.phone}`}
                      className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Customer
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-xl text-xs max-w-md overflow-auto z-50">
          <p className="font-bold mb-2">Debug Info:</p>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;