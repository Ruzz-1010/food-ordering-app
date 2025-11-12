import React, { useState, useEffect } from 'react';
import { 
    Search, MapPin, Clock, Star, 
    ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Login Form Component
const LoginForm = ({ onLogin, onSwitchToRegister, onClose, loading }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const result = await onLogin(email, password);
        if (!result.success) {
            setError(result.message);
        } else {
            onClose();
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-8">
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

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800"
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-800 text-white py-3 rounded-lg font-semibold hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Signing in...' : 'SIGN IN TO ORDER'}
                </button>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="text-red-800 hover:text-red-900 font-medium"
                        disabled={loading}
                    >
                        Don't have an account? Sign up now
                    </button>
                </div>
            </form>
        </div>
    );
};

// Restaurant Card Component
const RestaurantCard = ({ restaurant, onOrderClick, user }) => {
    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200">
            <div className="h-48 bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center">
                <span className="text-white text-4xl">🏪</span>
            </div>
            
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{restaurant.name}</h3>
                    <div className="flex items-center space-x-1">
                        <Star size={16} className="text-yellow-400 fill-current" />
                        <span className="text-sm font-bold">4.5</span>
                    </div>
                </div>
                
                <div className="flex items-center text-gray-600 text-sm mb-3">
                    <MapPin size={14} className="mr-1 text-red-800" />
                    <span>{restaurant.address}</span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span className="bg-gray-100 px-3 py-1 rounded">Fast Food</span>
                    <span className="text-green-600 font-semibold flex items-center">
                        <Clock size={14} className="mr-1" />
                        20-30 min
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-red-800 font-bold text-lg">₱35 delivery</span>
                    <button
                        onClick={() => onOrderClick(restaurant)}
                        className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!user}
                    >
                        {user ? 'ORDER' : 'LOGIN TO ORDER'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Customer Dashboard Component
const CustomerDashboard = () => {
    const { user, login, logout, loading: authLoading } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [restaurants, setRestaurants] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingRestaurants, setLoadingRestaurants] = useState(true);

    // Fetch REAL restaurants from API
    useEffect(() => {
        const fetchRestaurants = async () => {
            setLoadingRestaurants(true);
            try {
                const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/restaurants');
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Restaurants data:', data);
                    setRestaurants(data || []);
                } else {
                    console.log('No restaurants found');
                    setRestaurants([]);
                }
            } catch (error) {
                console.error('Error fetching restaurants:', error);
                setRestaurants([]);
            } finally {
                setLoadingRestaurants(false);
            }
        };

        fetchRestaurants();
    }, []);

    const handleLogin = async (email, password) => {
        return await login(email, password);
    };

    const handleOrderClick = (restaurant) => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        alert(`Ordering from ${restaurant.name}`);
    };

    const filteredRestaurants = restaurants.filter(restaurant =>
        restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
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
                                    <button className="relative flex items-center space-x-2 text-gray-700 hover:text-red-800">
                                        <ShoppingCart size={24} />
                                        <span className="font-medium">CART</span>
                                    </button>
                                    
                                    <button 
                                        onClick={logout}
                                        className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 transition-colors shadow-md"
                                    >
                                        LOGOUT
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <button 
                                        onClick={() => setShowAuthModal(true)}
                                        className="text-gray-700 hover:text-red-800 font-medium"
                                    >
                                        LOGIN
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-100 border-t border-b border-gray-200 py-4">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center space-x-4">
                            <div className="flex-1 max-w-2xl">
                                <div className="relative">
                                    <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search for restaurants..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-red-800 focus:border-red-800"
                                    />
                                </div>
                            </div>
                            <button className="flex items-center space-x-2 bg-red-800 text-white px-6 py-3 rounded hover:bg-red-900 transition-colors">
                                <Search size={16} />
                                <span>SEARCH</span>
                            </button>
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
                ) : filteredRestaurants.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">No restaurants available yet.</p>
                        <p className="text-gray-500">Check back later or add restaurants in the admin panel.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredRestaurants.map(restaurant => (
                            <RestaurantCard 
                                key={restaurant._id || restaurant.id}
                                restaurant={restaurant}
                                onOrderClick={handleOrderClick}
                                user={user}
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
                    <LoginForm 
                        onLogin={handleLogin}
                        onSwitchToRegister={() => {}}
                        onClose={() => setShowAuthModal(false)}
                        loading={authLoading}
                    />
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;