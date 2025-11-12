import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Main Customer Dashboard Component
const CustomerDashboard = () => {
    const { user, login, logout, loading: authLoading } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [restaurants, setRestaurants] = useState([]);
    const [loadingRestaurants, setLoadingRestaurants] = useState(true);
    const [apiError, setApiError] = useState('');

    // Fetch REAL restaurants from API with proper error handling
    useEffect(() => {
        const fetchRestaurants = async () => {
            setLoadingRestaurants(true);
            setApiError('');
            try {
                const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/restaurants');
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Restaurants API response:', data);
                    
                    // Handle different response formats
                    if (Array.isArray(data)) {
                        setRestaurants(data);
                    } else if (data && Array.isArray(data.restaurants)) {
                        setRestaurants(data.restaurants);
                    } else if (data && typeof data === 'object') {
                        // If it's a single restaurant object, wrap in array
                        setRestaurants([data]);
                    } else {
                        setRestaurants([]);
                        setApiError('Invalid restaurants data format');
                    }
                } else {
                    setApiError(`API Error: ${response.status} ${response.statusText}`);
                    setRestaurants([]);
                }
            } catch (error) {
                console.error('❌ Error fetching restaurants:', error);
                setApiError('Network error loading restaurants');
                setRestaurants([]);
            } finally {
                setLoadingRestaurants(false);
            }
        };

        fetchRestaurants();
    }, []);

    const handleLogin = async (email, password) => {
        const result = await login(email, password);
        if (result.success) {
            setShowAuthModal(false);
        }
        return result;
    };

    // Simple Login Form
    const LoginForm = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            setError('');
            
            const result = await handleLogin(email, password);
            if (!result.success) {
                setError(result.message);
            }
            setLoading(false);
        };

        return (
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
                <div className="text-center mb-6">
                    <div className="mx-auto h-16 w-16 bg-red-800 rounded-lg flex items-center justify-center shadow-md mb-4">
                        <span className="text-white font-bold text-xl">FX</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                    <p className="text-gray-600">Sign in to your FoodExpress account</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                            placeholder="Enter your email"
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                            placeholder="Enter your password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-800 text-white py-3 rounded-lg font-semibold hover:bg-red-900 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'SIGN IN'}
                    </button>
                </form>
            </div>
        );
    };

    // Restaurant Card Component
    const RestaurantCard = ({ restaurant }) => {
        return (
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200">
                <div className="h-48 bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center">
                    <span className="text-white text-4xl">🏪</span>
                </div>
                
                <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{restaurant.name || 'Restaurant Name'}</h3>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                        <span>📍 {restaurant.address || 'Address not specified'}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                        <span className="bg-gray-100 px-3 py-1 rounded">
                            {restaurant.cuisine || 'Various Cuisine'}
                        </span>
                        <span className="text-green-600 font-semibold">
                            🕒 20-30 min
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-red-800 font-bold text-lg">₱{restaurant.deliveryFee || '35'} delivery</span>
                        <button
                            onClick={() => alert(`Ordering from ${restaurant.name}`)}
                            className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900 transition-colors disabled:opacity-50"
                            disabled={!user}
                        >
                            {user ? 'ORDER' : 'LOGIN TO ORDER'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading application...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="bg-gray-800 text-white py-2">
                    <div className="max-w-7xl mx-auto px-4 text-center text-sm">
                        Free delivery on orders over ₱299! • ⭐ Rate your experience and get rewards
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-red-800 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                                FX
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-red-800">FOODEXPRESS</h1>
                                <p className="text-xs text-gray-600">Delivery Service</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-700">Welcome, {user.name}!</span>
                                    </div>
                                    <button className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 transition-colors shadow-md">
                                        🛒 CART
                                    </button>
                                    
                                    <button 
                                        onClick={logout}
                                        className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors"
                                    >
                                        LOGOUT
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => setShowAuthModal(true)}
                                    className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900 transition-colors shadow-md font-medium"
                                >
                                    LOGIN
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-red-800 to-red-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        DELICIOUS FOOD DELIVERED TO YOUR DOORSTEP
                    </h1>
                    <p className="text-lg md:text-xl mb-8 opacity-90">
                        Experience the best food delivery service in town
                    </p>
                    <button 
                        onClick={() => user ? console.log('Order now') : setShowAuthModal(true)}
                        className="bg-white text-red-800 px-8 py-4 rounded font-bold text-lg hover:bg-gray-100 transition-colors"
                    >
                        {user ? "ORDER NOW" : "LOGIN TO ORDER"}
                    </button>
                </div>
            </div>

            {/* Featured Restaurants */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">FEATURED RESTAURANTS</h2>
                </div>
                
                {loadingRestaurants ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading restaurants...</p>
                        </div>
                    </div>
                ) : apiError ? (
                    <div className="text-center py-12">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                            <p className="text-yellow-800 font-semibold mb-2">⚠️ API Error</p>
                            <p className="text-yellow-700 text-sm">{apiError}</p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : !Array.isArray(restaurants) ? (
                    <div className="text-center py-12">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                            <p className="text-red-800 font-semibold">❌ Data Format Error</p>
                            <p className="text-red-700 text-sm mt-2">
                                Expected array but got: {typeof restaurants}
                            </p>
                        </div>
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                            <p className="text-blue-800 font-semibold">🏪 No Restaurants Yet</p>
                            <p className="text-blue-700 text-sm mt-2">
                                No restaurants available in the database.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {restaurants.map((restaurant, index) => (
                            <RestaurantCard 
                                key={restaurant._id || restaurant.id || index}
                                restaurant={restaurant}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p>&copy; 2025 FoodExpress Delivery Service. All rights reserved.</p>
                </div>
            </footer>

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <LoginForm />
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;