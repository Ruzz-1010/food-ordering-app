import React, { useState, useEffect } from 'react';
import { 
    Store, Plus, Package, DollarSign, Clock, Star, Eye, X, Save, 
    LogOut, RefreshCw, Image, MapPin, ChefHat, 
    CheckCircle, Users, Phone, MessageCircle,
    User, AlertCircle, Building, List
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RestaurantDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showAddRestaurant, setShowAddRestaurant] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [error, setError] = useState('');
    
    const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

    // State
    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        description: '',
        category: 'main course',
        preparationTime: '',
        ingredients: '',
        image: ''
    });

    const [newRestaurant, setNewRestaurant] = useState({
        name: '',
        cuisine: '',
        phone: '',
        address: '',
        description: '',
        deliveryTime: '25-35 min',
        deliveryFee: 35,
        openingHours: {
            open: '08:00',
            close: '22:00'
        },
        image: '',
        bannerImage: ''
    });

    // Get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    };

    // Fetch all restaurants owned by the user - FIXED VERSION
    const fetchRestaurants = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('🔄 Fetching restaurants for user:', user?._id);
            console.log('👤 User object:', user);
            
            if (!user?._id) {
                setError('User not loaded properly. Please login again.');
                return;
            }

            // Use the endpoint that gets ALL restaurants for owner
            const response = await fetch(`${API_URL}/restaurants/owner/${user._id}/all`, {
                headers: getAuthHeaders()
            });
            
            const data = await response.json();
            console.log('🏪 Restaurants API response:', data);

            if (response.ok && data.success) {
                if (data.restaurants && data.restaurants.length > 0) {
                    setRestaurants(data.restaurants);
                    // Auto-select the first restaurant
                    setSelectedRestaurant(data.restaurants[0]);
                    console.log('✅ Found restaurants:', data.restaurants.length);
                    
                    // Fetch data for the selected restaurant
                    await fetchRestaurantData(data.restaurants[0]._id);
                } else {
                    setError('No restaurants found. Create your first restaurant!');
                    setRestaurants([]);
                    setSelectedRestaurant(null);
                }
            } else {
                // Try the single restaurant endpoint as fallback
                await fetchSingleRestaurant();
            }

        } catch (error) {
            console.error('❌ Error fetching restaurants:', error);
            setError('Network error loading restaurants: ' + error.message);
            setRestaurants([]);
            setSelectedRestaurant(null);
        } finally {
            setLoading(false);
        }
    };

    // Fallback: Fetch single restaurant
    const fetchSingleRestaurant = async () => {
        try {
            console.log('🔄 Trying single restaurant endpoint...');
            const response = await fetch(`${API_URL}/restaurants/owner/${user._id}`, {
                headers: getAuthHeaders()
            });
            
            const data = await response.json();
            console.log('🏪 Single restaurant response:', data);

            if (response.ok && data.success && data.restaurant) {
                setRestaurants([data.restaurant]);
                setSelectedRestaurant(data.restaurant);
                console.log('✅ Found single restaurant:', data.restaurant.name);
                await fetchRestaurantData(data.restaurant._id);
            } else {
                setError(data.message || 'No restaurants found. Create your first restaurant!');
            }
        } catch (error) {
            console.error('❌ Error fetching single restaurant:', error);
            setError('Failed to load restaurant data');
        }
    };

    // Fetch data for specific restaurant
    const fetchRestaurantData = async (restaurantId) => {
        try {
            console.log('📊 Fetching data for restaurant:', restaurantId);
            
            // Fetch products
            const productsResponse = await fetch(`${API_URL}/products/restaurant/${restaurantId}`);
            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                setMenuItems(productsData.products || []);
                console.log('📦 Products found:', productsData.products?.length || 0);
            } else {
                console.log('❌ Failed to fetch products');
            }

            // Fetch orders
            await fetchOrders(restaurantId);

        } catch (error) {
            console.error('Error fetching restaurant data:', error);
        }
    };

    // Fetch orders for restaurant
    const fetchOrders = async (restaurantId) => {
        try {
            // Try the authenticated endpoint first
            const ordersResponse = await fetch(`${API_URL}/orders/restaurant`, {
                headers: getAuthHeaders()
            });
            
            if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json();
                console.log('📋 Orders response:', ordersData);
                
                if (ordersData.success) {
                    // Filter orders for the selected restaurant
                    const restaurantOrders = ordersData.orders?.filter(order => 
                        order.restaurant?._id === restaurantId
                    ) || [];
                    setOrders(restaurantOrders);
                    console.log('✅ Orders found:', restaurantOrders.length);
                }
            } else {
                // Try alternative endpoint
                await fetchOrdersAlternative(restaurantId);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    // Alternative order fetching
    const fetchOrdersAlternative = async (restaurantId) => {
        try {
            const altResponse = await fetch(`${API_URL}/orders/restaurant/${restaurantId}`);
            if (altResponse.ok) {
                const altData = await altResponse.json();
                setOrders(altData.orders || []);
                console.log('✅ Orders found via alt endpoint:', altData.orders?.length || 0);
            }
        } catch (altError) {
            console.log('❌ Alternative endpoint also failed');
        }
    };

    // Add new restaurant
    const handleAddRestaurant = async (e) => {
        e.preventDefault();
        
        if (!newRestaurant.name || !newRestaurant.cuisine || !newRestaurant.phone || !newRestaurant.address) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const restaurantData = {
                ...newRestaurant,
                owner: user._id,
                email: user.email
            };

            console.log('🏪 Adding restaurant:', restaurantData);

            const response = await fetch(`${API_URL}/restaurants`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(restaurantData)
            });

            const data = await response.json();
            console.log('📡 Add restaurant response:', data);

            if (response.ok && data.success) {
                alert('✅ Restaurant created successfully!');
                setShowAddRestaurant(false);
                setNewRestaurant({
                    name: '', cuisine: '', phone: '', address: '', description: '',
                    deliveryTime: '25-35 min', deliveryFee: 35,
                    openingHours: { open: '08:00', close: '22:00' },
                    image: '', bannerImage: ''
                });
                // Refresh restaurants list
                fetchRestaurants();
            } else {
                alert(`❌ Failed to create restaurant: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating restaurant:', error);
            alert('❌ Network error creating restaurant');
        }
    };

    // Add product to selected restaurant
    const handleAddProduct = async (e) => {
        e.preventDefault();
        
        if (!newProduct.name || !newProduct.price) {
            alert('Please enter product name and price');
            return;
        }

        if (!selectedRestaurant?._id) {
            alert('Please select a restaurant first');
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
                restaurantId: selectedRestaurant._id
            };

            console.log('📦 Adding product:', productData);

            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(productData)
            });

            const data = await response.json();
            console.log('📡 Add product response:', data);

            if (response.ok && data.success) {
                alert('✅ Product added successfully!');
                setShowAddProduct(false);
                setNewProduct({ 
                    name: '', price: '', description: '', category: 'main course',
                    preparationTime: '', ingredients: '', image: '' 
                });
                fetchRestaurantData(selectedRestaurant._id);
            } else {
                alert(`❌ Failed to add product: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert('❌ Network error adding product');
        }
    };

    // Update order status
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            console.log(`🔄 Updating order ${orderId} to ${newStatus}`);
            
            const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            console.log('📡 Update status response:', data);

            if (response.ok && data.success) {
                await fetchRestaurantData(selectedRestaurant._id);
                alert(`✅ Order status updated to ${newStatus}`);
            } else {
                alert(`❌ Failed to update order status: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('❌ Error updating order status');
        }
    };

    // Handle restaurant selection
    const handleRestaurantSelect = (restaurant) => {
        setSelectedRestaurant(restaurant);
        fetchRestaurantData(restaurant._id);
    };

    useEffect(() => {
        if (user && user.role === 'restaurant') {
            fetchRestaurants();
        }
    }, [user]);

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

    // Get status text
    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'confirmed': return 'Confirmed';
            case 'preparing': return 'Preparing';
            case 'ready': return 'Ready';
            case 'out_for_delivery': return 'Out for Delivery';
            case 'delivered': return 'Delivered';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    // Calculate stats
    const stats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(order => ['pending', 'confirmed', 'preparing'].includes(order.status)).length,
        completedOrders: orders.filter(order => order.status === 'delivered').length,
        todayRevenue: orders
            .filter(order => order.status === 'delivered')
            .reduce((sum, order) => sum + (order.total || 0), 0),
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
                    <p className="text-gray-600">Loading Restaurants...</p>
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
                                    {selectedRestaurant ? selectedRestaurant.name : 'Select a Restaurant'} • {user?.name}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowAddRestaurant(true)}
                                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                            >
                                <Plus size={16} />
                                <span>Add Restaurant</span>
                            </button>
                            <button
                                onClick={fetchRestaurants}
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

            {/* Error Display */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
                        <AlertCircle size={20} className="mr-2" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Restaurant Selector */}
            {restaurants.length > 0 && (
                <div className="bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700">My Restaurants:</span>
                            <div className="flex space-x-2 overflow-x-auto">
                                {restaurants.map((restaurant) => (
                                    <button
                                        key={restaurant._id}
                                        onClick={() => handleRestaurantSelect(restaurant)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                                            selectedRestaurant?._id === restaurant._id
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        🏪 {restaurant.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedRestaurant ? (
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
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Quick Actions */}
                            <div className="bg-white rounded-lg shadow-sm border p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => setShowAddProduct(true)}
                                        className="w-full flex items-center space-x-2 bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700"
                                    >
                                        <Plus size={16} />
                                        <span>Add Product</span>
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('orders')}
                                        className="w-full flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                                    >
                                        <Package size={16} />
                                        <span>View Orders</span>
                                    </button>
                                </div>
                            </div>

                            {/* Restaurant Info */}
                            <div className="bg-white rounded-lg shadow-sm border p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Restaurant Info</h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Name:</strong> {selectedRestaurant.name}</p>
                                    <p><strong>Cuisine:</strong> {selectedRestaurant.cuisine}</p>
                                    <p><strong>Status:</strong> 
                                        <span className={`ml-1 ${selectedRestaurant.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {selectedRestaurant.isApproved ? 'Approved' : 'Pending Approval'}
                                        </span>
                                    </p>
                                    <p><strong>Address:</strong> {selectedRestaurant.address}</p>
                                    <p><strong>Phone:</strong> {selectedRestaurant.phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
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
                                            <h2 className="text-xl font-bold text-gray-900">Overview - {selectedRestaurant.name}</h2>
                                            
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
                                                                    {getStatusText(order.status)}
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
                                            <h2 className="text-xl font-bold text-gray-900 mb-6">All Orders - {selectedRestaurant.name}</h2>
                                            
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
                                                                    {getStatusText(order.status)}
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
                                                                    {order.status === 'confirmed' && (
                                                                        <button 
                                                                            onClick={() => handleUpdateOrderStatus(order._id, 'preparing')}
                                                                            className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                                                                        >
                                                                            Start Preparing
                                                                        </button>
                                                                    )}
                                                                    {order.status === 'preparing' && (
                                                                        <button 
                                                                            onClick={() => handleUpdateOrderStatus(order._id, 'ready')}
                                                                            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                                                                        >
                                                                            Mark Ready
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
                                                <h2 className="text-xl font-bold text-gray-900">Menu Items - {selectedRestaurant.name}</h2>
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
                    </div>
                </div>
            ) : (
                // No restaurant selected view
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="text-center">
                        <Building size={64} className="mx-auto text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Restaurants Found</h2>
                        <p className="text-gray-600 mb-8">You don't have any restaurants yet. Create your first restaurant to get started!</p>
                        <button
                            onClick={() => setShowAddRestaurant(true)}
                            className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 text-lg font-semibold"
                        >
                            Create Your First Restaurant
                        </button>
                    </div>
                </div>
            )}

            {/* Add Restaurant Modal */}
            {showAddRestaurant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Add New Restaurant</h3>
                                <button onClick={() => setShowAddRestaurant(false)} className="text-gray-500 hover:text-gray-700">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAddRestaurant} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={newRestaurant.name}
                                            onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="e.g., Jollibee"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type *</label>
                                        <select
                                            required
                                            value={newRestaurant.cuisine}
                                            onChange={(e) => setNewRestaurant({...newRestaurant, cuisine: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="">Select Cuisine</option>
                                            <option value="Filipino">Filipino</option>
                                            <option value="Fast Food">Fast Food</option>
                                            <option value="Chinese">Chinese</option>
                                            <option value="Japanese">Japanese</option>
                                            <option value="Korean">Korean</option>
                                            <option value="American">American</option>
                                            <option value="Italian">Italian</option>
                                            <option value="Mexican">Mexican</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={newRestaurant.phone}
                                            onChange={(e) => setNewRestaurant({...newRestaurant, phone: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="09123456789"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Fee (₱)</label>
                                        <input
                                            type="number"
                                            value={newRestaurant.deliveryFee}
                                            onChange={(e) => setNewRestaurant({...newRestaurant, deliveryFee: parseFloat(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="35"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                                    <textarea
                                        required
                                        value={newRestaurant.address}
                                        onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                                        rows="2"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Enter restaurant address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={newRestaurant.description}
                                        onChange={(e) => setNewRestaurant({...newRestaurant, description: e.target.value})}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Describe your restaurant..."
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddRestaurant(false)}
                                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2"
                                    >
                                        <Save size={16} />
                                        <span>Create Restaurant</span>
                                    </button>
                                </div>
                            </form>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Image URL</label>
                                    <input
                                        type="url"
                                        value={newProduct.image}
                                        onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (minutes)</label>
                                    <input
                                        type="number"
                                        value={newProduct.preparationTime}
                                        onChange={(e) => setNewProduct({...newProduct, preparationTime: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="15"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
                                    <textarea
                                        value={newProduct.ingredients}
                                        onChange={(e) => setNewProduct({...newProduct, ingredients: e.target.value})}
                                        rows="2"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="List main ingredients..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
                                    <p><strong>Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                                    <p><strong>Name:</strong> {selectedOrder.user?.name || 'Customer'}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.user?.phone || 'No phone'}</p>
                                    <p><strong>Address:</strong> {selectedOrder.deliveryAddress || 'No address'}</p>
                                </div>

                                {selectedOrder.items && selectedOrder.items.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                                        {selectedOrder.items.map((item, index) => (
                                            <div key={index} className="flex justify-between border-b py-2">
                                                <div>
                                                    <span>{item.quantity}x {item.productName || item.product?.name || 'Item'}</span>
                                                    {item.product?.description && (
                                                        <p className="text-xs text-gray-500">{item.product.description}</p>
                                                    )}
                                                </div>
                                                <span>{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex space-x-3 pt-4">
                                    {selectedOrder.status === 'pending' && (
                                        <button
                                            onClick={() => handleUpdateOrderStatus(selectedOrder._id, 'confirmed')}
                                            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                        >
                                            Accept Order
                                        </button>
                                    )}
                                    {selectedOrder.status === 'confirmed' && (
                                        <button
                                            onClick={() => handleUpdateOrderStatus(selectedOrder._id, 'preparing')}
                                            className="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
                                        >
                                            Start Preparing
                                        </button>
                                    )}
                                    {selectedOrder.status === 'preparing' && (
                                        <button
                                            onClick={() => handleUpdateOrderStatus(selectedOrder._id, 'ready')}
                                            className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                                        >
                                            Mark Ready
                                        </button>
                                    )}
                                    {selectedOrder.user?.phone && (
                                        <a
                                            href={`tel:${selectedOrder.user.phone}`}
                                            className="px-4 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 flex items-center justify-center"
                                        >
                                            <Phone size={16} />
                                        </a>
                                    )}
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