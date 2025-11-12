import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Main Customer Dashboard Component
const CustomerDashboard = () => {
    const { user, login, logout, loading: authLoading } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [restaurants, setRestaurants] = useState([]);
    const [loadingRestaurants, setLoadingRestaurants] = useState(true);

    // Fetch REAL restaurants from API
    useEffect(() => {
        const fetchRestaurants = async () => {
            setLoadingRestaurants(true);
            try {
                const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/restaurants');
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Restaurants data:', data);
                    setRestaurants(data || []);
                } else {
                    console.log('❌ No restaurants found');
                    setRestaurants([]);
                }
            } catch (error) {
                console.error('❌ Error fetching restaurants:', error);
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

    // Simple Login Form
    const LoginForm = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            await handleLogin(email, password);
        };

        return (
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        placeholder="Email"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        placeholder="Password"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-red-800 text-white py-3 rounded-lg font-semibold"
                    >
                        LOGIN
                    </button>
                </form>
            </div>
        );
    };

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
            {/* Simple Header */}
            <header className="bg-white shadow-md p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-red-800">FOODEXPRESS</h1>
                    
                    {user ? (
                        <div className="flex items-center space-x-4">
                            <span>Welcome, {user.name}!</span>
                            <button 
                                onClick={logout}
                                className="bg-red-800 text-white px-4 py-2 rounded"
                            >
                                LOGOUT
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowAuthModal(true)}
                            className="bg-red-800 text-white px-4 py-2 rounded"
                        >
                            LOGIN
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Restaurants</h2>
                
                {loadingRestaurants ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading restaurants...</p>
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">No restaurants available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {restaurants.map(restaurant => (
                            <div key={restaurant._id || restaurant.id} className="bg-white rounded-lg shadow-md p-4">
                                <h3 className="text-xl font-bold text-gray-900">{restaurant.name}</h3>
                                <p className="text-gray-600">{restaurant.address}</p>
                                <p className="text-gray-500">{restaurant.cuisine}</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>

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