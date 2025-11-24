import React, { useState, useEffect } from 'react';
import { 
    Search, MapPin, Clock, Star, 
    ShoppingCart, Filter, Store, Bike, Navigation,
    Facebook, Twitter, Instagram, Youtube,
    Plus, Minus, X, Package, User, History,
    Phone, Mail, Map, Home, Settings, LogOut,
    BarChart3, Users, DollarSign, ChevronDown,
    Eye, Edit, Trash2, CheckCircle, XCircle,
    Truck, CreditCard, MessageCircle, Heart,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Utility function for auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// Cart Hook for State Management
const useCart = () => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart from localStorage on component mount
    useEffect(() => {
        const savedCart = localStorage.getItem('foodexpress_cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    // Save cart to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('foodexpress_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, restaurant) => {
        setCart(prevCart => {
            // Check if we're adding from a different restaurant
            const differentRestaurantItem = prevCart.find(item => 
                item.restaurant._id !== restaurant._id
            );

            if (differentRestaurantItem) {
                const confirmReplace = window.confirm(
                    `Your cart contains items from ${differentRestaurantItem.restaurant.name}. ` +
                    `Adding items from ${restaurant.name} will clear your current cart. Continue?`
                );
                
                if (!confirmReplace) {
                    return prevCart;
                }
                // Replace entire cart with new item
                return [{
                    product,
                    restaurant,
                    quantity: 1
                }];
            }

            // Same restaurant - add or update item
            const existingItem = prevCart.find(item => 
                item.product._id === product._id && item.restaurant._id === restaurant._id
            );

            if (existingItem) {
                return prevCart.map(item =>
                    item.product._id === product._id && item.restaurant._id === restaurant._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevCart, {
                    product,
                    restaurant,
                    quantity: 1,
                    addedAt: new Date().toISOString()
                }];
            }
        });
    };

    const removeFromCart = (productId, restaurantId) => {
        setCart(prevCart => 
            prevCart.filter(item => 
                !(item.product._id === productId && item.restaurant._id === restaurantId)
            )
        );
    };

    const updateQuantity = (productId, restaurantId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId, restaurantId);
            return;
        }

        setCart(prevCart =>
            prevCart.map(item =>
                item.product._id === productId && item.restaurant._id === restaurantId
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    };

    const getCartItemCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    const getCurrentRestaurant = () => {
        if (cart.length === 0) return null;
        return cart[0].restaurant;
    };

    return {
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
        getCurrentRestaurant
    };
};

// Image Slideshow Component for Hero Section
const HeroSlideshow = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    
    // Optimized food images - cropped and focused on food
    const slides = [
        {
            id: 1,
            image: "https://d3bjzufjcawald.cloudfront.net/public/web/2025-05-17/68283ae88bb40/McDo_Employer_Branding_2025_McDo_PH_Career_Portal_Banner_Web-banner.jpg",
            alt: "Mcdonalds"
        },
        {
            id: 2,
            image: "https://www.manginasal.ph/wp-content/uploads/2025/07/1920-x-470.png",
            alt: "Mang inasal"
        },
        {
            id: 3,
            image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgx41qCVW92irwBVq9gWwdO6MP_uGL7yZxsfpD-Pr_aFySu_yiK9PpNZAyDOuAkhv1qdQpAlYLnS4pjyJjyGQBwW9718xogeTSG7GcagV3x9VtC161qvW3K5ioyOjfJrIlGfOX4iEQVG_ZTQeyIlB_esY5eWl3WpwcT53SvT0xqczqWWFeei3MdL7seCLs/s1200/JOY%20ng%20Pamilya.jpg",
            alt: "Jollibee"
        },
        {
            id: 4,
            image: "https://img1.wsimg.com/isteam/ip/8e16088e-228d-4ec0-bf62-c38e1dd5a2ca/Screenshot%202025-01-04%20114708.png/:/cr=t:0.66%25,l:0%25,w:100%25,h:67.64%25/rs=w:515,h:234,cg:true",
            alt: "Ribshack"
        },
        {
            id: 5,
            image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600&crop=center",
            alt: "Breakfast Platter"
        }
    ];

    // Auto-advance slides
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000); // Change slide every 4 seconds

        return () => clearInterval(timer);
    }, [slides.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    return (
        <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[550px] overflow-hidden">
            {/* Slides */}
            <div 
                className="flex transition-transform duration-700 ease-in-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
                {slides.map((slide, index) => (
                    <div key={slide.id} className="w-full h-full flex-shrink-0 relative">
                        <img
                            src={slide.image}
                            alt={slide.alt}
                            className="w-full h-full object-cover"
                        />
                        {/* Darker overlay for better text readability */}
                        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 text-white p-1 sm:p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
            >
                <ChevronLeft size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 text-white p-1 sm:p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
            >
                <ChevronRight size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                            index === currentSlide 
                                ? 'bg-white scale-125' 
                                : 'bg-white bg-opacity-50'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

// Cart Component
const Cart = ({ cart, isOpen, onClose, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout, user }) => {
    if (!isOpen) return null;

    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const deliveryFee = subtotal > 299 ? 0 : 35;
    const serviceFee = Math.max(10, subtotal * 0.02);
    const grandTotal = subtotal + deliveryFee + serviceFee;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-md h-full overflow-y-auto">
                <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Your Cart</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <ShoppingCart size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">Your cart is empty</p>
                        <p className="text-gray-400 text-sm">Add some delicious items to get started!</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4">
                            {cart.map((item, index) => (
                                <div key={`${item.product._id}-${item.restaurant._id}`} 
                                     className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
                                    
                                    {/* Restaurant Header for first item */}
                                    {index === 0 || cart[index-1].restaurant._id !== item.restaurant._id ? (
                                        <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 rounded">
                                            <Store size={16} className="text-red-800" />
                                            <span className="font-semibold text-sm">{item.restaurant.name}</span>
                                        </div>
                                    ) : null}

                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                                            <p className="text-gray-600 text-sm">₱{item.product.price}</p>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => onUpdateQuantity(
                                                    item.product._id, 
                                                    item.restaurant._id, 
                                                    item.quantity - 1
                                                )}
                                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            
                                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                            
                                            <button
                                                onClick={() => onUpdateQuantity(
                                                    item.product._id, 
                                                    item.restaurant._id, 
                                                    item.quantity + 1
                                                )}
                                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-red-800 font-semibold">
                                            ₱{(item.product.price * item.quantity).toFixed(2)}
                                        </span>
                                        <button
                                            onClick={() => onRemoveItem(item.product._id, item.restaurant._id)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>₱{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Delivery Fee</span>
                                <span>₱{deliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Service Fee</span>
                                <span>₱{serviceFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>Total</span>
                                <span>₱{grandTotal.toFixed(2)}</span>
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={onCheckout}
                                    className="w-full bg-red-800 text-white py-3 rounded-lg font-semibold hover:bg-red-900 transition-colors"
                                >
                                    PROCEED TO CHECKOUT
                                </button>
                                <button
                                    onClick={onClearCart}
                                    className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    CLEAR CART
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Enhanced Map Component with OpenStreetMap
const LocationMap = ({ onLocationSelect, initialAddress = '' }) => {
    const [address, setAddress] = useState(initialAddress);
    const [coordinates, setCoordinates] = useState({ lat: 9.7392, lng: 118.7353 });
    const [loading, setLoading] = useState(false);

    // Get user's current location
    const getCurrentLocation = () => {
        setLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setCoordinates({ lat: latitude, lng: longitude });
                    
                    // Reverse geocode to get address
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                        );
                        const data = await response.json();
                        if (data && data.display_name) {
                            setAddress(data.display_name);
                            onLocationSelect(data.display_name, latitude, longitude);
                        }
                    } catch (error) {
                        console.error('Error reverse geocoding:', error);
                    }
                    setLoading(false);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setLoading(false);
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!address.trim()) return;
        
        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
            );
            const data = await response.json();
            if (data && data[0]) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setCoordinates({ lat, lng });
                onLocationSelect(data[0].display_name, lat, lng);
            } else {
                alert('Location not found. Please try a different address.');
            }
        } catch (error) {
            console.error('Error searching location:', error);
            alert('Error searching location. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Location
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 text-sm"
                        placeholder="Enter your full address"
                        disabled={loading}
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={loading || !address.trim()}
                            className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Search size={16} />
                            )}
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                            <Navigation size={16} />
                            Current
                        </button>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden h-64 relative bg-gray-100">
                <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng - 0.01}%2C${coordinates.lat - 0.01}%2C${coordinates.lng + 0.01}%2C${coordinates.lat + 0.01}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lng}`}
                    style={{ border: 0 }}
                    title="Location Map"
                />
                <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-3 py-1 rounded text-sm shadow">
                    📍 {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </div>
                
                {/* Map Attribution */}
                <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs">
                    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
                        © OpenStreetMap
                    </a>
                </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 flex items-center">
                    <MapPin size={16} className="mr-2 flex-shrink-0" />
                    <span>Selected Location: {address || 'Enter your address above or use current location'}</span>
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
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
                {/* Logo in Login Form - LARGER */}
                <div className="mx-auto mb-4 flex justify-center">
                    <img 
                        src="/logo.png" 
                        alt="FoodExpress Logo" 
                        className="h-20 w-auto"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className="h-20 w-20 bg-red-800 rounded-lg flex items-center justify-center shadow-md hidden">
                        <span className="text-white font-bold text-2xl">FX</span>
                    </div>
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
            location: { 
                type: 'Point',
                coordinates: [lng, lat]
            }
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
                {/* Logo in Register Form - LARGER */}
                <div className="mx-auto mb-4 flex justify-center">
                    <img 
                        src="/logo.png" 
                        alt="FoodExpress Logo" 
                        className="h-20 w-auto"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className="h-20 w-20 bg-red-800 rounded-lg flex items-center justify-center shadow-md hidden">
                        <span className="text-white font-bold text-2xl">FX</span>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Join as Customer</h2>
                <p className="text-gray-600">Create your account to start ordering food</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="text-center space-y-4">
                    <p className="text-gray-600">Want to join as?</p>
                    <div className="flex justify-center space-x-6">
                        <button
                            type="button"
                            onClick={onSwitchToRestaurant}
                            className="text-red-800 hover:text-red-900 font-medium"
                            disabled={loading}
                        >
                            Restaurant Owner
                        </button>
                        <button
                            type="button"
                            onClick={onSwitchToRider}
                            className="text-red-800 hover:text-red-900 font-medium"
                            disabled={loading}
                        >
                            Delivery Rider
                        </button>
                    </div>
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
            location: { 
                type: 'Point',
                coordinates: [lng, lat]
            }
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
                {/* Logo in Restaurant Register Form - LARGER */}
                <div className="mx-auto mb-4 flex justify-center">
                    <img 
                        src="/logo.png" 
                        alt="FoodExpress Logo" 
                        className="h-20 w-auto"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className="h-20 w-20 bg-orange-600 rounded-lg flex items-center justify-center shadow-md hidden">
                        <Store className="text-white" size={28} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Join as Restaurant</h2>
                <p className="text-gray-600">Register your restaurant and start serving customers</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="text-center space-y-4">
                    <p className="text-gray-600">Want to join as?</p>
                    <div className="flex justify-center space-x-6">
                        <button
                            type="button"
                            onClick={onSwitchToCustomer}
                            className="text-orange-600 hover:text-orange-700 font-medium"
                            disabled={loading}
                        >
                            Customer
                        </button>
                        <button
                            type="button"
                            onClick={onSwitchToRider}
                            className="text-orange-600 hover:text-orange-700 font-medium"
                            disabled={loading}
                        >
                            Delivery Rider
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                        disabled={loading}
                    >
                        Already have an account? Sign in
                    </button>
                </div>
            </form>
        </div>
    );
};

// Rider Register Form Component
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
        
        try {
            const result = await onRegister(formData);
            console.log('🚴 REGISTRATION RESULT:', result);
            
            if (!result.success) {
                setError(result.message || 'Registration failed. Please try again.');
            } else {
                if (result.needsApproval) {
                    alert('✅ Registration successful! Your rider account is pending admin approval. You will be notified once approved.');
                    onClose();
                } else {
                    console.log('✅ Rider registration successful and auto-logged in!');
                    onClose();
                }
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
            location: { 
                type: 'Point',
                coordinates: [lng, lat]
            }
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
                {/* Logo in Rider Register Form - LARGER */}
                <div className="mx-auto mb-4 flex justify-center">
                    <img 
                        src="/logo.png" 
                        alt="FoodExpress Logo" 
                        className="h-20 w-auto"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className="h-20 w-20 bg-blue-600 rounded-lg flex items-center justify-center shadow-md hidden">
                        <Bike className="text-white" size={28} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Join as Rider</h2>
                <p className="text-gray-600">Become a delivery rider and start earning</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="text-center space-y-4">
                    <p className="text-gray-600">Want to join as?</p>
                    <div className="flex justify-center space-x-6">
                        <button
                            type="button"
                            onClick={onSwitchToCustomer}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                            disabled={loading}
                        >
                            Customer
                        </button>
                        <button
                            type="button"
                            onClick={onSwitchToRestaurant}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                            disabled={loading}
                        >
                            Restaurant Owner
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                        disabled={loading}
                    >
                        Already have an account? Sign in
                    </button>
                </div>
            </form>
        </div>
    );
};

// RestaurantCard Component
const RestaurantCard = ({ restaurant, onAddToCart, user }) => {
    const [showProducts, setShowProducts] = useState(false);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [error, setError] = useState('');

    const fetchProducts = async () => {
        if (showProducts) {
            setShowProducts(false);
            setProducts([]);
            return;
        }
        
        setLoadingProducts(true);
        setError('');
        
        try {
            const restaurantId = restaurant._id || restaurant.id;
            
            if (!restaurantId) {
                setError('Restaurant ID not available');
                return;
            }

            const endpoint = `https://food-ordering-app-production-35eb.up.railway.app/api/products/restaurant/${restaurantId}`;
            
            const response = await fetch(endpoint);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.products) {
                    setProducts(data.products);
                    setShowProducts(true);
                } else {
                    setError('No menu items available');
                }
            } else {
                setError('Failed to load menu');
            }

        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Network error loading menu');
        } finally {
            setLoadingProducts(false);
        }
    };

    const closeMenu = () => {
        setShowProducts(false);
        setProducts([]);
    };

    const handleAddToCart = (product) => {
        if (!user) {
            alert('Please login to add items to cart');
            return;
        }
        onAddToCart(product, restaurant);
        alert(`✅ ${product.name} added to cart!`);
    };

    const handleQuickOrder = () => {
        if (!user) {
            alert('Please login to place an order');
            return;
        }
        
        if (products.length === 0) {
            alert('Please view the menu first to see available items');
            return;
        }

        const firstProduct = products[0];
        if (firstProduct) {
            onAddToCart(firstProduct, restaurant);
            alert(`✅ Quick order: ${firstProduct.name} added to cart! Proceed to checkout.`);
        }
    };

    return (
        <>
            {/* Restaurant Card (Normal View) */}
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200">
                <div className="h-40 bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center relative">
                    {restaurant.image ? (
                        <img 
                            src={restaurant.image} 
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-white text-3xl">🍕</span>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        {restaurant.cuisine || 'Food'}
                    </div>
                </div>
                
                <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{restaurant.name || 'Restaurant Name'}</h3>
                        <div className="flex items-center space-x-1">
                            <Star size={14} className="text-yellow-400 fill-current" />
                            <span className="text-sm font-bold">{restaurant.rating || '4.5'}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-xs mb-2">
                        <MapPin size={12} className="mr-1 text-red-800 flex-shrink-0" />
                        <span className="line-clamp-1">{restaurant.address || 'Puerto Princesa City'}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                        <span className="bg-gray-100 px-2 py-1 rounded">{restaurant.cuisine || 'Various'}</span>
                        <span className="text-green-600 font-semibold flex items-center">
                            <Clock size={12} className="mr-1" />
                            {restaurant.deliveryTime || '25-35 min'}
                        </span>
                    </div>

                    <button
                        onClick={fetchProducts}
                        disabled={loadingProducts}
                        className="w-full bg-red-800 text-white py-2 rounded-lg mb-2 hover:bg-red-900 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold text-sm"
                    >
                        {loadingProducts ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Loading Menu...</span>
                            </>
                        ) : (
                            <>
                                <span>📖 VIEW FULL MENU</span>
                            </>
                        )}
                    </button>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                        <span className="text-red-800 font-bold text-xs">₱{restaurant.deliveryFee || '35'} delivery</span>
                        <button
                            onClick={handleQuickOrder}
                            className="bg-red-800 text-white px-3 py-1 rounded text-xs hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!user}
                        >
                            {user ? 'QUICK ORDER' : 'LOGIN TO ORDER'}
                        </button>
                    </div>
                </div>
            </div>

            {/* FULL SCREEN MENU MODAL */}
            {showProducts && (
                <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
                    <div className="bg-red-800 text-white sticky top-0 z-10">
                        <div className="container mx-auto px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={closeMenu}
                                        className="p-1 hover:bg-red-900 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div>
                                        <h1 className="text-lg font-bold">{restaurant.name}</h1>
                                        <p className="text-red-100 text-xs">{restaurant.cuisine} • {restaurant.address}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center space-x-1 text-yellow-300">
                                        <Star size={16} className="fill-current" />
                                        <span className="font-bold">{restaurant.rating || '4.5'}</span>
                                    </div>
                                    <p className="text-red-100 text-xs">{products.length} items</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="container mx-auto px-4 py-4">
                        {error ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">{error}</p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No menu items available</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {products.map((product) => (
                                    <div 
                                        key={product._id} 
                                        className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="h-32 bg-gray-100 relative">
                                            {product.image ? (
                                                <img 
                                                    src={product.image} 
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-gray-400 text-4xl">🍽️</span>
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded-full">
                                                <span className="text-green-600 font-bold">₱{product.price}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="p-3">
                                            <div className="mb-2">
                                                <h3 className="font-bold text-gray-900 mb-1 text-sm">
                                                    {product.name}
                                                </h3>
                                                
                                                {product.description && (
                                                    <p className="text-gray-600 text-xs mb-2 leading-relaxed line-clamp-2">
                                                        {product.description}
                                                    </p>
                                                )}
                                                
                                                {product.ingredients && (
                                                    <div className="mb-2">
                                                        <p className="text-xs text-gray-500 font-semibold mb-1">Ingredients:</p>
                                                        <p className="text-gray-600 text-xs line-clamp-1">{product.ingredients}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-1">
                                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                        {product.category}
                                                    </span>
                                                    <span className="text-blue-600 text-xs flex items-center">
                                                        <Clock size={12} className="mr-1" />
                                                        {product.preparationTime || 15} min
                                                    </span>
                                                </div>
                                                
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={!user}
                                                    className="bg-red-800 text-white px-3 py-1 rounded font-semibold hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                                >
                                                    {user ? 'ADD TO CART' : 'LOGIN'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-100 border-t mt-4">
                        <div className="container mx-auto px-4 py-3">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                                <div>
                                    <p className="text-gray-600 text-sm">
                                        Showing <strong>{products.length}</strong> menu item{products.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={closeMenu}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-400 transition-colors text-sm"
                                    >
                                        CLOSE MENU
                                    </button>
                                    {user && products.length > 0 && (
                                        <button
                                            onClick={() => {
                                                const firstProduct = products[0];
                                                handleAddToCart(firstProduct);
                                                closeMenu();
                                            }}
                                            className="bg-red-800 text-white px-4 py-2 rounded font-semibold hover:bg-red-900 transition-colors text-sm"
                                        >
                                            ORDER NOW
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Track Order Component
const TrackOrder = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [trackingId, setTrackingId] = useState('');

    useEffect(() => {
        if (user) {
            fetchUserOrders();
        }
    }, [user]);

    const fetchUserOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Please login to view orders');
                setLoading(false);
                return;
            }

            const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/orders/user', {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📋 Orders API response:', data);
                
                if (data.success) {
                    setOrders(data.orders || []);
                } else {
                    setError(data.message || 'Failed to load orders');
                }
            } else {
                const errorText = await response.text();
                console.error('Orders API error:', errorText);
                setError('Failed to fetch orders from server');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Network error loading orders');
        } finally {
            setLoading(false);
        }
    };

    const trackOrderById = async () => {
        if (!trackingId.trim()) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Please login to track orders');
                setLoading(false);
                return;
            }

            const response = await fetch(`https://food-ordering-app-production-35eb.up.railway.app/api/orders/track/${trackingId}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📋 Track order response:', data);
                
                if (data.success) {
                    setOrders(data.order ? [data.order] : []);
                    setError('');
                } else {
                    setError(data.message || 'Order not found');
                    setOrders([]);
                }
            } else {
                const errorText = await response.text();
                console.error('Track order API error:', errorText);
                setError('Order not found or server error');
                setOrders([]);
            }
        } catch (error) {
            console.error('Error tracking order:', error);
            setError('Network error tracking order');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

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

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'confirmed': return 'Confirmed';
            case 'preparing': return 'Preparing';
            case 'ready': return 'Ready for Pickup';
            case 'out_for_delivery': return 'On the Way';
            case 'delivered': return 'Delivered';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const getStatusIndex = (status) => {
        const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
        return statusOrder.indexOf(status);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Track Your Order</h1>
                    <p className="text-gray-600 text-sm">Monitor your food delivery in real-time</p>
                    
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            placeholder="Enter Order ID"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 text-sm"
                        />
                        <button
                            onClick={trackOrderById}
                            disabled={!trackingId.trim()}
                            className="bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            Track Order
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-gray-600 text-sm">Loading orders...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <Package size={48} className="mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No Orders Found</h3>
                        <p className="text-gray-600 text-sm">You haven't placed any orders yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="border-b border-gray-200 p-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900">
                                                Order #{order.orderId || order._id?.slice(-8).toUpperCase() || 'N/A'}
                                            </h3>
                                            <p className="text-gray-600 text-xs">
                                                {new Date(order.createdAt).toLocaleDateString()} • 
                                                {new Date(order.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Order Details</h4>
                                            <div className="space-y-1">
                                                {order.items?.map((item, index) => (
                                                    <div key={index} className="flex justify-between text-xs">
                                                        <span>{item.productName || item.product?.name || `Item ${index + 1}`} x {item.quantity}</span>
                                                        <span>₱{((item.price || 0) * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="border-t mt-2 pt-2">
                                                <div className="flex justify-between font-semibold text-sm">
                                                    <span>Total</span>
                                                    <span>₱{(order.total || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Delivery Information</h4>
                                            <div className="space-y-1 text-xs">
                                                <p><strong>Address:</strong> {order.deliveryAddress}</p>
                                                <p><strong>Payment:</strong> {order.paymentMethod}</p>
                                                {order.rider && (
                                                    <p><strong>Rider:</strong> {order.rider.name}</p>
                                                )}
                                                {order.specialInstructions && (
                                                    <p><strong>Instructions:</strong> {order.specialInstructions}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Progress */}
                                    <div className="mt-4">
                                        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Order Progress</h4>
                                        <div className="flex items-center justify-between overflow-x-auto">
                                            {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((status, index) => (
                                                <div key={status} className="flex flex-col items-center min-w-16">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                                        getStatusIndex(order.status) >= index ? 'bg-red-800 text-white' : 'bg-gray-200 text-gray-400'
                                                    }`}>
                                                        {index + 1}
                                                    </div>
                                                    <span className="text-xs mt-1 text-center">
                                                        {getStatusText(status)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// User Profile Component
const UserProfile = ({ user, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/users/profile', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                setMessage('Profile updated successfully!');
                onUpdate(data.user);
            } else {
                setMessage(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('Network error updating profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Please login to view your profile</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
                    <p className="text-gray-600 text-sm mb-4">Manage your account information</p>

                    {message && (
                        <div className={`p-3 rounded mb-4 text-sm ${
                            message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Delivery Address
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 text-sm"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-800 text-white py-2 rounded-lg font-semibold hover:bg-red-900 transition-colors disabled:opacity-50 text-sm"
                        >
                            {loading ? 'Updating...' : 'UPDATE PROFILE'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Restaurant Dashboard Component
const RestaurantDashboard = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders');
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0
    });

    useEffect(() => {
        if (user) {
            fetchRestaurantData();
        }
    }, [user]);

    const fetchRestaurantData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('No token found');
                setLoading(false);
                return;
            }

            // Fetch restaurant orders
            const ordersResponse = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/orders/restaurant', {
                headers: getAuthHeaders()
            });

            // Fetch restaurant products
            const productsResponse = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/products/restaurant', {
                headers: getAuthHeaders()
            });

            if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json();
                console.log('🏪 Restaurant orders:', ordersData);
                
                if (ordersData.success) {
                    setOrders(ordersData.orders || []);
                    
                    // Calculate stats
                    const totalOrders = ordersData.orders.length;
                    const pendingOrders = ordersData.orders.filter(order => 
                        ['pending', 'confirmed', 'preparing'].includes(order.status)
                    ).length;
                    const completedOrders = ordersData.orders.filter(order => 
                        order.status === 'delivered'
                    ).length;
                    const totalRevenue = ordersData.orders
                        .filter(order => order.status === 'delivered')
                        .reduce((sum, order) => sum + (order.total || 0), 0);

                    setStats({
                        totalOrders,
                        pendingOrders,
                        completedOrders,
                        totalRevenue
                    });
                }
            } else {
                console.error('Failed to fetch restaurant orders');
            }

            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                console.log('🏪 Restaurant products:', productsData);
                
                if (productsData.success) {
                    setProducts(productsData.products || []);
                }
            } else {
                console.error('Failed to fetch restaurant products');
            }

        } catch (error) {
            console.error('Error fetching restaurant data:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                alert('Please login to update orders');
                return;
            }

            const response = await fetch(`https://food-ordering-app-production-35eb.up.railway.app/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            console.log('🔄 Update status response:', data);

            if (data.success) {
                fetchRestaurantData();
                alert(`Order status updated to ${newStatus}`);
            } else {
                alert(data.message || 'Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Network error updating order status');
        }
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

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Restaurant Dashboard</h1>
                    <p className="text-gray-600 text-sm">Manage your restaurant operations</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white rounded-lg shadow p-3">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Total Orders</h3>
                        <p className="text-xl font-bold text-red-800">{stats.totalOrders}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-3">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Pending Orders</h3>
                        <p className="text-xl font-bold text-orange-600">{stats.pendingOrders}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-3">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Completed Orders</h3>
                        <p className="text-xl font-bold text-green-600">{stats.completedOrders}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-3">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Total Revenue</h3>
                        <p className="text-xl font-bold text-blue-600">₱{stats.totalRevenue.toFixed(2)}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px overflow-x-auto">
                            {[
                                { id: 'orders', name: 'Orders', count: orders.length },
                                { id: 'products', name: 'Products', count: products.length },
                                { id: 'analytics', name: 'Analytics' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-3 px-4 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'border-red-800 text-red-800'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.name}
                                    {tab.count !== undefined && (
                                        <span className="ml-1 bg-gray-100 text-gray-900 py-0.5 px-1.5 rounded-full text-xs">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-4">
                        {activeTab === 'orders' && (
                            <div className="space-y-3">
                                {orders.map((order) => (
                                    <div key={order._id} className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                                            <div>
                                                <h4 className="font-semibold text-sm">
                                                    Order #{order.orderId || order._id?.slice(-8).toUpperCase() || 'N/A'}
                                                </h4>
                                                <p className="text-xs text-gray-600">
                                                    {new Date(order.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                                                order.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        
                                        <div className="mb-2">
                                            {order.items?.map((item, index) => (
                                                <div key={index} className="flex justify-between text-xs">
                                                    <span>{item.productName || item.product?.name || `Item ${index + 1}`} x {item.quantity}</span>
                                                    <span>₱{((item.price || 0) * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                                            <span className="font-semibold text-sm">Total: ₱{(order.total || 0).toFixed(2)}</span>
                                            <div className="flex space-x-1">
                                                {order.status === 'pending' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(order._id, 'confirmed')}
                                                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                                                    >
                                                        Confirm
                                                    </button>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(order._id, 'preparing')}
                                                        className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700"
                                                    >
                                                        Start Preparing
                                                    </button>
                                                )}
                                                {order.status === 'preparing' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(order._id, 'ready')}
                                                        className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
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

                        {activeTab === 'products' && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-3">
                                    <h3 className="text-lg font-semibold text-sm">Menu Items</h3>
                                    <button className="bg-red-800 text-white px-3 py-1 rounded hover:bg-red-900 text-sm">
                                        Add Product
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {products.map((product) => (
                                        <div key={product._id} className="border border-gray-200 rounded-lg p-3">
                                            <h4 className="font-semibold text-sm">{product.name}</h4>
                                            <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-red-800 font-bold text-sm">₱{product.price}</span>
                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                    {product.category}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Customer Dashboard Component
const CustomerDashboard = () => {
    const { user, login, register, logout, loading: authLoading, updateUser } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [restaurants, setRestaurants] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingRestaurants, setLoadingRestaurants] = useState(true);
    const [apiError, setApiError] = useState('');
    const [activeSection, setActiveSection] = useState('home');

    // Use the cart hook
    const {
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount
    } = useCart();

    useEffect(() => {
        const fetchRestaurants = async () => {
            setLoadingRestaurants(true);
            setApiError('');
            try {
                const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/restaurants');
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('🏪 REAL Restaurants API response:', data);
                    
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

    const handleAddToCart = (product, restaurant) => {
        if (!user) {
            setShowAuthModal(true);
            setAuthMode('login');
            return;
        }
        addToCart(product, restaurant);
        console.log('✅ Added to cart:', product.name);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        
        if (!user) {
            setShowAuthModal(true);
            setAuthMode('login');
            return;
        }

        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Session expired. Please login again.');
            logout();
            return;
        }

        try {
            // Generate a unique order ID on the client side to avoid null issues
            const orderId = `FX${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
            
            const orderData = {
                orderId: orderId,
                restaurantId: cart[0].restaurant._id,
                items: cart.map(item => ({
                    productId: item.product._id,
                    productName: item.product.name,
                    quantity: item.quantity,
                    price: item.product.price
                })),
                deliveryAddress: user.address || 'Puerto Princesa City',
                paymentMethod: 'cash',
                specialInstructions: ''
            };

            console.log('📦 Order data being sent:', orderData);

            const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/orders/create', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(orderData)
            });

            const data = await response.json();
            console.log('📦 Order creation response:', data);

            if (data.success) {
                alert('🎉 Order placed successfully!');
                clearCart();
                setIsCartOpen(false);
                
                // Switch to track orders section
                setActiveSection('track');
            } else {
                alert(`Order failed: ${data.message}`);
            }

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Checkout failed. Please try again.');
        }
    };

    const filteredRestaurants = restaurants.filter(restaurant =>
        restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderNavigation = () => (
        <nav className="hidden lg:flex items-center space-x-6">
            <button 
                onClick={() => setActiveSection('home')}
                className={`font-semibold text-sm ${
                    activeSection === 'home' ? 'text-red-800 border-b-2 border-red-800' : 'text-gray-700 hover:text-red-800'
                }`}
            >
                HOME
            </button>
            <button 
                onClick={() => setActiveSection('track')}
                className={`font-semibold text-sm ${
                    activeSection === 'track' ? 'text-red-800 border-b-2 border-red-800' : 'text-gray-700 hover:text-red-800'
                }`}
            >
                TRACK ORDER
            </button>
            {user && user.role === 'restaurant' && (
                <button 
                    onClick={() => setActiveSection('restaurant')}
                    className={`font-semibold text-sm ${
                        activeSection === 'restaurant' ? 'text-red-800 border-b-2 border-red-800' : 'text-gray-700 hover:text-red-800'
                    }`}
                >
                    RESTAURANT DASHBOARD
                </button>
            )}
            {user && (
                <button 
                    onClick={() => setActiveSection('profile')}
                    className={`font-semibold text-sm ${
                        activeSection === 'profile' ? 'text-red-800 border-b-2 border-red-800' : 'text-gray-700 hover:text-red-800'
                    }`}
                >
                    PROFILE
                </button>
            )}
        </nav>
    );

    const renderMobileNavigation = () => (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
            <div className="flex justify-around items-center py-2">
                <button 
                    onClick={() => setActiveSection('home')}
                    className={`flex flex-col items-center p-2 ${
                        activeSection === 'home' ? 'text-red-800' : 'text-gray-600'
                    }`}
                >
                    <Home size={20} />
                    <span className="text-xs mt-1">Home</span>
                </button>
                <button 
                    onClick={() => setActiveSection('track')}
                    className={`flex flex-col items-center p-2 ${
                        activeSection === 'track' ? 'text-red-800' : 'text-gray-600'
                    }`}
                >
                    <Package size={20} />
                    <span className="text-xs mt-1">Track</span>
                </button>
                {user && (
                    <button 
                        onClick={() => setActiveSection('profile')}
                        className={`flex flex-col items-center p-2 ${
                            activeSection === 'profile' ? 'text-red-800' : 'text-gray-600'
                        }`}
                    >
                        <User size={20} />
                        <span className="text-xs mt-1">Profile</span>
                    </button>
                )}
                {user && user.role === 'restaurant' && (
                    <button 
                        onClick={() => setActiveSection('restaurant')}
                        className={`flex flex-col items-center p-2 ${
                            activeSection === 'restaurant' ? 'text-red-800' : 'text-gray-600'
                        }`}
                    >
                        <Store size={20} />
                        <span className="text-xs mt-1">Dashboard</span>
                    </button>
                )}
            </div>
        </div>
    );

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'track':
                return <TrackOrder user={user} />;
            case 'profile':
                return <UserProfile user={user} onUpdate={updateUser} />;
            case 'restaurant':
                return <RestaurantDashboard user={user} />;
            case 'home':
            default:
                return renderHomeSection();
        }
    };

    const renderHomeSection = () => {
        return (
            <>
                {/* Hero Section with Slideshow */}
                <div className="relative">
                    <HeroSlideshow />
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white px-4 max-w-4xl mx-auto">
                            {/* Logo in Hero Section - MUCH LARGER */}
                            <div className="mb-4 sm:mb-6 md:mb-8 flex justify-center">
                                <img 
                                    src="/logo.png" 
                                    alt="FoodExpress Logo" 
                                    className="h-20 sm:h-24 md:h-32 lg:h-40 w-auto bg-white bg-opacity-20 rounded-2xl p-3 sm:p-4 shadow-2xl"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div className="h-20 sm:h-24 md:h-32 lg:h-40 w-20 sm:w-24 md:w-32 lg:w-40 bg-red-800 rounded-2xl flex items-center justify-center shadow-2xl hidden bg-opacity-90">
                                    <span className="text-white font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">FX</span>
                                </div>
                            </div>
                            
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 drop-shadow-2xl leading-tight">
                                DELICIOUS FOOD DELIVERED TO YOUR DOORSTEP
                            </h1>
                            <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl mb-6 sm:mb-8 md:mb-10 opacity-95 drop-shadow-lg font-light">
                                Experience the best food delivery service in town
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-6">
                                <button 
                                    onClick={() => user ? setIsCartOpen(true) : setShowAuthModal(true)}
                                    className="bg-white text-red-800 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:scale-105 transform"
                                >
                                    {user ? "ORDER NOW" : "LOGIN TO ORDER"}
                                </button>
                                <button className="border-2 sm:border-4 border-white text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl hover:bg-white hover:text-red-800 transition-all duration-300 shadow-2xl hover:scale-105 transform">
                                    BROWSE RESTAURANTS
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 md:py-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">FEATURED RESTAURANTS</h2>
                        <button className="text-red-800 hover:text-red-900 font-semibold text-base sm:text-lg">
                            VIEW ALL →
                        </button>
                    </div>
                    
                    {loadingRestaurants ? (
                        <div className="flex justify-center items-center py-8 sm:py-12">
                            <div className="text-center">
                                <div className="w-10 sm:w-12 h-10 sm:h-12 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                                <p className="text-gray-600 text-sm sm:text-base">Loading restaurants...</p>
                            </div>
                        </div>
                    ) : apiError ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 max-w-md mx-auto">
                                <p className="text-yellow-800 font-semibold mb-2 text-sm sm:text-base"> API Connection</p>
                                <p className="text-yellow-700 text-xs sm:text-sm">{apiError}</p>
                                <p className="text-yellow-600 text-xs mt-2">Using real-time data from your database</p>
                            </div>
                        </div>
                    ) : filteredRestaurants.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 max-w-md mx-auto">
                                <p className="text-blue-800 font-semibold text-base sm:text-lg"> No Restaurants Yet</p>
                                <p className="text-blue-700 text-sm mt-2">
                                    No restaurants found in your database. Add restaurants via admin panel.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredRestaurants.map((restaurant, index) => (
                                <RestaurantCard 
                                    key={restaurant._id || restaurant.id || index}
                                    restaurant={restaurant}
                                    onAddToCart={handleAddToCart}
                                    user={user}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-gray-100 py-8 sm:py-12 md:py-16">
                    <div className="max-w-7xl mx-auto px-4">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-8 sm:mb-12">Join Our Community</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 text-center hover:transform hover:scale-105 transition-all duration-300">
                                <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <span className="text-xl sm:text-2xl">🍽️</span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Food Lover</h3>
                                <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">Order from your favorite restaurants and enjoy delicious meals delivered to your door.</p>
                                <button 
                                    onClick={() => { setShowAuthModal(true); setAuthMode('customer'); }}
                                    className="bg-red-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-900 transition-colors font-semibold text-sm sm:text-base"
                                >
                                    Join as Customer
                                </button>
                            </div>

                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 text-center hover:transform hover:scale-105 transition-all duration-300">
                                <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                <Store className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Restaurant Owner</h3>
                                <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">Reach more customers and grow your business with our delivery platform.</p>
                                <button 
                                    onClick={() => { setShowAuthModal(true); setAuthMode('restaurant'); }}
                                    className="bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm sm:text-base"
                                >
                                    Join as Restaurant
                                </button>
                            </div>

                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 text-center hover:transform hover:scale-105 transition-all duration-300">
                                <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                <Bike className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Delivery Rider</h3>
                                <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">Earn money by delivering food to customers in your area. Flexible hours available.</p>
                                <button 
                                    onClick={() => { setShowAuthModal(true); setAuthMode('rider'); }}
                                    className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm sm:text-base"
                                >
                                    Join as Rider
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-red-800 text-white py-8 sm:py-12 md:py-16">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">SPECIAL OFFER!</h2>
                        <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8">Get 20% OFF on your first order with promo code: <strong>WELCOME20</strong></p>
                        <button 
                            onClick={() => user ? console.log('Grab offer') : setShowAuthModal(true)}
                            className="bg-white text-red-800 px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:scale-105 transform"
                        >
                            {user ? "GRAB THIS OFFER" : "LOGIN TO GET OFFER"}
                        </button>
                    </div>
                </div>
            </>
        );
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 sm:w-16 h-12 sm:h-16 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-gray-600 text-sm sm:text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
            <header className="bg-white shadow-lg sticky top-0 z-40">
                <div className="bg-gray-800 text-white py-2">
                    <div className="max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm">
                        Free delivery on orders over ₱299! • ⭐ Rate your experience and get rewards
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {/* Logo in Header - LARGER */}
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <img 
                                    src="/logo.png" 
                                    alt="FoodExpress Logo" 
                                    className="h-12 sm:h-14 md:h-16 w-auto"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div className="h-12 sm:h-14 md:h-16 w-12 sm:w-14 md:w-16 bg-red-800 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl md:text-2xl shadow hidden">
                                    FX
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-800">FOODEXPRESS</h1>
                                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Delivery Service</p>
                                </div>
                            </div>
                        </div>

                        {renderNavigation()}

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {user ? (
                                <>
                                    <div className="hidden sm:flex items-center space-x-2">
                                        <span className="text-gray-700 text-sm">Welcome, {user.name}!</span>
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
                                    <button 
                                        onClick={() => setIsCartOpen(true)}
                                        className="relative flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-red-800"
                                    >
                                        <ShoppingCart size={20} className="sm:w-6 sm:h-6" />
                                        <span className="font-medium text-sm sm:text-base">CART</span>
                                        {getCartItemCount() > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-red-800 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-bold">
                                                {getCartItemCount()}
                                            </span>
                                        )}
                                    </button>
                                    
                                    <button 
                                        onClick={logout}
                                        className="bg-red-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-900 transition-colors shadow-lg font-semibold text-sm sm:text-base"
                                    >
                                        LOGOUT
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center space-x-2 sm:space-x-4">
                                    <button 
                                        onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                                        className="text-gray-700 hover:text-red-800 font-semibold text-sm sm:text-base"
                                    >
                                        LOGIN
                                    </button>
                                    <div className="relative group">
                                        <button 
                                            className="bg-red-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-900 transition-colors shadow-lg font-semibold text-sm sm:text-base"
                                        >
                                            SIGN UP
                                        </button>
                                        <div className="absolute top-full left-0 mt-2 w-40 sm:w-48 bg-white shadow-xl rounded-lg py-2 hidden group-hover:block z-50">
                                            <button 
                                                onClick={() => { setShowAuthModal(true); setAuthMode('customer'); }}
                                                className="w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium text-sm"
                                            >
                                                 As Customer
                                            </button>
                                            <button 
                                                onClick={() => { setShowAuthModal(true); setAuthMode('restaurant'); }}
                                                className="w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium text-sm"
                                            >
                                                 As Restaurant
                                            </button>
                                            <button 
                                                onClick={() => { setShowAuthModal(true); setAuthMode('rider'); }}
                                                className="w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium text-sm"
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

                {activeSection === 'home' && (
                    <div className="bg-gray-100 border-t border-b border-gray-200 py-3">
                        <div className="max-w-7xl mx-auto px-4">
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <div className="flex-1 max-w-2xl w-full">
                                    <div className="relative">
                                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Search for restaurants, cuisines, or dishes..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                                    <button className="flex items-center space-x-1 sm:space-x-2 bg-red-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-900 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center font-semibold">
                                        <Search size={16} className="sm:w-5 sm:h-5" />
                                        <span>SEARCH</span>
                                    </button>
                                    <button className="flex items-center space-x-1 sm:space-x-2 bg-white border border-gray-300 px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:border-red-800 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center font-semibold">
                                        <Filter size={16} className="sm:w-5 sm:h-5" />
                                        <span>FILTER</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {renderActiveSection()}

            {renderMobileNavigation()}

            <footer className="bg-gray-900 text-white mt-8 sm:mt-12">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">FOODEXPRESS</h3>
                            <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4">
                                Delivering delicious food to your doorstep with the best quality and service.
                            </p>
                            <div className="flex space-x-3 sm:space-x-4">
                                {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                                    <Icon 
                                        key={index}
                                        size={18} 
                                        className="sm:w-5 sm:h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" 
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-white mb-3 sm:mb-4 text-base sm:text-lg">QUICK LINKS</h4>
                            <ul className="space-y-1 sm:space-y-2 text-gray-400">
                                {['About Us', 'Contact Us', 'FAQs', 'Privacy Policy'].map((link, index) => (
                                    <li key={index}>
                                        <button className="hover:text-white transition-colors text-sm sm:text-base">
                                            {link}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-3 sm:mb-4 text-base sm:text-lg">CONTACT INFO</h4>
                            <div className="space-y-1 sm:space-y-2 text-gray-400">
                                <div className="flex items-center space-x-2 hover:text-white transition-colors text-sm sm:text-base">
                                    <span>📞 09105019330</span>
                                </div>
                                <div className="flex items-center space-x-2 hover:text-white transition-colors text-sm sm:text-base">
                                    <span>✉️ foodexpress@delivery.com</span>
                                </div>
                                <div className="flex items-center space-x-2 hover:text-white transition-colors text-sm sm:text-base">
                                    <span>📍 Puerto Princesa City, Philippines</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-3 sm:mb-4 text-base sm:text-lg">NEWSLETTER</h4>
                            <p className="text-gray-400 text-sm sm:text-base mb-2 sm:mb-3">Subscribe to get special offers and updates</p>
                            <div className="flex">
                                <input 
                                    type="email" 
                                    placeholder="Your email" 
                                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 border border-gray-700 rounded-l focus:outline-none focus:border-red-800 transition-colors text-sm"
                                />
                                <button className="bg-red-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-r hover:bg-red-900 transition-colors font-semibold text-sm">
                                    SUBSCRIBE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
                        <div className="flex flex-col md:flex-row justify-between items-center text-gray-400">
                            <p className="text-xs sm:text-sm">&copy; 2025 FoodExpress Delivery Service. All rights reserved.</p>
                            <div className="flex space-x-4 sm:space-x-6 mt-2 md:mt-0">
                                {['Terms & Conditions', 'Privacy Policy', 'Sitemap'].map((item, index) => (
                                    <span 
                                        key={index}
                                        className="hover:text-white transition-colors cursor-pointer text-xs sm:text-sm"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Cart Component */}
            <Cart
                cart={cart}
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                onCheckout={handleCheckout}
                user={user}
            />

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