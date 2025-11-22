import React, { useState, useEffect } from 'react';
import { 
    Store, Plus, Package, DollarSign, Clock, Star, Eye, X, Save, 
    LogOut, RefreshCw, Image, MapPin, Navigation, ChefHat, 
    CheckCircle, Users, TrendingUp, Phone, MessageCircle, Settings,
    User, Edit, Camera, Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RestaurantDashboard = () => {
    const { user, logout, getRestaurantId, refreshRestaurantData } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    
    const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';
    const [restaurantId, setRestaurantId] = useState(null);

    // State
    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [restaurant, setRestaurant] = useState({});
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        description: '',
        category: 'main course',
        preparationTime: '',
        ingredients: '',
        image: ''
    });

    // Profile State
    const [profileData, setProfileData] = useState({
        description: '',
        openingHours: {
            open: '08:00',
            close: '22:00'
        },
        deliveryTime: '25-35 min',
        deliveryFee: 35,
        image: '',
        bannerImage: ''
    });

    // Get restaurant ID - FIXED VERSION
    const getRestaurantIdFromUser = async () => {
        console.log('🔍 Getting restaurant ID for user:', user);
        
        // Try from auth context first
        const idFromAuth = getRestaurantId();
        if (idFromAuth) {
            console.log('✅ Using restaurant ID from auth context:', idFromAuth);
            return idFromAuth;
        }

        // If not in auth context, try to fetch by owner ID
        if (user?._id) {
            try {
                console.log('🔄 Fetching restaurant by owner ID:', user._id);
                const response = await fetch(`${API_URL}/restaurants/owner/${user._id}`);
                console.log('📡 Restaurant fetch response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('📊 Restaurant fetch response:', data);
                    
                    if (data.success && data.restaurant) {
                        console.log('✅ Found restaurant by owner:', data.restaurant._id);
                        // Update auth context with restaurant ID
                        refreshRestaurantData();
                        return data.restaurant._id;
                    } else {
                        console.log('❌ No restaurant found for owner');
                    }
                } else {
                    console.log('❌ Restaurant fetch failed with status:', response.status);
                }
            } catch (error) {
                console.error('❌ Error fetching restaurant by owner:', error);
            }
        }

        // Last resort: try by email
        if (user?.email) {
            try {
                console.log('🔄 Trying to fetch restaurant by email:', user.email);
                const response = await fetch(`${API_URL}/restaurants/email/${user.email}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.restaurant) {
                        console.log('✅ Found restaurant by email:', data.restaurant._id);
                        return data.restaurant._id;
                    }
                }
            } catch (error) {
                console.error('❌ Error fetching restaurant by email:', error);
            }
        }

        console.log('❌ No restaurant ID found through any method');
        return null;
    };

    // Fetch all data - FIXED VERSION
    const fetchData = async () => {
        setLoading(true);
        try {
            console.log('🔄 Starting data fetch for user:', user);
            
            // Get restaurant ID first
            const currentRestaurantId = await getRestaurantIdFromUser();
            
            if (!currentRestaurantId) {
                console.error('❌ No restaurant ID found for user');
                setLoading(false);
                return;
            }

            setRestaurantId(currentRestaurantId);
            console.log('🏪 Fetching data for restaurant:', currentRestaurantId);
            
            // Fetch restaurant details
            const restaurantResponse = await fetch(`${API_URL}/restaurants/${currentRestaurantId}`);
            const restaurantData = await restaurantResponse.json();
            console.log('🏪 Restaurant data response:', restaurantData);
            
            if (restaurantResponse.ok && restaurantData.restaurant) {
                const restaurantInfo = restaurantData.restaurant;
                setRestaurant(restaurantInfo);
                
                // Set profile data from restaurant
                setProfileData({
                    description: restaurantInfo.description || '',
                    openingHours: restaurantInfo.openingHours || { open: '08:00', close: '22:00' },
                    deliveryTime: restaurantInfo.deliveryTime || '25-35 min',
                    deliveryFee: restaurantInfo.deliveryFee || 35,
                    image: restaurantInfo.image || '',
                    bannerImage: restaurantInfo.bannerImage || ''
                });

                // Fetch products
                console.log('📦 Fetching products...');
                const productsResponse = await fetch(`${API_URL}/products/restaurant/${currentRestaurantId}`);
                if (productsResponse.ok) {
                    const productsData = await productsResponse.json();
                    setMenuItems(productsData.products || []);
                    console.log('✅ Products loaded:', productsData.products?.length || 0);
                } else {
                    console.log('❌ Products fetch failed');
                    setMenuItems([]);
                }

                // Fetch orders
                console.log('📦 Fetching orders...');
                const ordersResponse = await fetch(`${API_URL}/orders/restaurant/${currentRestaurantId}`);
                console.log('📦 Orders response status:', ordersResponse.status);
                
                if (ordersResponse.ok) {
                    const ordersData = await ordersResponse.json();
                    setOrders(ordersData.orders || []);
                    console.log('✅ Orders loaded:', ordersData.orders?.length || 0);
                } else {
                    console.log('❌ Orders fetch failed');
                    setOrders([]);
                }
            } else {
                console.log('❌ Restaurant not found or invalid response');
            }

        } catch (error) {
            console.error('❌ Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user._id) {
            console.log('👤 User detected, fetching data...');
            fetchData();
        } else {
            console.log('👤 No user or user ID found');
        }
    }, [user]);

    // Add product
    const handleAddProduct = async (e) => {
        e.preventDefault();
        
        if (!newProduct.name || !newProduct.price) {
            alert('Please enter product name and price');
            return;
        }

        if (!restaurantId) {
            alert('Restaurant not found. Please refresh the page.');
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
                restaurantId: restaurantId
            };

            console.log('📦 Adding product:', productData);

            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData)
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ Product added successfully!');
                setShowAddProduct(false);
                setNewProduct({ 
                    name: '', price: '', description: '', category: 'main course',
                    preparationTime: '', ingredients: '', image: '' 
                });
                fetchData();
            } else {
                alert(`❌ Failed: ${data.message || 'Please check backend'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Network error');
        }
    };

    // Update Profile
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        if (!restaurantId) {
            alert('Restaurant not found. Please refresh the page.');
            return;
        }
        
        try {
            console.log('🔄 Updating restaurant profile...');

            const response = await fetch(`${API_URL}/restaurants/${restaurantId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('✅ Profile updated successfully!');
                setShowProfile(false);
                fetchData();
            } else {
                alert(`❌ Failed to update profile: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('❌ Network error: ' + error.message);
        }
    };

    // Update order status
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (response.ok) {
                await fetchData();
                alert(`✅ Order status updated to ${newStatus}`);
            } else {
                alert(`❌ Failed to update order status: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('❌ Error updating order status');
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₱0';
        return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    };

    // Calculate stats
    const stats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        completedOrders: orders.filter(order => order.status === 'completed' || order.status === 'delivered').length,
        todayRevenue: orders
            .filter(order => (order.status === 'completed' || order.status === 'delivered') && 
                   new Date(order.createdAt).toDateString() === new Date().toDateString())
            .reduce((sum, order) => sum + (order.total || order.totalAmount || 0), 0),
        totalRevenue: orders
            .filter(order => order.status === 'completed' || order.status === 'delivered')
            .reduce((sum, order) => sum + (order.total || order.totalAmount || 0), 0)
    };

    // Earnings calculation
    const earnings = orders
        .filter(order => order.status === 'completed' || order.status === 'delivered')
        .reduce((groups, order) => {
            const date = new Date(order.createdAt).toLocaleDateString();
            if (!groups[date]) groups[date] = { revenue: 0, orders: 0 };
            groups[date].revenue += order.total || order.totalAmount || 0;
            groups[date].orders += 1;
            return groups;
        }, {});

    const earningsArray = Object.entries(earnings)
        .map(([date, data]) => ({ date, ...data }))
        .slice(0, 7);

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
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Store className="text-red-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Not Logged In</h2>
                    <p className="text-gray-600 mb-4">Please login to access the restaurant dashboard.</p>
                </div>
            </div>
        );
    }

    if (!restaurantId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Store className="text-yellow-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Restaurant Not Found</h2>
                    <p className="text-gray-600 mb-4">We couldn't find your restaurant data.</p>
                    <div className="space-y-2">
                        <button
                            onClick={fetchData}
                            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 block mx-auto"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={logout}
                            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 block mx-auto"
                        >
                            Logout
                        </button>
                    </div>
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                        <p className="text-sm text-gray-600">Debug Info:</p>
                        <p className="text-xs">User ID: {user?._id}</p>
                        <p className="text-xs">User Email: {user?.email}</p>
                        <p className="text-xs">User Role: {user?.role}</p>
                    </div>
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
                                    Welcome, {user?.name} - {restaurant.name || 'Your Restaurant'}
                                </p>
                                <p className="text-xs text-gray-400">Restaurant ID: {restaurantId}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowProfile(true)}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                <User size={16} />
                                <span>Profile</span>
                            </button>
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
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-sm text-gray-600">Today's Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</p>
                        <p className="text-xs text-gray-500">from {stats.completedOrders} completed orders</p>
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
                                    <span>View Orders ({orders.length})</span>
                                </button>
                            </div>
                        </div>

                        {/* Restaurant Info */}
                        <div className="bg-white rounded-lg shadow-sm border p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Restaurant Info</h3>
                            <div className="space-y-2 text-sm">
                                <p><strong>Name:</strong> {restaurant.name || 'Your Restaurant'}</p>
                                <p><strong>Cuisine:</strong> {restaurant.cuisine || 'Not set'}</p>
                                <p><strong>Status:</strong> 
                                    <span className={`ml-1 ${restaurant.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {restaurant.isApproved ? 'Approved' : 'Pending Approval'}
                                    </span>
                                </p>
                                <p><strong>Address:</strong> {restaurant.address || 'Not set'}</p>
                                <p><strong>Phone:</strong> {restaurant.phone || 'Not set'}</p>
                            </div>
                        </div>

                        {/* Recent Earnings */}
                        <div className="bg-white rounded-lg shadow-sm border p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Recent Earnings</h3>
                            <div className="space-y-2">
                                {earningsArray.slice(0, 3).map((earning, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span>{earning.date}</span>
                                        <span className="font-semibold text-green-600">{formatCurrency(earning.revenue)}</span>
                                    </div>
                                ))}
                                {earningsArray.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center">No earnings yet</p>
                                )}
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
                                <button
                                    onClick={() => setActiveTab('earnings')}
                                    className={`flex-1 py-4 font-medium ${
                                        activeTab === 'earnings' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600'
                                    }`}
                                >
                                    💰 Earnings
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                {/* Dashboard Tab */}
                                {activeTab === 'dashboard' && (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                                        
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
                                                                    {order.user?.name || order.customerId?.name || 'Customer'}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {new Date(order.createdAt).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <span className={`px-2 py-1 text-xs rounded ${
                                                                order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-2">
                                                            <span className="text-green-600 font-semibold">
                                                                {formatCurrency(order.total || order.totalAmount)}
                                                            </span>
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
                                        <h2 className="text-xl font-bold text-gray-900 mb-6">All Orders ({orders.length})</h2>
                                        
                                        {orders.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                                                <p className="text-gray-500">No orders yet</p>
                                                <p className="text-sm text-gray-400 mt-2">Orders will appear here when customers place them</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {orders.map((order) => (
                                                    <div key={order._id} className="border rounded-lg p-4">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h3 className="font-semibold text-gray-900">
                                                                    Order #{order.orderId || order._id}
                                                                </h3>
                                                                <p className="text-sm text-gray-600">
                                                                    {order.user?.name || order.customerId?.name || 'Customer'} • 
                                                                    {new Date(order.createdAt).toLocaleDateString()} • 
                                                                    {new Date(order.createdAt).toLocaleTimeString()}
                                                                </p>
                                                            </div>
                                                            <span className={`px-2 py-1 text-xs rounded ${
                                                                order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>

                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="text-sm text-gray-600">
                                                                    {order.deliveryAddress || 'No address provided'}
                                                                </p>
                                                                <p className="text-lg font-bold text-green-600">
                                                                    {formatCurrency(order.total || order.totalAmount)}
                                                                </p>
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
                                                                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                                                                    >
                                                                        Start Preparing
                                                                    </button>
                                                                )}
                                                                {order.status === 'preparing' && (
                                                                    <button 
                                                                        onClick={() => handleUpdateOrderStatus(order._id, 'ready')}
                                                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
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
                                            <h2 className="text-xl font-bold text-gray-900">Menu Items ({menuItems.length})</h2>
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
                                                                <p className="text-sm text-gray-600 capitalize">{item.category}</p>
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

                                {/* Earnings Tab */}
                                {activeTab === 'earnings' && (
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-6">Earnings Overview</h2>
                                        
                                        {earningsArray.length === 0 ? (
                                            <div className="text-center py-8">
                                                <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                                                <p className="text-gray-500">No earnings data available</p>
                                                <p className="text-sm text-gray-400 mt-2">Earnings will appear here when orders are completed</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {earningsArray.map((earning, index) => (
                                                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                                                            <p className="text-sm font-medium text-gray-600">{earning.date}</p>
                                                            <p className="text-xl font-bold text-gray-900">{formatCurrency(earning.revenue)}</p>
                                                            <p className="text-xs text-gray-500">{earning.orders} orders</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <h4 className="font-semibold text-blue-900 mb-2">💰 Total Revenue</h4>
                                                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.totalRevenue)}</p>
                                                    <p className="text-sm text-blue-700">From {stats.completedOrders} completed orders</p>
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

            {/* Profile Modal */}
            {showProfile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">🏪 Restaurant Profile</h3>
                                <button onClick={() => setShowProfile(false)} className="text-gray-500 hover:text-gray-700">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Restaurant Basic Info (Read-only) */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h4 className="font-semibold text-gray-900 mb-3">📋 Basic Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p><strong>Restaurant Name:</strong> {restaurant.name}</p>
                                        <p><strong>Cuisine:</strong> {restaurant.cuisine}</p>
                                    </div>
                                    <div>
                                        <p><strong>Phone:</strong> {restaurant.phone}</p>
                                        <p><strong>Email:</strong> {restaurant.email}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p><strong>Address:</strong> {restaurant.address}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">* These details are set during registration and cannot be changed</p>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                {/* Restaurant Images */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image URL</label>
                                        <input
                                            type="url"
                                            value={profileData.image}
                                            onChange={(e) => setProfileData({...profileData, image: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="https://example.com/profile.jpg"
                                        />
                                        {profileData.image && (
                                            <img src={profileData.image} alt="Profile" className="mt-2 w-20 h-20 object-cover rounded-lg" />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image URL</label>
                                        <input
                                            type="url"
                                            value={profileData.bannerImage}
                                            onChange={(e) => setProfileData({...profileData, bannerImage: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="https://example.com/banner.jpg"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={profileData.description}
                                        onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Describe your restaurant, specialties, etc."
                                    />
                                </div>

                                {/* Delivery Settings */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time</label>
                                        <input
                                            type="text"
                                            value={profileData.deliveryTime}
                                            onChange={(e) => setProfileData({...profileData, deliveryTime: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="25-35 min"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Fee (₱)</label>
                                        <input
                                            type="number"
                                            value={profileData.deliveryFee}
                                            onChange={(e) => setProfileData({...profileData, deliveryFee: parseFloat(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="35"
                                        />
                                    </div>
                                </div>

                                {/* Opening Hours */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Opening Hours</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Open Time</label>
                                            <input
                                                type="time"
                                                value={profileData.openingHours.open}
                                                onChange={(e) => setProfileData({
                                                    ...profileData, 
                                                    openingHours: {...profileData.openingHours, open: e.target.value}
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Close Time</label>
                                            <input
                                                type="time"
                                                value={profileData.openingHours.close}
                                                onChange={(e) => setProfileData({
                                                    ...profileData, 
                                                    openingHours: {...profileData.openingHours, close: e.target.value}
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowProfile(false)}
                                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2"
                                    >
                                        <Save size={16} />
                                        <span>Save Profile</span>
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
                                    <p><strong>Status:</strong> 
                                        <span className={`ml-2 px-2 py-1 text-xs rounded ${
                                            selectedOrder.status === 'delivered' || selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {selectedOrder.status}
                                        </span>
                                    </p>
                                    <p><strong>Total Amount:</strong> {formatCurrency(selectedOrder.total || selectedOrder.totalAmount)}</p>
                                    <p><strong>Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                                    <p><strong>Name:</strong> {selectedOrder.user?.name || selectedOrder.customerId?.name || 'Customer'}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.user?.phone || selectedOrder.customerId?.phone || 'No phone'}</p>
                                    <p><strong>Address:</strong> {selectedOrder.deliveryAddress || 'No address'}</p>
                                </div>

                                {selectedOrder.items && selectedOrder.items.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                                        {selectedOrder.items.map((item, index) => (
                                            <div key={index} className="flex justify-between border-b py-2">
                                                <div>
                                                    <span>{item.quantity}x {item.product?.name || item.productName}</span>
                                                    {item.product?.category && (
                                                        <span className="text-xs text-gray-500 ml-2">({item.product.category})</span>
                                                    )}
                                                </div>
                                                <span>{formatCurrency(item.price)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between border-t pt-2 mt-2 font-semibold">
                                            <span>Total:</span>
                                            <span>{formatCurrency(selectedOrder.total || selectedOrder.totalAmount)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex space-x-3 pt-4">
                                    {selectedOrder.status === 'pending' && (
                                        <button
                                            onClick={() => {
                                                handleUpdateOrderStatus(selectedOrder._id, 'confirmed');
                                                setShowOrderDetails(false);
                                            }}
                                            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                        >
                                            Accept Order
                                        </button>
                                    )}
                                    {selectedOrder.status === 'confirmed' && (
                                        <button
                                            onClick={() => {
                                                handleUpdateOrderStatus(selectedOrder._id, 'preparing');
                                                setShowOrderDetails(false);
                                            }}
                                            className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                                        >
                                            Start Preparing
                                        </button>
                                    )}
                                    {selectedOrder.status === 'preparing' && (
                                        <button
                                            onClick={() => {
                                                handleUpdateOrderStatus(selectedOrder._id, 'ready');
                                                setShowOrderDetails(false);
                                            }}
                                            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                                        >
                                            Mark Ready
                                        </button>
                                    )}
                                    {(selectedOrder.user?.phone || selectedOrder.customerId?.phone) && (
                                        <a
                                            href={`tel:${selectedOrder.user?.phone || selectedOrder.customerId?.phone}`}
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