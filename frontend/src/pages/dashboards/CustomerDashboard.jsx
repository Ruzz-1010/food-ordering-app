import React, { useState, useEffect } from 'react';
import { 
    Search, MapPin, Clock, Star, 
    ShoppingCart, Filter, Store, Bike, Navigation,
    Facebook, Twitter, Instagram, Youtube
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Map Component for Location Pinning
const LocationMap = ({ onLocationSelect, initialAddress = '' }) => {
    const [address, setAddress] = useState(initialAddress);
    const [coordinates, setCoordinates] = useState({ lat: 9.7392, lng: 118.7353 });

    const handleSearch = () => {
        if (!address.trim()) return;
        
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
            .then(response => response.json())
            .then(data => {
                if (data && data[0]) {
                    const lat = parseFloat(data[0].lat);
                    const lng = parseFloat(data[0].lon);
                    setCoordinates({ lat, lng });
                    onLocationSelect(data[0].display_name, lat, lng);
                }
            })
            .catch(error => {
                console.error('Error searching location:', error);
            });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Location
                </label>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                        placeholder="Enter your address"
                    />
                    <button
                        type="button"
                        onClick={handleSearch}
                        className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
                    >
                        <Search size={16} />
                    </button>
                </div>
            </div>

            <div className="border-2 border-gray-300 rounded-lg overflow-hidden h-64 relative">
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <Navigation size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600">Location Map</p>
                        <p className="text-sm text-gray-500">Enter your address above to set location</p>
                    </div>
                </div>
                
                <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-3 py-1 rounded text-sm">
                    📍 {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 flex items-center">
                    <MapPin size={16} className="mr-2" />
                    <span>Selected Location: {address || 'Enter your address above'}</span>
                </p>
            </div>
        </div>
    );
};

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
                    {loading ? 'Signing in...' : 'SIGN IN'}
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

// Customer Register Form Component
const CustomerRegisterForm = ({ onRegister, onSwitchToLogin, onSwitchToRestaurant, onSwitchToRider, onClose, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        role: 'customer'
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const result = await onRegister(formData);
        if (!result.success) {
            setError(result.message);
        } else {
            onClose();
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationSelect = (address, lat, lng) => {
        setFormData(prev => ({
            ...prev,
            address: address,
            location: { lat, lng }
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
                <div className="mx-auto h-16 w-16 bg-red-800 rounded-lg flex items-center justify-center shadow-md mb-4">
                    <span className="text-white font-bold text-xl">FX</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Join as Customer</h2>
                <p className="text-gray-600">Create your account to start ordering food</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Location
                    </label>
                    <LocationMap 
                        onLocationSelect={handleLocationSelect}
                        initialAddress={formData.address}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-800 text-white py-3 rounded-lg font-semibold hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating account...' : 'CREATE CUSTOMER ACCOUNT'}
                </button>

                <div className="text-center space-y-2">
                    <p className="text-gray-600 text-sm">Want to join as?</p>
                    <div className="flex justify-center space-x-4">
                        <button
                            type="button"
                            onClick={onSwitchToRestaurant}
                            className="text-red-800 hover:text-red-900 font-medium text-sm"
                            disabled={loading}
                        >
                            Restaurant Owner
                        </button>
                        <button
                            type="button"
                            onClick={onSwitchToRider}
                            className="text-red-800 hover:text-red-900 font-medium text-sm"
                            disabled={loading}
                        >
                            Delivery Rider
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-red-800 hover:text-red-900 font-medium text-sm"
                        disabled={loading}
                    >
                        Already have an account? Sign in
                    </button>
                </div>
            </form>
        </div>
    );
};

// Restaurant Register Form Component
const RestaurantRegisterForm = ({ onRegister, onSwitchToLogin, onSwitchToCustomer, onSwitchToRider, onClose, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        role: 'restaurant',
        restaurantName: '',
        cuisine: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const result = await onRegister(formData);
        if (!result.success) {
            setError(result.message);
        } else {
            onClose();
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationSelect = (address, lat, lng) => {
        setFormData(prev => ({
            ...prev,
            address: address,
            location: { lat, lng }
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
                <div className="mx-auto h-16 w-16 bg-orange-600 rounded-lg flex items-center justify-center shadow-md mb-4">
                    <Store className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Join as Restaurant</h2>
                <p className="text-gray-600">Register your restaurant and start serving customers</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
                    <input
                        type="text"
                        name="restaurantName"
                        value={formData.restaurantName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                        placeholder="Enter your restaurant name"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type</label>
                    <select
                        name="cuisine"
                        value={formData.cuisine}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                        required
                        disabled={loading}
                    >
                        <option value="">Select Cuisine</option>
                        <option value="Filipino">Filipino</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Korean">Korean</option>
                        <option value="American">American</option>
                        <option value="Italian">Italian</option>
                        <option value="Mexican">Mexican</option>
                        <option value="Fast Food">Fast Food</option>
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Seafood">Seafood</option>
                        <option value="Barbecue">Barbecue</option>
                        <option value="Desserts">Desserts</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                        placeholder="Enter owner's full name"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                        placeholder="Enter business email"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                        placeholder="09XXXXXXXXX"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Restaurant Location
                    </label>
                    <LocationMap 
                        onLocationSelect={handleLocationSelect}
                        initialAddress={formData.address}
                    />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Restaurant accounts require admin approval before you can start accepting orders.
                        This usually takes 24-48 hours.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating account...' : 'REGISTER RESTAURANT'}
                </button>

                <div className="text-center space-y-2">
                    <p className="text-gray-600 text-sm">Want to join as?</p>
                    <div className="flex justify-center space-x-4">
                        <button
                            type="button"
                            onClick={onSwitchToCustomer}
                            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                            disabled={loading}
                        >
                            Customer
                        </button>
                        <button
                            type="button"
                            onClick={onSwitchToRider}
                            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                            disabled={loading}
                        >
                            Delivery Rider
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                        disabled={loading}
                    >
                        Already have an account? Sign in
                    </button>
                </div>
            </form>
        </div>
    );
};

// Rider Register Form Component - FIXED VERSION
const RiderRegisterForm = ({ onRegister, onSwitchToLogin, onSwitchToCustomer, onSwitchToRestaurant, onClose, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        role: 'rider',
        vehicleType: 'motorcycle',
        licenseNumber: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        console.log('🚴 RIDER REGISTRATION DATA:', formData);
        
        // Validate required fields
        if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.address) {
            setError('Please fill in all required fields');
            return;
        }
        
        try {
            const result = await onRegister(formData);
            console.log('🚴 REGISTRATION RESULT:', result);
            
            if (!result.success) {
                setError(result.message || 'Registration failed. Please try again.');
            } else {
                console.log('✅ Rider registration successful!');
                alert('🎉 Rider account created successfully! Please wait for admin approval.');
                onClose();
            }
        } catch (error) {
            console.error('🚴 Registration error:', error);
            setError('Registration failed. Please try again.');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationSelect = (address, lat, lng) => {
        setFormData(prev => ({
            ...prev,
            address: address,
            location: { lat, lng }
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
                <div className="mx-auto h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center shadow-md mb-4">
                    <Bike className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Join as Rider</h2>
                <p className="text-gray-600">Become a delivery rider and start earning</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        placeholder="Enter your full name"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        placeholder="Create a password"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        placeholder="09XXXXXXXXX"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type *</label>
                    <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        required
                        disabled={loading}
                    >
                        <option value="motorcycle">Motorcycle</option>
                        <option value="bicycle">Bicycle</option>
                        <option value="car">Car</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Number (Optional)</label>
                    <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        placeholder="Enter license number if applicable"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Home Location *
                    </label>
                    <LocationMap 
                        onLocationSelect={handleLocationSelect}
                        initialAddress={formData.address}
                    />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Rider accounts require admin approval before you can start accepting delivery requests.
                        This usually takes 24-48 hours.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating account...' : 'REGISTER AS RIDER'}
                </button>

                <div className="text-center space-y-2">
                    <p className="text-gray-600 text-sm">Want to join as?</p>
                    <div className="flex justify-center space-x-4">
                        <button
                            type="button"
                            onClick={onSwitchToCustomer}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            disabled={loading}
                        >
                            Customer
                        </button>
                        <button
                            type="button"
                            onClick={onSwitchToRestaurant}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            disabled={loading}
                        >
                            Restaurant Owner
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
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
                    <h3 className="text-xl font-bold text-gray-900">{restaurant.name || 'Restaurant Name'}</h3>
                    <div className="flex items-center space-x-1">
                        <Star size={16} className="text-yellow-400 fill-current" />
                        <span className="text-sm font-bold">{restaurant.rating || '4.5'}</span>
                    </div>
                </div>
                
                <div className="flex items-center text-gray-600 text-sm mb-3">
                    <MapPin size={14} className="mr-1 text-red-800" />
                    <span>{restaurant.address || 'Address not specified'}</span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span className="bg-gray-100 px-3 py-1 rounded">{restaurant.cuisine || 'Various Cuisine'}</span>
                    <span className="text-green-600 font-semibold flex items-center">
                        <Clock size={14} className="mr-1" />
                        {restaurant.deliveryTime || '20-30 min'}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-red-800 font-bold text-lg">₱{restaurant.deliveryFee || '35'} delivery</span>
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
    const [apiError, setApiError] = useState('');

    useEffect(() => {
        const fetchRestaurants = async () => {
            setLoadingRestaurants(true);
            setApiError('');
            try {
                const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/restaurants');
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(' REAL Restaurants API response:', data);
                    
                    if (Array.isArray(data)) {
                        setRestaurants(data);
                    } else if (data && Array.isArray(data.restaurants)) {
                        setRestaurants(data.restaurants);
                    } else if (data && typeof data === 'object') {
                        setRestaurants([data]);
                    } else {
                        setRestaurants([]);
                        setApiError('No restaurants data available');
                    }
                } else {
                    setApiError('Failed to load restaurants from server');
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
    };

    const filteredRestaurants = restaurants.filter(restaurant =>
        restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine?.toLowerCase().includes(searchQuery.toLowerCase())
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
                                        {user.role === 'restaurant' && (
                                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                                Restaurant
                                            </span>
                                        )}
                                        {user.role === 'rider' && (
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                Rider
                                            </span>
                                        )}
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
                                    <div className="relative group">
                                        <button 
                                            className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 transition-colors shadow-md"
                                        >
                                            SIGN UP
                                        </button>
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 hidden group-hover:block z-50">
                                            <button 
                                                onClick={() => { setShowAuthModal(true); setAuthMode('customer'); }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                                            >
                                                 As Customer
                                            </button>
                                            <button 
                                                onClick={() => { setShowAuthModal(true); setAuthMode('restaurant'); }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                                            >
                                                 As Restaurant
                                            </button>
                                            <button 
                                                onClick={() => { setShowAuthModal(true); setAuthMode('rider'); }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                                            >
                                                 As Rider
                                            </button>
                                        </div>
                                    </div>
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
                ) : apiError ? (
                    <div className="text-center py-12">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                            <p className="text-yellow-800 font-semibold mb-2"> API Connection</p>
                            <p className="text-yellow-700 text-sm">{apiError}</p>
                            <p className="text-yellow-600 text-xs mt-2">Using real-time data from your database</p>
                        </div>
                    </div>
                ) : filteredRestaurants.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                            <p className="text-blue-800 font-semibold"> No Restaurants Yet</p>
                            <p className="text-blue-700 text-sm mt-2">
                                No restaurants found in your database. Add restaurants via admin panel.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredRestaurants.map((restaurant, index) => (
                            <RestaurantCard 
                                key={restaurant._id || restaurant.id || index}
                                restaurant={restaurant}
                                onOrderClick={handleOrderClick}
                                user={user}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-gray-100 py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Join Our Community</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-xl shadow-md p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🍽️</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Food Lover</h3>
                            <p className="text-gray-600 mb-4">Order from your favorite restaurants and enjoy delicious meals delivered to your door.</p>
                            <button 
                                onClick={() => { setShowAuthModal(true); setAuthMode('customer'); }}
                                className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900 transition-colors"
                            >
                                Join as Customer
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6 text-center">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Store className="text-orange-600" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Restaurant Owner</h3>
                            <p className="text-gray-600 mb-4">Reach more customers and grow your business with our delivery platform.</p>
                            <button 
                                onClick={() => { setShowAuthModal(true); setAuthMode('restaurant'); }}
                                className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition-colors"
                            >
                                Join as Restaurant
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6 text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bike className="text-blue-600" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Delivery Rider</h3>
                            <p className="text-gray-600 mb-4">Earn money by delivering food to customers in your area. Flexible hours available.</p>
                            <button 
                                onClick={() => { setShowAuthModal(true); setAuthMode('rider'); }}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                            >
                                Join as Rider
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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

            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    {authMode === 'login' ? (
                        <LoginForm 
                            onLogin={handleLogin}
                            onSwitchToRegister={() => setAuthMode('customer')}
                            onClose={() => setShowAuthModal(false)}
                            loading={authLoading}
                        />
                    ) : authMode === 'customer' ? (
                        <CustomerRegisterForm 
                            onRegister={handleRegister}
                            onSwitchToLogin={() => setAuthMode('login')}
                            onSwitchToRestaurant={() => setAuthMode('restaurant')}
                            onSwitchToRider={() => setAuthMode('rider')}
                            onClose={() => setShowAuthModal(false)}
                            loading={authLoading}
                        />
                    ) : authMode === 'restaurant' ? (
                        <RestaurantRegisterForm 
                            onRegister={handleRegister}
                            onSwitchToLogin={() => setAuthMode('login')}
                            onSwitchToCustomer={() => setAuthMode('customer')}
                            onSwitchToRider={() => setAuthMode('rider')}
                            onClose={() => setShowAuthModal(false)}
                            loading={authLoading}
                        />
                    ) : (
                        <RiderRegisterForm 
                            onRegister={handleRegister}
                            onSwitchToLogin={() => setAuthMode('login')}
                            onSwitchToCustomer={() => setAuthMode('customer')}
                            onSwitchToRestaurant={() => setAuthMode('restaurant')}
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