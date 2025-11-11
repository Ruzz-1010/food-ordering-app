// pages/dashboards/CustomerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
    Search, MapPin, Clock, Star, 
    ShoppingCart, Filter,
    Facebook, Twitter, Instagram, Youtube
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

// Register Form Component
const RegisterForm = ({ onRegister, onSwitchToLogin, onClose, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const result = await onRegister(formData);
        if (!result.success) {
            setError(result.message);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-8">
                <div className="mx-auto h-16 w-16 bg-red-800 rounded-lg flex items-center justify-center shadow-md mb-4">
                    <span className="text-white font-bold text-xl">FX</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Join FoodExpress</h2>
                <p className="text-gray-600">Create your account to start ordering</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800"
                        placeholder="Enter your full name"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800"
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800"
                        placeholder="Create a password"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800"
                        placeholder="09XXXXXXXXX"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800"
                        placeholder="Enter your delivery address"
                        required
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-800 text-white py-3 rounded-lg font-semibold hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating account...' : 'CREATE ACCOUNT & START ORDERING'}
                </button>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-red-800 hover:text-red-900 font-medium"
                        disabled={loading}
                    >
                        Already have an account? Sign in
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
                <span className="text-white text-4xl">🍕</span>
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
    const { user, login, register, logout, loading: authLoading } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [restaurants, setRestaurants] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingRestaurants, setLoadingRestaurants] = useState(true);

    useEffect(() => {
        // Simulate API call to get restaurants
        const fetchRestaurants = async () => {
            setLoadingRestaurants(true);
            try {
                // Replace with actual API call
                // const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/restaurants');
                // const data = await response.json();
                // setRestaurants(data);
                
                setTimeout(() => {
                    setRestaurants([
                        {
                            id: 1,
                            name: "McDonald's",
                            address: "123 Main Street, City",
                            cuisine: "Fast Food",
                            deliveryTime: "20-30 min",
                            rating: 4.5,
                            deliveryFee: 35
                        },
                        {
                            id: 2,
                            name: "Jollibee",
                            address: "456 Oak Avenue, City",
                            cuisine: "Filipino",
                            deliveryTime: "25-35 min",
                            rating: 4.7,
                            deliveryFee: 35
                        },
                        {
                            id: 3,
                            name: "Pizza Hut",
                            address: "789 Pine Road, City",
                            cuisine: "Pizza",
                            deliveryTime: "30-40 min",
                            rating: 4.3,
                            deliveryFee: 35
                        },
                        {
                            id: 4,
                            name: "KFC",
                            address: "321 Elm Street, City",
                            cuisine: "Fried Chicken",
                            deliveryTime: "20-30 min",
                            rating: 4.4,
                            deliveryFee: 35
                        }
                    ]);
                    setLoadingRestaurants(false);
                }, 1000);
            } catch (error) {
                console.error('Error fetching restaurants:', error);
                setRestaurants([
                    {
                        id: 1,
                        name: "McDonald's",
                        address: "123 Main Street, City",
                        cuisine: "Fast Food",
                        deliveryTime: "20-30 min",
                        rating: 4.5,
                        deliveryFee: 35
                    },
                    {
                        id: 2,
                        name: "Jollibee",
                        address: "456 Oak Avenue, City",
                        cuisine: "Filipino",
                        deliveryTime: "25-35 min",
                        rating: 4.7,
                        deliveryFee: 35
                    }
                ]);
                setLoadingRestaurants(false);
            }
        };

        fetchRestaurants();
    }, []); // Empty dependency array is now safe

    const handleLogin = async (email, password) => {
        return await login(email, password);
    };

    const handleRegister = async (formData) => {
        return await register(formData);
    };

    const handleOrderClick = (restaurant) => {
        if (!user) {
            setShowAuthModal(true);
            setAuthMode('login');
            return;
        }
        alert(`Ordering from ${restaurant.name}`);
        // Here you can navigate to restaurant menu page
    };

    const filteredRestaurants = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
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

                        <nav className="hidden lg:flex items-center space-x-8">
                            <button className="font-semibold text-sm text-red-800 border-b-2 border-red-800">HOME</button>
                            <button className="font-semibold text-sm text-gray-700 hover:text-red-800">RESTAURANTS</button>
                            <button className="font-semibold text-sm text-gray-700 hover:text-red-800">MY ORDERS</button>
                            <button className="font-semibold text-sm text-gray-700 hover:text-red-800">TRACK ORDER</button>
                            <button className="font-semibold text-sm text-gray-700 hover:text-red-800">PROFILE</button>
                        </nav>

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
                                        onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                                        className="text-gray-700 hover:text-red-800 font-medium"
                                    >
                                        LOGIN
                                    </button>
                                    <button 
                                        onClick={() => { setShowAuthModal(true); setAuthMode('register'); }}
                                        className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 transition-colors shadow-md"
                                    >
                                        SIGN UP
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
                                        placeholder="Search for restaurants, cuisines, or dishes..." 
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
                            <button className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-3 rounded hover:border-red-800 transition-colors">
                                <Filter size={16} />
                                <span className="font-semibold">FILTER</span>
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
                    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <button 
                            onClick={() => user ? console.log('Order now') : setShowAuthModal(true)}
                            className="bg-white text-red-800 px-8 py-4 rounded font-bold text-lg hover:bg-gray-100 transition-colors"
                        >
                            {user ? "ORDER NOW" : "LOGIN TO ORDER"}
                        </button>
                        <button className="border-2 border-white text-white px-8 py-4 rounded font-bold text-lg hover:bg-white hover:text-red-800 transition-colors">
                            BROWSE RESTAURANTS
                        </button>
                    </div>
                </div>
            </div>

            {/* Featured Restaurants */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">FEATURED RESTAURANTS</h2>
                    <button className="text-red-800 hover:text-red-900 font-semibold">
                        VIEW ALL →
                    </button>
                </div>
                
                {loadingRestaurants ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading restaurants...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredRestaurants.map(restaurant => (
                            <RestaurantCard 
                                key={restaurant.id}
                                restaurant={restaurant}
                                onOrderClick={handleOrderClick}
                                user={user}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Special Offer */}
            <div className="bg-red-800 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-4">SPECIAL OFFER!</h2>
                    <p className="text-xl mb-6">Get 20% OFF on your first order with promo code: WELCOME20</p>
                    <button 
                        onClick={() => user ? console.log('Grab offer') : setShowAuthModal(true)}
                        className="bg-white text-red-800 px-8 py-3 rounded font-bold text-lg hover:bg-gray-100 transition-colors"
                    >
                        {user ? "GRAB THIS OFFER" : "LOGIN TO GET OFFER"}
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">FOODEXPRESS</h3>
                            <p className="text-gray-400 mb-4">
                                Delivering delicious food to your doorstep with the best quality and service.
                            </p>
                            <div className="flex space-x-4">
                                {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                                    <Icon 
                                        key={index}
                                        size={20} 
                                        className="text-gray-400 hover:text-white cursor-pointer" 
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-white mb-4">QUICK LINKS</h4>
                            <ul className="space-y-2 text-gray-400">
                                {['About Us', 'Contact Us', 'FAQs', 'Privacy Policy'].map((link, index) => (
                                    <li key={index}>
                                        <button className="hover:text-white transition-colors">
                                            {link}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4">CONTACT INFO</h4>
                            <div className="space-y-2 text-gray-400">
                                <div className="flex items-center space-x-2 hover:text-white transition-colors">
                                    <span>📞 09105019330</span>
                                </div>
                                <div className="flex items-center space-x-2 hover:text-white transition-colors">
                                    <span>✉️ foodexpress@delivery.com</span>
                                </div>
                                <div className="flex items-center space-x-2 hover:text-white transition-colors">
                                    <span>📍 Puerto Princesa City, Philippines</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4">NEWSLETTER</h4>
                            <p className="text-gray-400 mb-4">Subscribe to get special offers and updates</p>
                            <div className="flex">
                                <input 
                                    type="email" 
                                    placeholder="Your email" 
                                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l focus:outline-none focus:border-red-800 transition-colors"
                                />
                                <button className="bg-red-800 text-white px-4 py-2 rounded-r hover:bg-red-900 transition-colors">
                                    SUBSCRIBE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
                            <p>&copy; 2025 FoodExpress Delivery Service. All rights reserved.</p>
                            <div className="flex space-x-4 mt-2 md:mt-0">
                                {['Terms & Conditions', 'Privacy Policy', 'Sitemap'].map((item, index) => (
                                    <span 
                                        key={index}
                                        className="hover:text-white transition-colors cursor-pointer"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    {authMode === 'login' ? (
                        <LoginForm 
                            onLogin={handleLogin}
                            onSwitchToRegister={() => setAuthMode('register')}
                            onClose={() => setShowAuthModal(false)}
                            loading={authLoading}
                        />
                    ) : (
                        <RegisterForm 
                            onRegister={handleRegister}
                            onSwitchToLogin={() => setAuthMode('login')}
                            onClose={() => setShowAuthModal(false)}
                            loading={authLoading}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;