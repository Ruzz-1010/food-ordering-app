import React, { useState, useEffect } from 'react';
import { 
    Store, Plus, Package, DollarSign, Clock, Star, Eye, X, Save, 
    LogOut, RefreshCw, Image, Phone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RestaurantDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [error, setError] = useState('');
    
    const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

    // State
    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [restaurant, setRestaurant] = useState(null);
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        description: '',
        category: 'main course',
        preparationTime: '',
        ingredients: '',
        image: ''
    });

    // Get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    };

    // SIMPLE FIX: Use the existing Jollibee restaurant ID directly
    const RESTAURANT_ID = '691bf21035908ca24d30ab51';

    // Fetch restaurant data - SIMPLIFIED
    const fetchRestaurantData = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('🔄 Fetching restaurant data...');
            
            // 1. Get restaurant details
            const restaurantResponse = await fetch(`${API_URL}/restaurants/${RESTAURANT_ID}`);
            const restaurantData = await restaurantResponse.json();
            
            if (restaurantResponse.ok && restaurantData.restaurant) {
                setRestaurant(restaurantData.restaurant);
                console.log('✅ Restaurant loaded:', restaurantData.restaurant.name);
                
                // 2. Get products
                const productsResponse = await fetch(`${API_URL}/products/restaurant/${RESTAURANT_ID}`);
                if (productsResponse.ok) {
                    const productsData = await productsResponse.json();
                    setMenuItems(productsData.products || []);
                }
                
                // 3. Get orders
                const ordersResponse = await fetch(`${API_URL}/orders/restaurant/${RESTAURANT_ID}`);
                if (ordersResponse.ok) {
                    const ordersData = await ordersResponse.json();
                    setOrders(ordersData.orders || []);
                }
            } else {
                setError('Restaurant not found');
            }

        } catch (error) {
            console.error('Error:', error);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'restaurant') {
            fetchRestaurantData();
        }
    }, [user]);

    // Add product
    const handleAddProduct = async (e) => {
        e.preventDefault();
        
        if (!newProduct.name || !newProduct.price) {
            alert('Please enter product name and price');
            return;
        }

        try {
            const productData = {
                name: newProduct.name,
                price: parseFloat(newProduct.price),
                description: newProduct.description,
                category: newProduct.category,
                preparationTime: newProduct.preparationTime,
                ingredients: newProduct.ingredients,
                image: newProduct.image,
                restaurantId: RESTAURANT_ID
            };

            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(productData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('✅ Product added successfully!');
                setShowAddProduct(false);
                setNewProduct({ 
                    name: '', price: '', description: '', category: 'main course',
                    preparationTime: '', ingredients: '', image: '' 
                });
                fetchRestaurantData();
            } else {
                alert(`❌ Failed: ${data.message}`);
            }
        } catch (error) {
            alert('❌ Network error');
        }
    };

    // Update order status
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                fetchRestaurantData();
                alert(`✅ Order status updated to ${newStatus}`);
            } else {
                alert('❌ Failed to update order status');
            }
        } catch (error) {
            alert('❌ Error updating order status');
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return `₱${amount?.toLocaleString('en-PH') || '0'}`;
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'preparing': return 'bg-orange-100 text-orange-800';
            case 'ready': return 'bg-purple-100 text-purple-800';
            case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Calculate stats
    const stats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(order => ['pending', 'confirmed', 'preparing'].includes(order.status)).length,
        completedOrders: orders.filter(order => order.status === 'delivered').length,
        totalRevenue: orders
            .filter(order => order.status === 'delivered')
            .reduce((sum, order) => sum + (order.total || 0), 0)
    };

    if (!user || user.role !== 'restaurant') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Restaurant dashboard is only available for restaurant owners</p>
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
                                <p className="text-sm text-gray-500">
                                    {restaurant ? restaurant.name : 'Loading...'} • {user?.name}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={fetchRestaurantData}
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

            {error && (
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                </div>
            )}

            {restaurant && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                            <p className="text-xs text-gray-500">from {stats.completedOrders} orders</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <p className="text-sm text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                            <p className="text-xs text-blue-600">all time</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <p className="text-sm text-gray-600">Pending Orders</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
                            <p className="text-xs text-orange-600">need attention</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <p className="text-sm text-gray-600">Menu Items</p>
                            <p className="text-2xl font-bold text-green-600">{menuItems.length}</p>
                            <p className="text-xs text-green-600">available</p>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        {/* Tabs */}
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`flex-1 py-4 font-medium ${
                                    activeTab === 'dashboard' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600'
                                }`}
                            >
                                📊 Dashboard
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`flex-1 py-4 font-medium ${
                                    activeTab === 'orders' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600'
                                }`}
                            >
                                📦 Orders ({orders.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('menu')}
                                className={`flex-1 py-4 font-medium ${
                                    activeTab === 'menu' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600'
                                }`}
                            >
                                🍽️ Menu ({menuItems.length})
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {/* Dashboard Tab */}
                            {activeTab === 'dashboard' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-gray-900">Overview - {restaurant.name}</h2>
                                    
                                    {/* Recent Orders */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-4">Recent Orders</h3>
                                        {orders.slice(0, 5).length > 0 ? (
                                            orders.slice(0, 5).map((order) => (
                                                <div key={order._id} className="border rounded-lg p-4 mb-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">Order #{order.orderId || order._id}</p>
                                                            <p className="text-sm text-gray-600">
                                                                {order.user?.name || 'Customer'} • {new Date(order.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-green-600 font-semibold">{formatCurrency(order.total)}</span>
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setShowOrderDetails(true);
                                                            }}
                                                            className="text-orange-600 hover:text-orange-700"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">No orders yet</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Orders Tab */}
                            {activeTab === 'orders' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">All Orders - {restaurant.name}</h2>
                                    
                                    {orders.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Package size={48} className="mx-auto text-gray-300 mb-4" />
                                            <p className="text-gray-500">No orders yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {orders.map((order) => (
                                                <div key={order._id} className="border rounded-lg p-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">Order #{order.orderId || order._id}</h3>
                                                            <p className="text-sm text-gray-600">
                                                                {order.user?.name || 'Customer'} • {new Date(order.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-sm text-gray-600">{order.deliveryAddress || 'No address'}</p>
                                                            <p className="text-lg font-bold text-green-600">{formatCurrency(order.total)}</p>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button 
                                                                onClick={() => {
                                                                    setSelectedOrder(order);
                                                                    setShowOrderDetails(true);
                                                                }}
                                                                className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                                                            >
                                                                Details
                                                            </button>
                                                            {order.status === 'pending' && (
                                                                <button 
                                                                    onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                                                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                                                >
                                                                    Accept
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
                                        <h2 className="text-xl font-bold text-gray-900">Menu Items - {restaurant.name}</h2>
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {menuItems.map((item) => (
                                                <div key={item._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center space-x-3 mb-3">
                                                        {item.image ? (
                                                            <img 
                                                                src={item.image} 
                                                                alt={item.name}
                                                                className="w-16 h-16 object-cover rounded-lg"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                                <Image size={20} className="text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                                                <span className={`px-2 py-1 text-xs rounded ${
                                                                    item.isAvailable !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {item.isAvailable !== false ? 'Available' : 'Unavailable'}
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
                                                                <p className="text-xs text-gray-500">{item.preparationTime} min prep</p>
                                                            )}
                                                        </div>
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
            )}

            {/* Add Product Modal */}
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
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

            {/* Order Details Modal */}
            {showOrderDetails && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                                <button onClick={() => setShowOrderDetails(false)} className="text-gray-500 hover:text-gray-700">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Order Information</h4>
                                    <p><strong>Order ID:</strong> {selectedOrder.orderId || selectedOrder._id}</p>
                                    <p><strong>Status:</strong> {selectedOrder.status}</p>
                                    <p><strong>Total Amount:</strong> {formatCurrency(selectedOrder.total)}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                                    <p><strong>Name:</strong> {selectedOrder.user?.name || 'Customer'}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.user?.phone || 'No phone'}</p>
                                    <p><strong>Address:</strong> {selectedOrder.deliveryAddress || 'No address'}</p>
                                </div>

                                {selectedOrder.user?.phone && (
                                    <a
                                        href={`tel:${selectedOrder.user.phone}`}
                                        className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700 flex items-center justify-center"
                                    >
                                        <Phone size={16} className="mr-2" />
                                        Call Customer
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantDashboard;