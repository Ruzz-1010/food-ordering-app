import React, { useState, useEffect } from 'react';
import { Store, Package, Plus, Eye, X, Save, LogOut, RefreshCw, User, Phone, DollarSign, Image } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

const RestaurantDashboard = () => {
  const { user, logout, getRestaurantId, refreshRestaurantData } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurant, setRestaurant] = useState({});
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', description: '', category: 'main course', preparationTime: '', ingredients: '', image: ''
  });

  const [profileData, setProfileData] = useState({
    description: '', openingHours: { open: '08:00', close: '22:00' },
    deliveryTime: '25-35 min', deliveryFee: 35, image: '', bannerImage: ''
  });

  // 🔍 1. Get restaurant ID (once)
  const getRestaurant = async () => {
    if (!user || user.role !== 'restaurant') return;
    let id = getRestaurantId();
    if (!id) {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/restaurants/owner/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.restaurant) {
        id = data.restaurant._id;
        setRestaurant(data.restaurant);
        refreshRestaurantData();
      }
    }
    setRestaurantId(id);
    return id;
  };

  // 📦 2. Fetch orders for this restaurant (with token)
  const fetchOrders = async (id) => {
    if (!id) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/orders/restaurant/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) setOrders(data.orders);
  };

  // 🍽️ 3. Fetch menu (with token)
  const fetchMenu = async (id) => {
    if (!id) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/products/restaurant/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) setMenuItems(data.products);
  };

  // 🔄 4. Load everything
  const loadAll = async () => {
    setLoading(true);
    const id = await getRestaurant();
    if (id) {
      await Promise.all([fetchOrders(id), fetchMenu(id)]);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [user]);

  // 💰 Stats
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => ['delivered', 'completed'].includes(o.status)).length,
    todayRevenue: orders
      .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString() && ['delivered', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + (o.total || 0), 0),
  };

  const formatCurrency = n => `₱${Number(n || 0).toFixed(2)}`;
  const formatDate = d => new Date(d).toLocaleString();

  // ✅ Add product
  const handleAddProduct = async e => {
    e.preventDefault();
    if (!restaurantId) return alert('Restaurant not found');
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...newProduct, restaurantId })
    });
    if (res.ok) {
      alert('✅ Product added');
      setShowAddProduct(false);
      setNewProduct({ name: '', price: '', description: '', category: 'main course', preparationTime: '', ingredients: '', image: '' });
      fetchMenu(restaurantId);
    } else alert('❌ Failed to add product');
  };

  // ✅ Update order status
  const updateOrderStatus = async (orderId, status) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    fetchOrders(restaurantId);
  };

  // 🖥️ UI
  if (loading) return <div className="p-6">Loading...</div>;
  if (!user || user.role !== 'restaurant') return <div className="p-6">Access Denied</div>;
  if (!restaurantId) return <div className="p-6">❌ Restaurant not found. Contact support.</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Restaurant Dashboard</h1>
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded">Logout</button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow"><p className="text-sm">Today’s Revenue</p><p className="text-xl font-bold">{formatCurrency(stats.todayRevenue)}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm">Total Orders</p><p className="text-xl font-bold">{stats.totalOrders}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm">Pending</p><p className="text-xl font-bold text-orange-600">{stats.pendingOrders}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm">Menu Items</p><p className="text-xl font-bold text-green-600">{menuItems.length}</p></div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Orders</h2>
              <button onClick={() => setShowAddProduct(true)} className="bg-orange-600 text-white px-3 py-1 rounded">+ Add Product</button>
            </div>
            {orders.length === 0 ? (
              <p className="text-gray-500">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o._id} className="border rounded p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">#{o.orderId}</p>
                      <p className="text-sm text-gray-600">{formatDate(o.createdAt)}</p>
                      <p className="text-sm">{formatCurrency(o.total)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${o.status === 'pending' ? 'bg-yellow-100' : o.status === 'delivered' ? 'bg-green-100' : 'bg-gray-100'}`}>{o.status}</span>
                      <button onClick={() => { setSelectedOrder(o); setShowOrderDetails(true); }} className="text-blue-600"><Eye size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Menu</h2>
            {menuItems.length === 0 ? (
              <p className="text-gray-500">No menu items.</p>
            ) : (
              <div className="space-y-3">
                {menuItems.map(item => (
                  <div key={item._id} className="border rounded p-3">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(item.price)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Product</h3>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <input required placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full border rounded px-3 py-2" />
              <input required type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full border rounded px-3 py-2" />
              <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full border rounded px-3 py-2" />
              <button className="w-full bg-orange-600 text-white py-2 rounded">Add</button>
              <button type="button" onClick={() => setShowAddProduct(false)} className="w-full bg-gray-200 py-2 rounded">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Order #{selectedOrder.orderId}</h3>
            <p><strong>Customer:</strong> {selectedOrder.user?.name}</p>
            <p><strong>Total:</strong> {formatCurrency(selectedOrder.total)}</p>
            <p><strong>Status:</strong> {selectedOrder.status}</p>
            <div className="mt-4 flex space-x-2">
              {selectedOrder.status === 'pending' && <button onClick={() => updateOrderStatus(selectedOrder._id, 'confirmed')} className="bg-blue-600 text-white px-3 py-1 rounded">Accept</button>}
              {selectedOrder.status === 'confirmed' && <button onClick={() => updateOrderStatus(selectedOrder._id, 'preparing')} className="bg-purple-600 text-white px-3 py-1 rounded">Start Preparing</button>}
              {selectedOrder.status === 'preparing' && <button onClick={() => updateOrderStatus(selectedOrder._id, 'ready')} className="bg-green-600 text-white px-3 py-1 rounded">Mark Ready</button>}
              <button onClick={() => setShowOrderDetails(false)} className="bg-gray-200 px-3 py-1 rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;