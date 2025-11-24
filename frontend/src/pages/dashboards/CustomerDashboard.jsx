import React, { useState, useEffect } from 'react';
import {
  Search, MapPin, Clock, Star, ShoppingCart, Filter, Store, Bike, Navigation,
  Facebook, Twitter, Instagram, Youtube, Plus, Minus, X, Package, User, History,
  Phone, Mail, Map, Home, Settings, LogOut, BarChart3, Users, DollarSign, ChevronDown,
  Eye, Edit, Trash2, CheckCircle, XCircle, Truck, CreditCard, MessageCircle, Heart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/* --------------------------------------------------
   Utility: auth headers
   -------------------------------------------------- */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/* --------------------------------------------------
   REAL mini-map component (free, no key)
   -------------------------------------------------- */
const LocationMap = ({ onLocationSelect, initialAddress = '' }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState(initialAddress);
  const [coords, setCoords] = useState({ lat: 9.7392, lng: 118.7353 });

  /* init map once */
  useEffect(() => {
    if (!mapContainer.current || window.mapLoaded) return;
    const L = window.L;
    mapRef.current = L.map(mapContainer.current).setView([coords.lat, coords.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    markerRef.current = L.marker([coords.lat, coords.lng], {
      draggable: true,
      icon: L.icon({
        iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    }).addTo(mapRef.current);

    markerRef.current.on('dragend', () => {
      const { lat, lng } = markerRef.current.getLatLng();
      setCoords({ lat, lng });
      reverseGeocode(lat, lng);
    });
    window.mapLoaded = true;

    return () => {
      if (mapRef.current) mapRef.current.remove();
      window.mapLoaded = false;
    };
  }, []);

  const handleSearch = () => {
    if (!address.trim()) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setCoords({ lat, lng });
          mapRef.current.setView([lat, lng], 17);
          markerRef.current.setLatLng([lat, lng]);
          onLocationSelect(data[0].display_name, lat, lng);
        }
      })
      .catch((e) => console.error(e));
  };

  const reverseGeocode = (lat, lng) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then((r) => r.json())
      .then((res) => {
        const addr = res.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setAddress(addr);
        onLocationSelect(addr, lat, lng);
      })
      .catch((e) => console.error(e));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Search Location</label>
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

      <div ref={mapContainer} className="w-full h-64 rounded-lg border-2 border-gray-300 overflow-hidden" />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800 flex items-center">
          <MapPin size={16} className="mr-2" />
          <span>Selected: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
        </p>
      </div>

      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" async />
    </div>
  );
};

/* --------------------------------------------------
   Cart hook (unchanged)
   -------------------------------------------------- */
const useCart = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('foodexpress_cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('foodexpress_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, restaurant) => {
    setCart((prev) => {
      const diffRest = prev.find((i) => i.restaurant._id !== restaurant._id);
      if (diffRest) {
        const ok = window.confirm(
          `Your cart contains items from ${diffRest.restaurant.name}. Adding from ${restaurant.name} will clear your current cart. Continue?`
        );
        if (!ok) return prev;
        return [{ product, restaurant, quantity: 1 }];
      }
      const exists = prev.find(
        (i) => i.product._id === product._id && i.restaurant._id === restaurant._id
      );
      if (exists) {
        return prev.map((i) =>
          i.product._id === product._id && i.restaurant._id === restaurant._id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, restaurant, quantity: 1, addedAt: new Date().toISOString() }];
    });
  };

  const removeFromCart = (productId, restaurantId) =>
    setCart((prev) => prev.filter((i) => !(i.product._id === productId && i.restaurant._id === restaurantId)));

  const updateQuantity = (productId, restaurantId, qty) => {
    if (qty <= 0) return removeFromCart(productId, restaurantId);
    setCart((prev) =>
      prev.map((i) =>
        i.product._id === productId && i.restaurant._id === restaurantId ? { ...i, quantity: qty } : i
      )
    );
  };

  const clearCart = () => setCart([]);
  const getCartTotal = () => cart.reduce((t, i) => t + i.product.price * i.quantity, 0);
  const getCartItemCount = () => cart.reduce((c, i) => c + i.quantity, 0);
  const getCurrentRestaurant = () => (cart.length ? cart[0].restaurant : null);

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
    getCurrentRestaurant,
  };
};

/* --------------------------------------------------
   Cart UI (unchanged)
   -------------------------------------------------- */
const Cart = ({ cart, isOpen, onClose, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout, user }) => {
  if (!isOpen) return null;
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const deliveryFee = subtotal > 299 ? 0 : 35;
  const serviceFee = Math.max(10, subtotal * 0.02);
  const grandTotal = subtotal + deliveryFee + serviceFee;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Your Cart</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
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
              {cart.map((item, idx) => (
                <div key={`${item.product._id}-${item.restaurant._id}`} className="border-b pb-4 mb-4">
                  {idx === 0 || cart[idx - 1].restaurant._id !== item.restaurant._id ? (
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
                        onClick={() => onUpdateQuantity(item.product._id, item.restaurant._id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product._id, item.restaurant._id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-red-800 font-semibold">₱{(item.product.price * item.quantity).toFixed(2)}</span>
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
            <div className="border-t p-4 space-y-3">
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

/* --------------------------------------------------
   Login & Register forms (unchanged except map swap)
   -------------------------------------------------- */
const LoginForm = ({ onLogin, onSwitchToRegister, onClose, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await onLogin(email, password);
    if (!result.success) setError(result.message);
    else onClose();
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
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

const CustomerRegisterForm = ({ onRegister, onSwitchToLogin, onSwitchToRestaurant, onSwitchToRider, onClose, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'customer',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await onRegister(formData);
    if (!result.success) setError(result.message);
    else onClose();
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLocationSelect = (addr, lat, lng) =>
    setFormData((p) => ({ ...p, address: addr, location: { lat, lng } }));

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-red-800 rounded-lg flex items-center justify-center shadow-md mb-4">
          <span className="text-white font-bold text-xl">FX</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join as Customer</h2>
        <p className="text-gray-600">Create your account to start ordering food</p>
      </div>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
            placeholder="09XXXXXXXXX"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Location</label>
          <LocationMap onLocationSelect={handleLocationSelect} initialAddress={formData.address} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-800 text-white py-3 rounded-lg font-semibold hover:bg-red-900 transition-colors disabled:opacity-50"
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

const RestaurantRegisterForm = ({ onRegister, onSwitchToLogin, onSwitchToCustomer, onSwitchToRider, onClose, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'restaurant',
    restaurantName: '',
    cuisine: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await onRegister(formData);
    if (!result.success) setError(result.message);
    else onClose();
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLocationSelect = (addr, lat, lng) =>
    setFormData((p) => ({ ...p, address: addr, location: { lat, lng } }));

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-orange-600 rounded-lg flex items-center justify-center shadow-md mb-4">
          <Store className="text-white" size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join as Restaurant</h2>
        <p className="text-gray-600">Register your restaurant and start serving customers</p>
      </div>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
          <input
            type="text"
            name="restaurantName"
            value={formData.restaurantName}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            required
            disabled={loading}
          >
            <option value="">Select Cuisine</option>
            {['Filipino', 'Chinese', 'Japanese', 'Korean', 'American', 'Italian', 'Mexican', 'Fast Food', 'Vegetarian', 'Seafood', 'Barbecue', 'Desserts'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            placeholder="09XXXXXXXXX"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Location</label>
          <LocationMap onLocationSelect={handleLocationSelect} initialAddress={formData.address} />
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Restaurant accounts require admin approval before you can start accepting orders. This usually takes 24-48 hours.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
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

const RiderRegisterForm = ({ onRegister, onSwitchToLogin, onSwitchToCustomer, onSwitchToRestaurant, onClose, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'rider',
    vehicleType: 'motorcycle',
    licenseNumber: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await onRegister(formData);
      if (!result.success) setError(result.message || 'Registration failed.');
      else {
        if (result.needsApproval) alert('✅ Registration successful! Your rider account is pending admin approval. You will be notified once approved.');
        onClose();
      }
    } catch (e) {
      console.error(e);
      setError('Network error.');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLocationSelect = (addr, lat, lng) =>
    setFormData((p) => ({ ...p, address: addr, location: { lat, lng } }));

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center shadow-md mb-4">
          <Bike className="text-white" size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join as Rider</h2>
        <p className="text-gray-600">Become a delivery rider and start earning</p>
      </div>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Enter license number if applicable"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Home Location *</label>
          <LocationMap onLocationSelect={handleLocationSelect} initialAddress={formData.address} />
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Rider accounts require admin approval before you can start accepting delivery requests. This usually takes 24-48 hours.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
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

/* --------------------------------------------------
   RestaurantCard (unchanged)
   -------------------------------------------------- */
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
      const id = restaurant._id || restaurant.id;
      if (!id) {
        setError('Restaurant ID not available');
        return;
      }
      const res = await fetch(`https://food-ordering-app-production-35eb.up.railway.app/api/products/restaurant/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.products) {
          setProducts(data.products);
          setShowProducts(true);
        } else {
          setError('No menu items available');
        }
      } else {
        setError('Failed to load menu');
      }
    } catch (e) {
      console.error(e);
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
    const first = products[0];
    onAddToCart(first, restaurant);
    alert(`✅ Quick order: ${first.name} added to cart! Proceed to checkout.`);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200">
        <div className="h-48 bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center relative">
          {restaurant.image ? (
            <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-4xl">🍕</span>
          )}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">{restaurant.cuisine || 'Food'}</div>
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
            <span className="text-xs line-clamp-1">{restaurant.address || 'Puerto Princesa City'}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">{restaurant.cuisine || 'Various'}</span>
            <span className="text-green-600 font-semibold flex items-center text-xs">
              <Clock size={12} className="mr-1" />
              {restaurant.deliveryTime || '25-35 min'}
            </span>
          </div>
          <button
            onClick={fetchProducts}
            disabled={loadingProducts}
            className="w-full bg-red-800 text-white py-3 rounded-lg mb-3 hover:bg-red-900 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
          >
            {loadingProducts ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Loading Menu...</span>
              </>
            ) : (
              <span className="text-sm">📖 VIEW FULL MENU</span>
            )}
          </button>
          <div className="flex justify-between items-center mt-3 pt-3 border-t">
            <span className="text-red-800 font-bold text-sm">₱{restaurant.deliveryFee || '35'} delivery</span>
            <button
              onClick={handleQuickOrder}
              disabled={!user}
              className="bg-red-800 text-white px-4 py-2 rounded text-sm hover:bg-red-900 transition-colors disabled:opacity-50"
            >
              {user ? 'QUICK ORDER' : 'LOGIN TO ORDER'}
            </button>
          </div>
        </div>
      </div>

      {showProducts && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="bg-red-800 text-white sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button onClick={closeMenu} className="p-2 hover:bg-red-900 rounded-lg transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                    <p className="text-red-100 text-sm">{restaurant.cuisine} • {restaurant.address}</p>
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
          <div className="container mx-auto px-4 py-6">
            {error ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No menu items available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                    <div className="h-48 bg-gray-100 relative">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-6xl">🍽️</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-3 py-1 rounded-full">
                        <span className="text-green-600 font-bold text-lg">₱{product.price}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-xl text-gray-900 mb-2">{product.name}</h3>
                      {product.description && <p className="text-gray-600 text-base mb-3 leading-relaxed">{product.description}</p>}
                      {product.ingredients && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-500 font-semibold mb-1">Ingredients:</p>
                          <p className="text-gray-600 text-sm">{product.ingredients}</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">{product.category}</span>
                          <span className="text-blue-600 text-sm flex items-center">
                            <Clock size={14} className="mr-1" />
                            {product.preparationTime || 15} min
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!user}
                          className="bg-red-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-900 transition-colors disabled:opacity-50 text-sm"
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
          <div className="bg-gray-100 border-t mt-8">
            <div className="container mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600">
                    Showing <strong>{products.length}</strong> menu item{products.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button onClick={closeMenu} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors">
                    CLOSE MENU
                  </button>
                  {user && products.length > 0 && (
                    <button
                      onClick={() => {
                        handleAddToCart(products[0]);
                        closeMenu();
                      }}
                      className="bg-red-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-900 transition-colors"
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

/* --------------------------------------------------
   TrackOrder (unchanged)
   -------------------------------------------------- */
const TrackOrder = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingId, setTrackingId] = useState('');

  useEffect(() => {
    if (user) fetchUserOrders();
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
      const res = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/orders/user', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setOrders(data.orders || []);
        else setError(data.message || 'Failed to load orders');
      } else {
        const text = await res.text();
        console.error(text);
        setError('Failed to fetch orders');
      }
    } catch (e) {
      console.error(e);
      setError('Network error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const trackOrderById = async () => {
    if (!trackingId.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`https://food-ordering-app-production-35eb.up.railway.app/api/orders/track/${trackingId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setOrders(data.order ? [data.order] : []);
        setError('');
      } else {
        setError(data.message || 'Order not found');
        setOrders([]);
      }
    } catch (e) {
      console.error(e);
      setError('Network error tracking order');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup';
      case 'out_for_delivery':
        return 'On the Way';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusIndex = (status) => ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].indexOf(status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Monitor your food delivery in real-time</p>
          <div className="mt-6 flex space-x-4">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter Order ID"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800"
            />
            <button
              onClick={trackOrderById}
              disabled={!trackingId.trim()}
              className="bg-red-800 text-white px-6 py-3 rounded-lg hover:bg-red-900 disabled:opacity-50"
            >
              Track Order
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border-b border-gray-200 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderId || order._id?.slice(-8).toUpperCase() || 'N/A'}</h3>
                      <p className="text-gray-600 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Order Details</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>
                              {item.productName || item.product?.name || `Item ${index + 1}`} x {item.quantity}
                            </span>
                            <span>₱{((item.price || 0) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t mt-3 pt-3">
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>₱{(order.total || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Delivery Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Address:</strong> {order.deliveryAddress}</p>
                        <p><strong>Payment:</strong> {order.paymentMethod}</p>
                        {order.rider && <p><strong>Rider:</strong> {order.rider.name}</p>}
                        {order.specialInstructions && <p><strong>Instructions:</strong> {order.specialInstructions}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Order Progress</h4>
                    <div className="flex items-center justify-between">
                      {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((status, index) => (
                        <div key={status} className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              getStatusIndex(order.status) >= index ? 'bg-red-800 text-white' : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <span className="text-xs mt-2 text-center">{getStatusText(status)}</span>
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

/* --------------------------------------------------
   UserProfile (unchanged)
   -------------------------------------------------- */
const UserProfile = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) setFormData({ name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '' });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/users/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Profile updated successfully!');
        onUpdate(data.user);
      } else {
        setMessage(data.message || 'Failed to update profile');
      }
    } catch (e) {
      console.error(e);
      setMessage('Network error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  if (!user)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please login to view your profile</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600 mb-6">Manage your account information</p>
          {message && (
            <div className={`p-4 rounded mb-6 ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-800 text-white py-3 rounded-lg font-semibold hover:bg-red-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'UPDATE PROFILE'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------
   RestaurantDashboard (unchanged)
   -------------------------------------------------- */
const RestaurantDashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 });

  useEffect(() => {
    if (user) fetchRestaurantData();
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
      const [ordersRes, productsRes] = await Promise.all([
        fetch('https://food-ordering-app-production-35eb.up.railway.app/api/orders/restaurant', { headers: getAuthHeaders() }),
        fetch('https://food-ordering-app-production-35eb.up.railway.app/api/products/restaurant', { headers: getAuthHeaders() }),
      ]);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        if (data.success) {
          setOrders(data.orders || []);
          const total = data.orders.length;
          const pending = data.orders.filter((o) => ['pending', 'confirmed', 'preparing'].includes(o.status)).length;
          const completed = data.orders.filter((o) => o.status === 'delivered').length;
          const revenue = data.orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0);
          setStats({ totalOrders: total, pendingOrders: pending, completedOrders: completed, totalRevenue: revenue });
        }
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        if (data.success) setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
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
      const res = await fetch(`https://food-ordering-app-production-35eb.up.railway.app/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRestaurantData();
        alert(`Order status updated to ${newStatus}`);
      } else {
        alert(data.message || 'Failed to update order status');
      }
    } catch (e) {
      console.error(e);
      alert('Network error updating order status');
    }
  };

  if (!user || user.role !== 'restaurant')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Restaurant dashboard is only available for restaurant owners</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Dashboard</h1>
          <p className="text-gray-600">Manage your restaurant operations</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-red-800">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Orders</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed Orders</h3>
            <p className="text-3xl font-bold text-green-600">{stats.completedOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-blue-600">₱{stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'orders', name: 'Orders', count: orders.length },
                { id: 'products', name: 'Products', count: products.length },
                { id: 'analytics', name: 'Analytics' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === tab.id ? 'border-red-800 text-red-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">{tab.count}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">Order #{order.orderId || order._id?.slice(-8).toUpperCase() || 'N/A'}</h4>
                        <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'preparing'
                            ? 'bg-orange-100 text-orange-800'
                            : order.status === 'ready'
                            ? 'bg-purple-100 text-purple-800'
                            : order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="mb-3">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.productName || item.product?.name || `Item ${index + 1}`} x {item.quantity}</span>
                          <span>₱{((item.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total: ₱{(order.total || 0).toFixed(2)}</span>
                      <div className="space-x-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'confirmed')}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Confirm
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'preparing')}
                            className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'ready')}
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
            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Menu Items</h3>
                  <button className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Add Product</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div key={product._id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-red-800 font-bold">₱{product.price}</span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{product.category}</span>
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

/* --------------------------------------------------
   MAIN DASHBOARD (unchanged except map swap)
   -------------------------------------------------- */
const CustomerDashboard = () => {
  const { user, login, register, logout, loading: authLoading, updateUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [apiError, setApiError] = useState('');
  const [activeSection, setActiveSection] = useState('home');

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
  } = useCart();

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoadingRestaurants(true);
      setApiError('');
      try {
        const res = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/restaurants');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setRestaurants(data);
          else if (data && Array.isArray(data.restaurants)) setRestaurants(data.restaurants);
          else setRestaurants([]);
        } else {
          setApiError('Failed to load restaurants from server');
          setRestaurants([]);
        }
      } catch (e) {
        console.error(e);
        setApiError('Network error loading restaurants');
        setRestaurants([]);
      } finally {
        setLoadingRestaurants(false);
      }
    };
    fetchRestaurants();
  }, []);

  const handleLogin = async (email, password) => await login(email, password);

  const handleRegister = async (formData) => await register(formData);

  const handleAddToCart = (product, restaurant) => {
    if (!user) {
      setShowAuthModal(true);
      setAuthMode('login');
      return;
    }
    addToCart(product, restaurant);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!user) {
      setShowAuthModal(true);
      setAuthMode('login');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Session expired. Please login again.');
      logout();
      return;
    }
    try {
      const orderId = `FX${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
      const orderData = {
        orderId,
        restaurantId: cart[0].restaurant._id,
        items: cart.map((i) => ({
          productId: i.product._id,
          productName: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
        })),
        deliveryAddress: user.address || 'Puerto Princesa City',
        paymentMethod: 'cash',
        specialInstructions: '',
      };
      const res = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/orders/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 Order placed successfully!');
        clearCart();
        setIsCartOpen(false);
        setActiveSection('track');
      } else {
        alert(`Order failed: ${data.message}`);
      }
    } catch (e) {
      console.error(e);
      alert('Checkout failed. Please try again.');
    }
  };

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderNavigation = () => (
    <nav className="hidden lg:flex items-center space-x-8">
      <button
        onClick={() => setActiveSection('home')}
        className={`font-semibold text-sm ${activeSection === 'home' ? 'text-red-800 border-b-2 border-red-800' : 'text-gray-700 hover:text-red-800'}`}
      >
        HOME
      </button>
      <button
        onClick={() => setActiveSection('track')}
        className={`font-semibold text-sm ${activeSection === 'track' ? 'text-red-800 border-b-2 border-red-800' : 'text-gray-700 hover:text-red-800'}`}
      >
        TRACK ORDER
      </button>
      {user && user.role === 'restaurant' && (
        <button
          onClick={() => setActiveSection('restaurant')}
          className={`font-semibold text-sm ${activeSection === 'restaurant' ? 'text-red-800 border-b-2 border-red-800' : 'text-gray-700 hover:text-red-800'}`}
        >
          RESTAURANT DASHBOARD
        </button>
      )}
      {user && (
        <button
          onClick={() => setActiveSection('profile')}
          className={`font-semibold text-sm ${activeSection === 'profile' ? 'text-red-800 border-b-2 border-red-800' : 'text-gray-700 hover:text-red-800'}`}
        >
          PROFILE
        </button>
      )}
    </nav>
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
        return (
          <>
            <div className="bg-gradient-to-r from-red-800 to-red-900 text-white py-16">
              <div className="max-w-7xl mx-auto px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">DELICIOUS FOOD DELIVERED TO YOUR DOORSTEP</h1>
                <p className="text-lg md:text-xl mb-8 opacity-90">Experience the best food delivery service in town</p>
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <button
                    onClick={() => (user ? setIsCartOpen(true) : setShowAuthModal(true))}
                    className="bg-white text-red-800 px-8 py-4 rounded font-bold text-lg hover:bg-gray-100 transition-colors"
                  >
                    {user ? 'ORDER NOW' : 'LOGIN TO ORDER'}
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
                <button className="text-red-800 hover:text-red-900 font-semibold">VIEW ALL →</button>
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
                    <p className="text-yellow-800 font-semibold mb-2">API Connection</p>
                    <p className="text-yellow-700 text-sm">{apiError}</p>
                    <p className="text-yellow-600 text-xs mt-2">Using real-time data from your database</p>
                  </div>
                </div>
              ) : filteredRestaurants.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-blue-800 font-semibold">No Restaurants Yet</p>
                    <p className="text-blue-700 text-sm mt-2">No restaurants found in your database. Add restaurants via admin panel.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      onClick={() => {
                        setShowAuthModal(true);
                        setAuthMode('customer');
                      }}
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
                      onClick={() => {
                        setShowAuthModal(true);
                        setAuthMode('restaurant');
                      }}
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
                      onClick={() => {
                        setShowAuthModal(true);
                        setAuthMode('rider');
                      }}
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
                  onClick={() => (user ? console.log('Grab offer') : setShowAuthModal(true))}
                  className="bg-white text-red-800 px-8 py-3 rounded font-bold text-lg hover:bg-gray-100 transition-colors"
                >
                  {user ? 'GRAB THIS OFFER' : 'LOGIN TO GET OFFER'}
                </button>
              </div>
            </div>
          </>
        );
    }
  };

  if (authLoading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="bg-gray-800 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm">Free delivery on orders over ₱299! • ⭐ Rate your experience and get rewards</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-800 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">FX</div>
              <div>
                <h1 className="text-2xl font-bold text-red-800">FOODEXPRESS</h1>
                <p className="text-xs text-gray-600">Delivery Service</p>
              </div>
            </div>
            {renderNavigation()}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-700">Welcome, {user.name}!</span>
                    {user.role === 'restaurant' && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">Restaurant</span>
                    )}
                    {user.role === 'rider' && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Rider</span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative flex items-center space-x-2 text-gray-700 hover:text-red-800"
                  >
                    <ShoppingCart size={24} />
                    <span className="font-medium">CART</span>
                    {getCartItemCount() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        {getCartItemCount()}
                      </span>
                    )}
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
                    onClick={() => {
                      setShowAuthModal(true);
                      setAuthMode('login');
                    }}
                    className="text-gray-700 hover:text-red-800 font-medium"
                  >
                    LOGIN
                  </button>
                  <div className="relative group">
                    <button className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 transition-colors shadow-md">SIGN UP</button>
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 hidden group-hover:block z-50">
                      <button
                        onClick={() => {
                          setShowAuthModal(true);
                          setAuthMode('customer');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        As Customer
                      </button>
                      <button
                        onClick={() => {
                          setShowAuthModal(true);
                          setAuthMode('restaurant');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        As Restaurant
                      </button>
                      <button
                        onClick={() => {
                          setShowAuthModal(true);
                          setAuthMode('rider');
                        }}
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
        {activeSection === 'home' && (
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
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-red-800"
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
        )}
      </header>

      {renderActiveSection()}

      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">FOODEXPRESS</h3>
              <p className="text-gray-400 mb-4">Delivering delicious food to your doorstep with the best quality and service.</p>
              <div className="flex space-x-4">
                {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                  <Icon key={index} size={20} className="text-gray-400 hover:text-white cursor-pointer" />
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">QUICK LINKS</h4>
              <ul className="space-y-2 text-gray-400">
                {['About Us', 'Contact Us', 'FAQs', 'Privacy Policy'].map((link, index) => (
                  <li key={index}>
                    <button className="hover:text-white transition-colors">{link}</button>
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
                <button className="bg-red-800 text-white px-4 py-2 rounded-r hover:bg-red-900 transition-colors">SUBSCRIBE</button>
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
                  <span key={index} className="hover:text-white transition-colors cursor-pointer">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

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