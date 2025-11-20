import React, { useState, useEffect } from 'react';
import { 
    Search, MapPin, Clock, Star, 
    ShoppingCart, Filter, Store, Bike, Navigation,
    Facebook, Twitter, Instagram, Youtube,
    Plus, Minus, X, Heart, Share2, Phone, Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Updated useCart hook with backend integration
const useCart = () => {
    const { user } = useAuth(); // Get user from auth context
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch cart from backend when user logs in
    useEffect(() => {
        if (user) {
            fetchCart();
        } else {
            // If no user, use localStorage as fallback
            const savedCart = localStorage.getItem('foodexpress_cart');
            if (savedCart) {
                setCart(JSON.parse(savedCart));
            } else {
                setCart([]);
            }
        }
    }, [user]);

    // Save to localStorage when cart changes (for guest users)
    useEffect(() => {
        if (!user) {
            localStorage.setItem('foodexpress_cart', JSON.stringify(cart));
        }
    }, [cart, user]);

    const fetchCart = async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCart(data.cart?.items || []);
                }
            } else {
                console.error('Failed to fetch cart');
                // Fallback to localStorage if backend fails
                const savedCart = localStorage.getItem('foodexpress_cart');
                if (savedCart) {
                    setCart(JSON.parse(savedCart));
                }
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            // Fallback to localStorage on error
            const savedCart = localStorage.getItem('foodexpress_cart');
            if (savedCart) {
                setCart(JSON.parse(savedCart));
            }
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (product, restaurant) => {
        // For guest users, use localStorage
        if (!user) {
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
                        quantity: 1,
                        addedAt: new Date().toISOString()
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
            return { success: true, message: 'Item added to cart' };
        }

        // For logged-in users, use backend API
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: product._id,
                    restaurantId: restaurant._id,
                    quantity: 1
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setCart(data.cart?.items || []);
                return { success: true, message: 'Item added to cart' };
            } else {
                // Handle restaurant conflict
                if (data.needsClear) {
                    const confirmClear = window.confirm(data.message + ' Would you like to clear your cart and add this item?');
                    if (confirmClear) {
                        await clearCart();
                        // Retry adding the item after clearing cart
                        return await addToCart(product, restaurant);
                    } else {
                        return { success: false, message: 'Cart not cleared' };
                    }
                }
                return { success: false, message: data.message || 'Failed to add item to cart' };
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            return { success: false, message: 'Network error. Please try again.' };
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (productId, restaurantId, newQuantity) => {
        // For guest users
        if (!user) {
            setCart(prevCart => {
                if (newQuantity <= 0) {
                    return prevCart.filter(item => 
                        !(item.product._id === productId && item.restaurant._id === restaurantId)
                    );
                }
                return prevCart.map(item =>
                    item.product._id === productId && item.restaurant._id === restaurantId
                        ? { ...item, quantity: newQuantity }
                        : item
                );
            });
            return;
        }

        // For logged-in users
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/cart/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: newQuantity
                })
            });

            const data = await response.json();
            if (data.success) {
                setCart(data.cart?.items || []);
            }
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    };

    const removeFromCart = async (productId, restaurantId) => {
        // For guest users
        if (!user) {
            setCart(prevCart => 
                prevCart.filter(item => 
                    !(item.product._id === productId && item.restaurant._id === restaurantId)
                )
            );
            return;
        }

        // For logged-in users
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://food-ordering-app-production-35eb.up.railway.app/api/cart/remove/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setCart(data.cart?.items || []);
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
        }
    };

    const clearCart = async () => {
        // For guest users
        if (!user) {
            setCart([]);
            return;
        }

        // For logged-in users
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/cart/clear', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setCart([]);
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    };

    const checkout = async (checkoutData) => {
        if (!user) {
            return { success: false, message: 'Please login to checkout' };
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/cart/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(checkoutData)
            });

            const data = await response.json();
            if (data.success) {
                setCart([]);
                return { success: true, message: 'Order placed successfully!', order: data.order };
            } else {
                return { success: false, message: data.message || 'Checkout failed' };
            }
        } catch (error) {
            console.error('Error during checkout:', error);
            return { success: false, message: 'Checkout failed. Please try again.' };
        }
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
        checkout,
        getCartTotal,
        getCartItemCount,
        getCurrentRestaurant,
        loading
    };
};
// Cart Component
const Cart = ({ cart, isOpen, onClose, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout, user }) => {
    if (!isOpen) return null;

    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const deliveryFee = subtotal > 299 ? 0 : 35;
    const serviceFee = Math.max(10, subtotal * 0.02); // 2% service fee, min ₱10
    const grandTotal = subtotal + deliveryFee + serviceFee;

    const currentRestaurant = cart.length > 0 ? cart[0].restaurant : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-md h-full overflow-y-auto animate-slide-in">
                <div className="p-4 border-b bg-red-800 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">Your Cart</h2>
                            {currentRestaurant && (
                                <p className="text-red-100 text-sm flex items-center mt-1">
                                    <Store size={14} className="mr-1" />
                                    {currentRestaurant.name}
                                </p>
                            )}
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-red-700 rounded transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 p-8">
                        <ShoppingCart size={80} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg font-semibold mb-2">Your cart is empty</p>
                        <p className="text-gray-400 text-center text-sm">
                            Browse restaurants and add delicious items to get started!
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-6 bg-red-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-900 transition-colors"
                        >
                            START ORDERING
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="p-4 space-y-4">
                            {cart.map((item, index) => (
                                <div 
                                    key={`${item.product._id}-${item.restaurant._id}`}
                                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 text-lg">
                                                {item.product.name}
                                            </h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                {item.product.description}
                                            </p>
                                            <p className="text-red-800 font-bold text-lg mt-2">
                                                ₱{item.product.price}
                                            </p>
                                        </div>
                                        
                                        {item.product.image && (
                                            <img 
                                                src={item.product.image} 
                                                alt={item.product.name}
                                                className="w-16 h-16 object-cover rounded-lg ml-4"
                                            />
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => onUpdateQuantity(
                                                    item.product._id, 
                                                    item.restaurant._id, 
                                                    item.quantity - 1
                                                )}
                                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            
                                            <span className="w-8 text-center font-bold text-lg">
                                                {item.quantity}
                                            </span>
                                            
                                            <button
                                                onClick={() => onUpdateQuantity(
                                                    item.product._id, 
                                                    item.restaurant._id, 
                                                    item.quantity + 1
                                                )}
                                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className="text-red-800 font-bold text-lg">
                                                ₱{(item.product.price * item.quantity).toFixed(2)}
                                            </p>
                                            <button
                                                onClick={() => onRemoveItem(item.product._id, item.restaurant._id)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium mt-1"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-900">Order Summary</h3>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold">₱{subtotal.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Delivery Fee</span>
                                    <span className={deliveryFee === 0 ? "text-green-600 font-semibold" : "font-semibold"}>
                                        {deliveryFee === 0 ? "FREE" : `₱${deliveryFee.toFixed(2)}`}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Service Fee</span>
                                    <span className="font-semibold">₱{serviceFee.toFixed(2)}</span>
                                </div>
                                
                                {deliveryFee === 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <p className="text-green-800 text-sm font-semibold text-center">
                                            🎉 You qualified for FREE delivery!
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-3">
                                <div className="flex justify-between items-center font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-red-800">₱{grandTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={onCheckout}
                                    disabled={!user}
                                    className="w-full bg-red-800 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {user ? `PROCEED TO CHECKOUT • ₱${grandTotal.toFixed(2)}` : 'LOGIN TO CHECKOUT'}
                                </button>
                                
                                <div className="flex space-x-2">
                                    <button
                                        onClick={onClearCart}
                                        className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        CLEAR CART
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        CONTINUE ORDERING
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Location Map Component
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
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                        placeholder="Enter your address"
                    />
                    <button
                        type="button"
                        onClick={handleSearch}
                        className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
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

// RestaurantCard Component with Enhanced Features
const RestaurantCard = ({ restaurant, onAddToCart, user, onViewMenu }) => {
    const [showProducts, setShowProducts] = useState(false);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [error, setError] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);

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
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        // Here you would typically save to user's favorites in backend
    };

    return (
        <>
            {/* Restaurant Card (Normal View) */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-red-200">
                {/* Restaurant Header with Image */}
                <div className="h-48 relative">
                    {restaurant.image ? (
                        <img 
                            src={restaurant.image} 
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                            <span className="text-white text-4xl">🍕</span>
                        </div>
                    )}
                    
                    {/* Favorite Button */}
                    <button
                        onClick={toggleFavorite}
                        className="absolute top-3 right-3 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                    >
                        <Heart 
                            size={20} 
                            className={isFavorite ? "fill-red-600 text-red-600" : "text-gray-600"} 
                        />
                    </button>
                    
                    {/* Cuisine Badge */}
                    <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {restaurant.cuisine || 'Food'}
                    </div>
                    
                    {/* Rating Badge */}
                    <div className="absolute top-3 left-3 bg-white bg-opacity-95 px-2 py-1 rounded-full flex items-center space-x-1">
                        <Star size={14} className="text-yellow-400 fill-current" />
                        <span className="text-sm font-bold text-gray-900">{restaurant.rating || '4.5'}</span>
                    </div>
                </div>
                
                {/* Restaurant Info */}
                <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{restaurant.name}</h3>
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                        <MapPin size={14} className="mr-1 text-red-700 flex-shrink-0" />
                        <span className="text-sm line-clamp-1">{restaurant.address || 'Puerto Princesa City'}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                            {restaurant.cuisine || 'Various'}
                        </span>
                        <span className="text-green-600 font-semibold flex items-center text-xs">
                            <Clock size={12} className="mr-1" />
                            {restaurant.deliveryTime || '25-35 min'}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={fetchProducts}
                            disabled={loadingProducts}
                            className="flex-1 bg-red-700 text-white py-3 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
                        >
                            {loadingProducts ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm">Loading...</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-sm">📖 VIEW MENU</span>
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={() => onViewMenu(restaurant)}
                            className="px-4 border border-gray-300 text-gray-700 rounded-lg hover:border-red-700 hover:text-red-700 transition-colors flex items-center justify-center"
                        >
                            <Share2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* FULL SCREEN MENU MODAL */}
            {showProducts && (
                <div className="fixed inset-0 bg-white z-50 overflow-y-auto animate-fade-in">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-700 to-red-800 text-white sticky top-0 z-10 shadow-lg">
                        <div className="container mx-auto px-4 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <button 
                                        onClick={closeMenu}
                                        className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div>
                                        <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                                        <p className="text-red-100 text-sm flex items-center">
                                            <Store size={14} className="mr-1" />
                                            {restaurant.cuisine} • {restaurant.address}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center space-x-2 text-yellow-300">
                                        <Star size={20} className="fill-current" />
                                        <span className="font-bold text-lg">{restaurant.rating || '4.5'}</span>
                                    </div>
                                    <p className="text-red-100 text-sm">{products.length} items</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Menu Content */}
                    <div className="container mx-auto px-4 py-8">
                        {error ? (
                            <div className="text-center py-12">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                                    <p className="text-yellow-800 font-semibold">{error}</p>
                                </div>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                                    <p className="text-blue-800 font-semibold">No menu items available</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {products.map((product) => (
                                    <div 
                                        key={product._id} 
                                        className="bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                                    >
                                        {/* Product Image */}
                                        <div className="h-48 bg-gray-100 relative overflow-hidden">
                                            {product.image ? (
                                                <img 
                                                    src={product.image} 
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                                    <span className="text-gray-400 text-6xl">🍽️</span>
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 bg-white bg-opacity-95 px-3 py-1 rounded-full shadow-sm">
                                                <span className="text-green-600 font-bold text-lg">₱{product.price}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Product Info */}
                                        <div className="p-6">
                                            <div className="mb-4">
                                                <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2">
                                                    {product.name}
                                                </h3>
                                                
                                                {product.description && (
                                                    <p className="text-gray-600 text-base mb-3 leading-relaxed line-clamp-2">
                                                        {product.description}
                                                    </p>
                                                )}
                                                
                                                {product.ingredients && (
                                                    <div className="mb-3">
                                                        <p className="text-sm text-gray-500 font-semibold mb-1">Ingredients:</p>
                                                        <p className="text-gray-600 text-sm line-clamp-2">{product.ingredients}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-2">
                                                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                                        {product.category}
                                                    </span>
                                                    <span className="text-blue-600 text-sm flex items-center">
                                                        <Clock size={14} className="mr-1" />
                                                        {product.preparationTime || 15} min
                                                    </span>
                                                </div>
                                                
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={!user}
                                                    className="bg-red-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
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

                    {/* Footer */}
                    <div className="bg-gray-50 border-t mt-8">
                        <div className="container mx-auto px-4 py-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-gray-600 font-medium">
                                        Showing <strong>{products.length}</strong> menu item{products.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={closeMenu}
                                        className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                                    >
                                        CLOSE MENU
                                    </button>
                                    {user && (
                                        <button
                                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                            className="bg-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors"
                                        >
                                            BACK TO TOP
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

// Quick Actions Component
const QuickActions = ({ onAction, user }) => {
    const actions = [
        { icon: '🍕', label: 'Pizza', color: 'bg-orange-500' },
        { icon: '🍔', label: 'Burgers', color: 'bg-yellow-500' },
        { icon: '🍣', label: 'Sushi', color: 'bg-red-500' },
        { icon: '☕', label: 'Coffee', color: 'bg-brown-500' },
        { icon: '🍦', label: 'Desserts', color: 'bg-pink-500' },
        { icon: '🥗', label: 'Healthy', color: 'bg-green-500' },
        { icon: '🍗', label: 'Chicken', color: 'bg-orange-400' },
        { icon: '🍜', label: 'Noodles', color: 'bg-yellow-400' },
    ];

    return (
        <div className="bg-white py-8">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Categories</h2>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => onAction(action.label)}
                            className="flex flex-col items-center p-4 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                        >
                            <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center text-white text-xl mb-2 group-hover:scale-110 transition-transform`}>
                                {action.icon}
                            </div>
                            <span className="text-xs font-semibold text-gray-700 text-center">{action.label}</span>
                        </button>
                    ))}
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
    const [selectedCategory, setSelectedCategory] = useState('');

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
        getCartItemCount,
        getCurrentRestaurant
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
        addToCart(product, restaurant);
        // Show success notification
        console.log('Added to cart:', product.name, 'from', restaurant.name);
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        
        if (!user) {
            setShowAuthModal(true);
            setAuthMode('login');
            return;
        }

        // Here you would typically navigate to checkout page
        const total = getCartTotal() + (getCartTotal() > 299 ? 0 : 35) + Math.max(10, getCartTotal() * 0.02);
        alert(`Proceeding to checkout with ${getCartItemCount()} items. Total: ₱${total.toFixed(2)}`);
        setIsCartOpen(false);
        
        // In a real app, you would navigate to checkout page
    };

    const handleQuickAction = (category) => {
        setSelectedCategory(category);
        setSearchQuery(category);
    };

    const handleViewMenu = (restaurant) => {
        // Scroll to restaurant or show menu
        console.log('View menu for:', restaurant.name);
    };

    const filteredRestaurants = restaurants.filter(restaurant =>
        (restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedCategory === '' || restaurant.cuisine?.toLowerCase().includes(selectedCategory.toLowerCase()))
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
            <header className="bg-white shadow-lg sticky top-0 z-40">
                <div className="bg-gradient-to-r from-red-700 to-red-800 text-white py-2">
                    <div className="max-w-7xl mx-auto px-4 text-center text-sm">
                        🎉 Free delivery on orders over ₱299! • ⭐ Rate your experience and get rewards
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-red-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                FX
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-red-800">FOODEXPRESS</h1>
                                <p className="text-xs text-gray-600">Fast & Fresh Delivery</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden lg:flex items-center space-x-8">
                            <button className="font-semibold text-sm text-red-800 border-b-2 border-red-800 pb-1">HOME</button>
                            <button className="font-semibold text-sm text-gray-700 hover:text-red-800 transition-colors">RESTAURANTS</button>
                            <button className="font-semibold text-sm text-gray-700 hover:text-red-800 transition-colors">MY ORDERS</button>
                            <button className="font-semibold text-sm text-gray-700 hover:text-red-800 transition-colors">TRACK ORDER</button>
                            <button className="font-semibold text-sm text-gray-700 hover:text-red-800 transition-colors">PROFILE</button>
                        </nav>

                        {/* User Actions */}
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-700 font-medium">Welcome, {user.name}!</span>
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
                                    
                                    {/* Cart Button */}
                                    <button 
                                        onClick={() => setIsCartOpen(true)}
                                        className="relative flex items-center space-x-2 text-gray-700 hover:text-red-800 transition-colors group"
                                    >
                                        <div className="relative">
                                            <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
                                            {getCartItemCount() > 0 && (
                                                <span className="absolute -top-2 -right-2 bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold animate-pulse">
                                                    {getCartItemCount()}
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-medium">CART</span>
                                    </button>
                                    
                                    <button 
                                        onClick={logout}
                                        className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors shadow-md font-semibold"
                                    >
                                        LOGOUT
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <button 
                                        onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                                        className="text-gray-700 hover:text-red-800 font-medium transition-colors"
                                    >
                                        LOGIN
                                    </button>
                                    <div className="relative group">
                                        <button 
                                            className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors shadow-md font-semibold"
                                        >
                                            SIGN UP
                                        </button>
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl rounded-lg py-2 hidden group-hover:block z-50 border border-gray-200">
                                            <button 
                                                onClick={() => { setShowAuthModal(true); setAuthMode('customer'); }}
                                                className="w-full text-left px-4 py-3 hover:bg-red-50 text-gray-700 font-medium transition-colors"
                                            >
                                                👤 As Customer
                                            </button>
                                            <button 
                                                onClick={() => { setShowAuthModal(true); setAuthMode('restaurant'); }}
                                                className="w-full text-left px-4 py-3 hover:bg-orange-50 text-gray-700 font-medium transition-colors"
                                            >
                                                🏪 As Restaurant
                                            </button>
                                            <button 
                                                onClick={() => { setShowAuthModal(true); setAuthMode('rider'); }}
                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 text-gray-700 font-medium transition-colors"
                                            >
                                                🚴 As Rider
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-gray-50 border-t border-b border-gray-200 py-4">
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
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700 transition-colors shadow-sm"
                                    />
                                </div>
                            </div>
                            <button className="flex items-center space-x-2 bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition-colors shadow-md font-semibold">
                                <Search size={16} />
                                <span>SEARCH</span>
                            </button>
                            <button className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-3 rounded-lg hover:border-red-700 hover:text-red-700 transition-colors font-semibold shadow-sm">
                                <Filter size={16} />
                                <span>FILTER</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        DELICIOUS FOOD<br />
                        <span className="text-yellow-300">DELIVERED FAST</span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 opacity-95 max-w-2xl mx-auto leading-relaxed">
                        Experience the best food delivery service in Puerto Princesa. Fresh, fast, and right at your doorstep!
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <button 
                            onClick={() => user ? setIsCartOpen(true) : setShowAuthModal(true)}
                            className="bg-yellow-400 text-red-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            {user ? "ORDER NOW 🚀" : "LOGIN TO ORDER"}
                        </button>
                        <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-red-800 transition-colors shadow-lg">
                            BROWSE RESTAURANTS
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <QuickActions onAction={handleQuickAction} user={user} />

            {/* Featured Restaurants */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900">Featured Restaurants</h2>
                        <p className="text-gray-600 mt-2">Discover the best restaurants in your area</p>
                    </div>
                    <button className="text-red-700 hover:text-red-800 font-semibold text-lg flex items-center space-x-2 transition-colors">
                        <span>VIEW ALL</span>
                        <span>→</span>
                    </button>
                </div>
                
                {loadingRestaurants ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600 text-lg">Loading restaurants...</p>
                        </div>
                    </div>
                ) : apiError ? (
                    <div className="text-center py-20">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 max-w-md mx-auto">
                            <p className="text-yellow-800 font-semibold text-lg mb-2">API Connection</p>
                            <p className="text-yellow-700">{apiError}</p>
                            <p className="text-yellow-600 text-sm mt-2">Using real-time data from your database</p>
                        </div>
                    </div>
                ) : filteredRestaurants.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 max-w-md mx-auto">
                            <p className="text-blue-800 font-semibold text-lg">No Restaurants Found</p>
                            <p className="text-blue-700 mt-2">
                                {searchQuery ? `No results for "${searchQuery}"` : 'No restaurants available yet'}
                            </p>
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                CLEAR SEARCH
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredRestaurants.map((restaurant, index) => (
                            <RestaurantCard 
                                key={restaurant._id || restaurant.id || index}
                                restaurant={restaurant}
                                onAddToCart={handleAddToCart}
                                onViewMenu={handleViewMenu}
                                user={user}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* How It Works Section */}
            <div className="bg-gray-100 py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">🔍</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Search & Choose</h3>
                            <p className="text-gray-600">Browse restaurants and menus. Find your favorite dishes or discover new ones.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">🛒</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">2. Add to Cart</h3>
                            <p className="text-gray-600">Select your items, customize your order, and add them to your cart.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">🚚</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">3. Enjoy Delivery</h3>
                            <p className="text-gray-600">Sit back and relax. We'll deliver your fresh meal right to your doorstep.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Special Offer Banner */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 py-16">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">SPECIAL OFFER! 🎉</h2>
                    <p className="text-xl text-gray-800 mb-6">Get 20% OFF on your first order with promo code: <strong>WELCOME20</strong></p>
                    <button 
                        onClick={() => user ? console.log('Apply offer') : setShowAuthModal(true)}
                        className="bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-800 transition-colors shadow-lg"
                    >
                        {user ? "GRAB THIS OFFER" : "LOGIN TO GET OFFER"}
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-4">FOODEXPRESS</h3>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Delivering delicious food to your doorstep with the best quality and service in Puerto Princesa.
                            </p>
                            <div className="flex space-x-4">
                                {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                                    <Icon 
                                        key={index}
                                        size={20} 
                                        className="text-gray-400 hover:text-white cursor-pointer transition-colors" 
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-white mb-4 text-lg">QUICK LINKS</h4>
                            <ul className="space-y-3 text-gray-400">
                                {['About Us', 'Contact Us', 'FAQs', 'Privacy Policy', 'Terms & Conditions'].map((link, index) => (
                                    <li key={index}>
                                        <button className="hover:text-white transition-colors text-left">
                                            {link}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4 text-lg">CONTACT INFO</h4>
                            <div className="space-y-3 text-gray-400">
                                <div className="flex items-center space-x-3 hover:text-white transition-colors">
                                    <Phone size={16} />
                                    <span>0910 501 9330</span>
                                </div>
                                <div className="flex items-center space-x-3 hover:text-white transition-colors">
                                    <Mail size={16} />
                                    <span>foodexpress@delivery.com</span>
                                </div>
                                <div className="flex items-center space-x-3 hover:text-white transition-colors">
                                    <MapPin size={16} />
                                    <span>Puerto Princesa City, Palawan</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4 text-lg">NEWSLETTER</h4>
                            <p className="text-gray-400 mb-4">Subscribe to get special offers and updates</p>
                            <div className="flex">
                                <input 
                                    type="email" 
                                    placeholder="Your email" 
                                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:border-red-700 transition-colors"
                                />
                                <button className="bg-red-700 text-white px-6 py-3 rounded-r-lg hover:bg-red-800 transition-colors font-semibold">
                                    SUBSCRIBE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
                            <p>&copy; 2025 FoodExpress Delivery Service. All rights reserved.</p>
                            <div className="flex space-x-6 mt-2 md:mt-0">
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

            {/* Auth Modals (You'll need to import/implement these) */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    {/* Your existing auth modal components */}
                    <div className="bg-white rounded-xl p-8 max-w-md w-full">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                            <p className="text-gray-600 mb-6">Please login or sign up to continue.</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => { setShowAuthModal(false); setAuthMode('login'); }}
                                    className="w-full bg-red-700 text-white py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors"
                                >
                                    LOGIN
                                </button>
                                <button
                                    onClick={() => { setShowAuthModal(false); setAuthMode('customer'); }}
                                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    SIGN UP
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;