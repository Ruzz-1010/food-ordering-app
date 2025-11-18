import React, { useState, useEffect } from 'react';
import { 
  Store, Utensils, Clock, DollarSign, 
  CheckCircle, AlertTriangle, Users, 
  TrendingUp, Package, Star, Settings,
  LogOut, Bell, RefreshCw, Eye,
  Phone, MapPin, MessageCircle, ChefHat,
  Plus, Edit, Trash2, Image, Navigation,
  Save, X, Upload, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RestaurantDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Real data state
  const [dashboardData, setDashboardData] = useState({
    stats: {
      todayRevenue: 0,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      averageRating: 0,
      totalCustomers: 0
    },
    orders: [],
    menuItems: [],
    earnings: [],
    restaurant: {}
  });

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparationTime: '',
    ingredients: '',
    image: '',
    isAvailable: true
  });

  // Fetch restaurant data from API
  const fetchRestaurantData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      // Fetch restaurant orders
      const ordersResponse = await fetch(`${API_URL}/orders/restaurant/${user.id}`, {
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

      // Fetch restaurant details and menu
      const restaurantResponse = await fetch(`${API_URL}/restaurants/owner/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let menuItems = [];
      let restaurantData = {};
      let restaurantStats = {
        todayRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        averageRating: 4.0,
        totalCustomers: 0
      };

      if (restaurantResponse.ok) {
        const data = await restaurantResponse.json();
        restaurantData = data.restaurant || data;
        menuItems = data.menuItems || data.menu || [];
        
        // Calculate stats from orders
        const today = new Date().toISOString().split('T')[0];
        restaurantStats = {
          todayRevenue: orders.filter(order => 
            order.status === 'completed' && 
            order.createdAt?.includes(today)
          ).reduce((sum, order) => sum + (order.totalAmount || 0), 0),
          totalOrders: orders.length,
          pendingOrders: orders.filter(order => 
            ['pending', 'confirmed', 'preparing'].includes(order.status)
          ).length,
          completedOrders: orders.filter(order => order.status === 'completed').length,
          averageRating: data.rating || 4.0,
          totalCustomers: new Set(orders.map(order => order.customerId)).size
        };
      }

      // Calculate earnings history
      const earnings = calculateEarningsHistory(orders);

      setDashboardData({
        stats: restaurantStats,
        orders,
        menuItems,
        earnings,
        restaurant: restaurantData
      });

    } catch (error) {
      console.error('❌ Error fetching restaurant data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate earnings from orders
  const calculateEarningsHistory = (orders) => {
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    const earningsByDate = {};
    completedOrders.forEach(order => {
      const date = order.createdAt ? order.createdAt.split('T')[0] : 'Unknown';
      if (!earningsByDate[date]) {
        earningsByDate[date] = { revenue: 0, orders: 0 };
      }
      earningsByDate[date].revenue += order.totalAmount || 0;
      earningsByDate[date].orders += 1;
    });

    return Object.entries(earningsByDate)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString(),
        dateFull: date,
        revenue: data.revenue,
        orders: data.orders
      }))
      .sort((a, b) => new Date(b.dateFull) - new Date(a.dateFull))
      .slice(0, 7);
  };

  useEffect(() => {
    if (user) {
      fetchRestaurantData();
    }
  }, [user]);

  // Handle order actions
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchRestaurantData();
        alert(`✅ Order status updated to ${newStatus}`);
      } else {
        alert('❌ Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('❌ Error updating order status');
    }
  };

  // Add new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/restaurants/menu`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newProduct,
          restaurantId: user.id,
          price: parseFloat(newProduct.price)
        })
      });

      if (response.ok) {
        await fetchRestaurantData();
        setShowAddProduct(false);
        setNewProduct({
          name: '',
          description: '',
          price: '',
          category: '',
          preparationTime: '',
          ingredients: '',
          image: '',
          isAvailable: true
        });
        alert('✅ Product added successfully!');
      } else {
        alert('❌ Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('❌ Error adding product');
    }
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    return `₱${amount?.toLocaleString('en-PH') || '0'}`;
  };

  // Order Details Modal
  const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Order Details - {order.orderId || order._id}</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order & Customer Info */}
              <div className="space-y-6">
                {/* Order Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">📦 Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">{order.orderId || order._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(order.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">👤 Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{order.customerId?.name || order.customerName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{order.customerId?.phone || order.customerPhone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Delivery Address:</span>
                      <p className="font-medium mt-1">{order.deliveryAddress || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items & Actions */}
              <div className="space-y-6">
                {/* Order Items */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">🍽️ Order Items</h4>
                  <div className="space-y-3">
                    {(order.orderItems || []).map((item, index) => (
                      <div key={index} className="flex justify-between items-start border-b pb-3">
                        <div className="flex-1">
                          <p className="font-medium">{item.quantity}x {item.name}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                          {item.notes && (
                            <p className="text-xs text-blue-600 mt-1">Note: {item.notes}</p>
                          )}
                        </div>
                        <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Delivery Fee:</span>
                      <span>{formatCurrency(order.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {order.specialInstructions && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">📝 Special Instructions</h4>
                    <p className="text-gray-700">{order.specialInstructions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6 pt-6 border-t">
              {order.status === 'pending' && (
                <button
                  onClick={() => handleUpdateOrderStatus(order._id || order.id, 'confirmed')}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center space-x-2"
                >
                  <CheckCircle size={18} />
                  <span>Confirm Order</span>
                </button>
              )}
              {order.status === 'confirmed' && (
                <button
                  onClick={() => handleUpdateOrderStatus(order._id || order.id, 'preparing')}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-semibold flex items-center justify-center space-x-2"
                >
                  <ChefHat size={18} />
                  <span>Start Preparing</span>
                </button>
              )}
              {order.status === 'preparing' && (
                <button
                  onClick={() => handleUpdateOrderStatus(order._id || order.id, 'ready')}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center space-x-2"
                >
                  <Package size={18} />
                  <span>Mark as Ready</span>
                </button>
              )}
              {order.customerId?.phone && (
                <a
                  href={`tel:${order.customerId.phone}`}
                  className="px-6 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center"
                  title="Call Customer"
                >
                  <Phone size={18} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add Product Modal with URL Upload
  const AddProductModal = ({ onClose }) => {
    const [imagePreview, setImagePreview] = useState('');

    const handleImageUrlChange = (url) => {
      setNewProduct({...newProduct, image: url});
      setImagePreview(url);
    };

    const testImageUrl = (url) => {
      const img = new Image();
      img.onload = () => setImagePreview(url);
      img.onerror = () => {
        setImagePreview('');
        alert('❌ Invalid image URL. Please check the link.');
      };
      img.src = url;
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Product</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              {/* Image URL Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image URL
                </label>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-4 text-center">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg border-2 border-orange-200 mx-auto"
                    />
                    <p className="text-xs text-green-600 mt-1">✅ Image loaded successfully</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={newProduct.image}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    onBlur={() => newProduct.image && testImageUrl(newProduct.image)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="https://example.com/product-image.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => newProduct.image && testImageUrl(newProduct.image)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Eye size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Tip: Use image URLs from Unsplash, Google Images, or restaurant websites
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Chickenjoy with Rice"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="₱ 0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    required
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Category</option>
                    <option value="appetizer">Appetizer</option>
                    <option value="main course">Main Course</option>
                    <option value="dessert">Dessert</option>
                    <option value="beverage">Beverage</option>
                    <option value="side dish">Side Dish</option>
                    <option value="combo meal">Combo Meal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preparation Time (minutes)</label>
                  <input
                    type="number"
                    value={newProduct.preparationTime}
                    onChange={(e) => setNewProduct({...newProduct, preparationTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., 15"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe your product... (e.g., Crispy chicken served with steamed rice and gravy)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
                <textarea
                  value={newProduct.ingredients}
                  onChange={(e) => setNewProduct({...newProduct, ingredients: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="List main ingredients... (e.g., Chicken, rice, special sauce, spices)"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newProduct.isAvailable}
                  onChange={(e) => setNewProduct({...newProduct, isAvailable: e.target.checked})}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label className="ml-2 text-sm text-gray-700">Available for ordering</label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold flex items-center justify-center space-x-2"
                >
                  <Save size={18} />
                  <span>Add Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // GPS Location Modal
  const LocationModal = ({ onClose }) => {
    const [address, setAddress] = useState(dashboardData.restaurant?.address || '');
    const [coordinates, setCoordinates] = useState(
      dashboardData.restaurant?.location || { lat: 9.7392, lng: 118.7353 }
    );

    const handleSearchLocation = () => {
      if (!address.trim()) return;
      
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(response => response.json())
        .then(data => {
          if (data && data[0]) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            setCoordinates({ lat, lng });
          }
        })
        .catch(error => {
          console.error('Error searching location:', error);
        });
    };

    const openInMaps = () => {
      const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">📍 Restaurant Location</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Address</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter your restaurant address in Puerto Princesa"
                  />
                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    <MapPin size={16} />
                  </button>
                </div>
              </div>

              <div className="border-2 border-gray-300 rounded-lg overflow-hidden h-64 relative">
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <Navigation size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Restaurant Location Map</p>
                    <p className="text-sm text-gray-500">Set your restaurant location above</p>
                  </div>
                </div>
                
                <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-3 py-1 rounded text-sm">
                  📍 {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 flex items-center">
                  <MapPin size={16} className="mr-2" />
                  <span>Current Location: {address || 'Set your restaurant address'}</span>
                </p>
              </div>

              <button
                onClick={openInMaps}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center space-x-2"
              >
                <Navigation size={18} />
                <span>Open in Google Maps</span>
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
          <p className="text-gray-600">Loading restaurant dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-500 rounded-lg flex items-center justify-center">
                <Store className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FoodExpress Restaurant</h1>
                <p className="text-xs text-gray-500">Welcome, {user?.name}</p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchRestaurantData}
                disabled={refreshing}
                className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
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
          {/* Today's Revenue */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.stats.todayRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">from {dashboardData.stats.completedOrders} orders</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalOrders}</p>
                <p className="text-xs text-blue-600 mt-1">all time</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.pendingOrders}</p>
                <p className="text-xs text-orange-600 mt-1">need attention</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          {/* Customer Rating */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Rating</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.averageRating}</p>
                <p className="text-xs text-yellow-600 flex items-center mt-1">
                  <Star size={12} className="mr-1 fill-current" />
                  from {dashboardData.stats.totalCustomers} customers
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-sm border mb-6">
              <div className="flex border-b overflow-x-auto">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex-1 min-w-0 py-4 px-6 text-center font-medium ${
                    activeTab === 'dashboard'
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex-1 min-w-0 py-4 px-6 text-center font-medium ${
                    activeTab === 'orders'
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🚚 Orders
                </button>
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`flex-1 min-w-0 py-4 px-6 text-center font-medium ${
                    activeTab === 'menu'
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🍽️ Menu
                </button>
                <button
                  onClick={() => setActiveTab('earnings')}
                  className={`flex-1 min-w-0 py-4 px-6 text-center font-medium ${
                    activeTab === 'earnings'
                      ? 'text-orange-600 border-b-2 border-orange-600'
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
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    {dashboardData.orders.slice(0, 3).map((order) => (
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
                            order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
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
                              {formatCurrency(order.totalAmount)}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                            className="flex items-center space-x-1 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 text-sm"
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
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">All Orders</h3>
                      <span className="text-sm text-gray-500">
                        {dashboardData.orders.length} total orders
                      </span>
                    </div>
                    
                    {dashboardData.orders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No orders found</p>
                        <p className="text-sm text-gray-400 mt-1">Orders will appear here when customers place orders</p>
                      </div>
                    ) : (
                      dashboardData.orders.map((order) => (
                        <div key={order._id || order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{order.orderId || order._id}</h4>
                              <p className="text-sm text-gray-600">
                                {order.customerId?.name || order.customerName || 'Customer'} • 
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
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
                              Total: {formatCurrency(order.totalAmount)}
                            </div>
                            {(order.orderItems || []).slice(0, 2).map((item, index) => (
                              <div key={index} className="text-sm text-gray-600">
                                • {item.quantity}x {item.name}
                              </div>
                            ))}
                            {(order.orderItems || []).length > 2 && (
                              <div className="text-sm text-gray-500">
                                +{(order.orderItems || []).length - 2} more items
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowOrderDetails(true);
                                }}
                                className="flex items-center space-x-1 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 text-sm"
                              >
                                <Eye size={14} />
                                <span>Details</span>
                              </button>
                              
                              {order.status === 'pending' && (
                                <button 
                                  onClick={() => handleUpdateOrderStatus(order._id || order.id, 'confirmed')}
                                  className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                                >
                                  <CheckCircle size={14} />
                                  <span>Confirm</span>
                                </button>
                              )}
                              
                              {order.status === 'confirmed' && (
                                <button 
                                  onClick={() => handleUpdateOrderStatus(order._id || order.id, 'preparing')}
                                  className="flex items-center space-x-1 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 text-sm"
                                >
                                  <ChefHat size={14} />
                                  <span>Prepare</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'menu' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Menu Items</h3>
                      <button
                        onClick={() => setShowAddProduct(true)}
                        className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                      >
                        <Plus size={16} />
                        <span>Add New Item</span>
                      </button>
                    </div>

                    {dashboardData.menuItems.length === 0 ? (
                      <div className="text-center py-8">
                        <Utensils size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No menu items yet</p>
                        <p className="text-sm text-gray-400 mt-1">Add your first product to start receiving orders</p>
                        <button
                          onClick={() => setShowAddProduct(true)}
                          className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                        >
                          Add Your First Product
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dashboardData.menuItems.map((item) => (
                          <div key={item._id || item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3 mb-3">
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Utensils size={20} className="text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {item.isAvailable ? 'Available' : 'Unavailable'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{item.category}</p>
                              </div>
                            </div>

                            {item.description && (
                              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                            )}

                            {item.ingredients && (
                              <p className="text-xs text-gray-500 mb-3">Ingredients: {item.ingredients}</p>
                            )}

                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-lg font-bold text-green-600">{formatCurrency(item.price)}</p>
                                {item.preparationTime && (
                                  <p className="text-xs text-gray-500">{item.preparationTime} min preparation</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                  <Edit size={14} />
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'earnings' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Earnings Overview</h3>
                    
                    {dashboardData.earnings.length === 0 ? (
                      <div className="text-center py-8">
                        <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No earnings data available</p>
                        <p className="text-sm text-gray-400 mt-1">Earnings will appear here when orders are completed</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {dashboardData.earnings.map((earning, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <p className="text-sm font-medium text-gray-600">{earning.date}</p>
                              <p className="text-xl font-bold text-gray-900">{formatCurrency(earning.revenue)}</p>
                              <p className="text-xs text-gray-500">{earning.orders} orders completed</p>
                            </div>
                          ))}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">💰 Payment Summary</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-blue-800">Total Revenue</p>
                              <p className="font-bold text-lg text-blue-900">{formatCurrency(dashboardData.stats.todayRevenue)}</p>
                            </div>
                            <div>
                              <p className="text-blue-800">Completed Orders</p>
                              <p className="font-bold text-lg text-blue-900">{dashboardData.stats.completedOrders}</p>
                            </div>
                          </div>
                          <p className="text-xs text-blue-700 mt-2">
                            💡 Next payout: Every Friday • Minimum: ₱1,000
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
                  onClick={() => setShowAddProduct(true)}
                  className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="text-center">
                    <Plus className="mx-auto text-orange-600 mb-1" size={20} />
                    <span className="text-xs font-medium text-gray-700">Add Product</span>
                  </div>
                </button>
                <button 
                  onClick={() => setShowLocation(true)}
                  className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="text-center">
                    <MapPin className="mx-auto text-blue-600 mb-1" size={20} />
                    <span className="text-xs font-medium text-gray-700">Set Location</span>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="text-center">
                    <Package className="mx-auto text-green-600 mb-1" size={20} />
                    <span className="text-xs font-medium text-gray-700">View Orders</span>
                  </div>
                </button>
                <button 
                  onClick={fetchRestaurantData}
                  className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="text-center">
                    <RefreshCw className="mx-auto text-purple-600 mb-1" size={20} />
                    <span className="text-xs font-medium text-gray-700">Refresh</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Restaurant Profile */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏪 Restaurant Profile</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Store className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{dashboardData.restaurant.name || 'Your Restaurant'}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-medium text-green-600">Online</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Rating</p>
                    <p className="font-medium text-yellow-600">{dashboardData.stats.averageRating}/5</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Orders</p>
                    <p className="font-medium">{dashboardData.stats.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Menu Items</p>
                    <p className="font-medium">{dashboardData.menuItems.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Earnings */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Recent Earnings</h3>
              <div className="space-y-3">
                {dashboardData.earnings.slice(0, 3).map((earning, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{earning.date}</p>
                      <p className="text-xs text-gray-500">{earning.orders} orders</p>
                    </div>
                    <p className="font-semibold text-green-600">{formatCurrency(earning.revenue)}</p>
                  </div>
                ))}
                {dashboardData.earnings.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">No earnings yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showOrderDetails && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }} 
        />
      )}

      {showAddProduct && (
        <AddProductModal onClose={() => setShowAddProduct(false)} />
      )}

      {showLocation && (
        <LocationModal onClose={() => setShowLocation(false)} />
      )}
    </div>
  );
};

export default RestaurantDashboard;