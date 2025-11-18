import React, { useState, useEffect } from 'react';
import { 
    Plus, ShoppingBag, Settings, Upload, MapPin, 
    Edit, Trash2, Package, DollarSign, Users,
    BarChart3, Clock, CheckCircle, XCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RestaurantDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [restaurant, setRestaurant] = useState(null);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

    // Fetch real data from database
    const fetchData = async () => {
        try {
            setRefreshing(true);
            
            // Fetch restaurant data
            const restaurantResponse = await fetch(`${API_URL}/restaurants/owner/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (restaurantResponse.ok) {
                const restaurantData = await restaurantResponse.json();
                setRestaurant(restaurantData.restaurant || restaurantData);
            }

            // Fetch products (you'll need to create this endpoint)
            const productsResponse = await fetch(`${API_URL}/restaurants/${user.id}/products`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                setProducts(productsData.products || productsData || []);
            }

            // Fetch orders (you'll need to create this endpoint)
            const ordersResponse = await fetch(`${API_URL}/restaurants/${user.id}/orders`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json();
                setOrders(ordersData.orders || ordersData || []);
            }

        } catch (error) {
            console.error('❌ Error fetching restaurant data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const handleRefresh = () => {
        fetchData();
    };

    // Add New Product Form
    const AddProductForm = () => {
        const [formData, setFormData] = useState({
            name: '',
            description: '',
            price: '',
            category: '',
            preparationTime: '15-20 min',
            available: true
        });
        const [uploading, setUploading] = useState(false);

        const handleSubmit = async (e) => {
            e.preventDefault();
            setUploading(true);

            try {
                const response = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        ...formData,
                        price: parseFloat(formData.price),
                        restaurant: user.id
                    })
                });

                if (response.ok) {
                    await fetchData(); // Refresh data
                    setShowAddProduct(false);
                    setFormData({
                        name: '',
                        description: '',
                        price: '',
                        category: '',
                        preparationTime: '15-20 min',
                        available: true
                    });
                }
            } catch (error) {
                console.error('Error adding product:', error);
            } finally {
                setUploading(false);
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Add New Product</h3>
                        <button onClick={() => setShowAddProduct(false)} className="text-gray-400 hover:text-gray-600">
                            <XCircle size={24} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="Enter product name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="Describe your product"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">Select Category</option>
                                    <option value="Appetizer">Appetizer</option>
                                    <option value="Main Course">Main Course</option>
                                    <option value="Soup">Soup</option>
                                    <option value="Dessert">Dessert</option>
                                    <option value="Beverage">Beverage</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time</label>
                            <select
                                value={formData.preparationTime}
                                onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="10-15 min">10-15 minutes</option>
                                <option value="15-20 min">15-20 minutes</option>
                                <option value="20-25 min">20-25 minutes</option>
                                <option value="25-30 min">25-30 minutes</option>
                                <option value="30+ min">30+ minutes</option>
                            </select>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.available}
                                onChange={(e) => setFormData({...formData, available: e.target.checked})}
                                className="mr-2"
                            />
                            <label className="text-sm text-gray-700">Available for ordering</label>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowAddProduct(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
                            >
                                {uploading ? 'Adding...' : 'Add Product'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Dashboard Stats with Real Data
    const DashboardStats = () => {
        const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'preparing');
        const totalRevenue = orders
            .filter(order => order.status === 'completed' || order.status === 'delivered')
            .reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-blue-900">Today's Orders</h3>
                            <p className="text-2xl font-bold text-blue-700 mt-2">{orders.length}</p>
                        </div>
                        <ShoppingBag size={24} className="text-blue-600" />
                    </div>
                </div>
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-green-900">Total Revenue</h3>
                            <p className="text-2xl font-bold text-green-700 mt-2">₱{totalRevenue.toLocaleString()}</p>
                        </div>
                        <DollarSign size={24} className="text-green-600" />
                    </div>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-purple-900">Menu Items</h3>
                            <p className="text-2xl font-bold text-purple-700 mt-2">{products.length}</p>
                        </div>
                        <Package size={24} className="text-purple-600" />
                    </div>
                </div>
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-orange-900">Pending Orders</h3>
                            <p className="text-2xl font-bold text-orange-700 mt-2">{pendingOrders.length}</p>
                        </div>
                        <Clock size={24} className="text-orange-600" />
                    </div>
                </div>
            </div>
        );
    };

    // Products Management
    const ProductsManagement = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Menu Management</h3>
                <div className="flex space-x-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={() => setShowAddProduct(true)}
                        className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                    >
                        <Plus size={16} />
                        <span>Add Product</span>
                    </button>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Yet</h3>
                    <p className="text-gray-600 mb-4">Start by adding your first menu item</p>
                    <button
                        onClick={() => setShowAddProduct(true)}
                        className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                    >
                        Add Your First Product
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product._id || product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg mb-3 flex items-center justify-center text-white text-4xl">
                                {product.image ? '🖼️' : '🍽️'}
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">{product.name}</h4>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-lg font-bold text-orange-600">₱{product.price}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    product.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {product.available ? 'Available' : 'Unavailable'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{product.category}</span>
                                <span>{product.preparationTime}</span>
                            </div>
                            <div className="flex space-x-2 mt-3">
                                <button className="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">
                                    <Edit size={14} className="inline mr-1" />
                                    Edit
                                </button>
                                <button className="flex-1 bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700">
                                    <Trash2 size={14} className="inline mr-1" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Orders Management
    const OrdersManagement = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Order Management</h3>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12">
                    <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                    <p className="text-gray-600">Orders will appear here when customers place orders</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order._id || order.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-900">{order.id || `ORD-${order._id}`}</h4>
                                    <p className="text-sm text-gray-600">Customer: {order.customer?.name || 'N/A'}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                                </span>
                            </div>
                            <div className="space-y-2 mb-3">
                                {(order.items || []).map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>₱{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center border-t pt-3">
                                <div className="text-sm text-gray-600">
                                    <MapPin size={14} className="inline mr-1" />
                                    {order.address || 'Address not specified'}
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900">₱{order.totalAmount || order.total || 0}</div>
                                    <div className="text-xs text-gray-500">{new Date(order.orderTime || order.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Restaurant Profile
    const RestaurantProfile = () => {
        const [uploading, setUploading] = useState(false);

        const handleLogoUpload = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            setUploading(true);
            // Here you would upload to your backend
            // For now, we'll just simulate upload
            setTimeout(() => {
                setUploading(false);
                alert('Logo upload functionality needs backend implementation');
            }, 1000);
        };

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Restaurant Profile</h3>
                
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Logo Upload */}
                    <div className="md:w-1/3">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                                {restaurant?.logo ? (
                                    <img src={restaurant.logo} alt="Restaurant Logo" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <Upload size={32} className="text-gray-400" />
                                )}
                            </div>
                            <input
                                type="file"
                                id="logo-upload"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                            <label
                                htmlFor="logo-upload"
                                className="block w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 cursor-pointer disabled:opacity-50"
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Upload Logo'}
                            </label>
                            <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 2MB</p>
                        </div>
                    </div>

                    {/* Restaurant Details */}
                    <div className="md:w-2/3 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                            <input
                                type="text"
                                value={restaurant?.name || ''}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                placeholder="Restaurant Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={restaurant?.description || ''}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                placeholder="Describe your restaurant"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <div className="flex items-center space-x-2">
                                    <MapPin size={16} className="text-gray-400" />
                                    <input
                                        type="text"
                                        value={restaurant?.address || ''}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        placeholder="Restaurant address"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                <input
                                    type="text"
                                    value={restaurant?.phone || user?.phone || ''}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    placeholder="Phone number"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Hours</label>
                            <input
                                type="text"
                                value={restaurant?.openingHours || '08:00 - 22:00'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                placeholder="e.g., 08:00 - 22:00"
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <button className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">
                                Save Changes
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
                    <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading restaurant data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">🏪 Restaurant Dashboard</h1>
                            <p className="text-gray-600">Welcome back, {user?.name}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                            { id: 'products', label: 'Menu Items', icon: Package },
                            { id: 'orders', label: 'Orders', icon: ShoppingBag },
                            { id: 'profile', label: 'Profile', icon: Settings }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon size={16} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">
                {activeTab === 'dashboard' && (
                    <div>
                        <DashboardStats />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                                {orders.slice(0, 5).map((order) => (
                                    <div key={order._id || order.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                                        <div>
                                            <p className="font-medium text-gray-900">{order.id || `ORD-${order._id}`}</p>
                                            <p className="text-sm text-gray-500">{order.customer?.name || 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">₱{order.totalAmount || order.total || 0}</p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Info</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Restaurant Name</p>
                                        <p className="font-medium text-gray-900">{restaurant?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Location</p>
                                        <p className="font-medium text-gray-900">{restaurant?.address || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            restaurant?.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {restaurant?.isApproved ? 'Approved' : 'Pending Approval'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'products' && <ProductsManagement />}
                {activeTab === 'orders' && <OrdersManagement />}
                {activeTab === 'profile' && <RestaurantProfile />}
            </div>

            {/* Add Product Modal */}
            {showAddProduct && <AddProductForm />}
        </div>
    );
};

export default RestaurantDashboard;