import React, { useState, useEffect } from 'react';
import { Store, Plus, Package, DollarSign, Clock, Star, Eye, X, Save, LogOut, RefreshCw, Image } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RestaurantDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('menu');
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Simple state
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: 'main course',
    image: ''
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch products
      const productsResponse = await fetch(`${API_URL}/products/restaurant/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setMenuItems(productsData.products || productsData || []);
      }

      // Fetch orders
      const ordersResponse = await fetch(`${API_URL}/orders/restaurant/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.orders || ordersData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Add product with image
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.price) {
      alert('Please enter product name and price');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        category: newProduct.category,
        image: newProduct.image, // Include image URL
        restaurantId: user.id
      };

      console.log('📦 Sending product:', productData);

      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();
      console.log('📨 Response:', data);

      if (response.ok) {
        alert('✅ Product added successfully!');
        setShowAddProduct(false);
        setNewProduct({ 
          name: '', 
          price: '', 
          description: '', 
          category: 'main course',
          image: '' 
        });
        fetchData();
      } else {
        alert(`❌ Failed: ${data.message || 'Please check backend'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Network error - check console');
    }
  };

  // Test image URL
  const testImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₱${amount?.toLocaleString('en-PH') || '0'}`;
  };

  // Stats calculation
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(order => order.status === 'pending').length,
    completedOrders: orders.filter(order => order.status === 'completed').length,
    todayRevenue: orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Store className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Restaurant Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchData}
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
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Revenue</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.todayRevenue)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 py-4 font-medium ${
                activeTab === 'menu' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600'
              }`}
            >
              🍽️ Menu
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-4 font-medium ${
                activeTab === 'orders' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600'
              }`}
            >
              📦 Orders ({orders.length})
            </button>
          </div>

          <div className="p-6">
            {/* Menu Tab */}
            {activeTab === 'menu' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Menu Items</h2>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                  >
                    <Plus size={16} />
                    <span>Add Item</span>
                  </button>
                </div>

                {menuItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No menu items yet</p>
                    <button
                      onClick={() => setShowAddProduct(true)}
                      className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                    >
                      Add Your First Item
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menuItems.map((item) => (
                      <div key={item._id || item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        {/* Product Image */}
                        <div className="mb-3">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-32 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Image size={32} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {item.category}
                          </span>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(item.price)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            item.isAvailable === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.isAvailable === false ? 'Unavailable' : 'Available'}
                          </span>
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
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Orders</h2>
                
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 10).map((order) => (
                      <div key={order._id || order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Order #{order.orderId || order._id}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {order.customerId?.name || 'Customer'} • {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">
                              {order.deliveryAddress || 'Pickup order'}
                            </p>
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(order.totalAmount)}
                            </p>
                          </div>
                          <button className="text-orange-600 hover:text-orange-700">
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal with Image */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Add Menu Item</h3>
                <button 
                  onClick={() => setShowAddProduct(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4">
                {/* Image URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Image URL
                  </label>
                  <input
                    type="url"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="https://example.com/burger-image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Use food images from Unsplash or Google Images
                  </p>
                  
                  {/* Image Preview */}
                  {newProduct.image && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Preview:</p>
                      <div className="w-20 h-20 border rounded-lg overflow-hidden">
                        <img 
                          src={newProduct.image} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Chicken Burger"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="main course">Main Course</option>
                    <option value="appetizer">Appetizer</option>
                    <option value="dessert">Dessert</option>
                    <option value="beverage">Beverage</option>
                    <option value="side dish">Side Dish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Describe your menu item..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2"
                  >
                    <Save size={16} />
                    <span>Add Item</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;