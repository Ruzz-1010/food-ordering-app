import React, { useState, useEffect } from 'react';
import {
  Navigation, Package, DollarSign, Clock, CheckCircle, Phone, X, LogOut, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);

  const token = localStorage.getItem('token');

  // ✅ Fetch available orders
  const fetchAvailable = async () => {
    const res = await fetch(`${API_URL}/orders/rider/available`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) setAvailable(data.orders);
  };

  // ✅ Fetch my deliveries
  const fetchMyDeliveries = async () => {
    const res = await fetch(`${API_URL}/orders/rider/my-deliveries`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) setMyDeliveries(data.orders);
  };

  // ✅ Accept order (old working version)
  const acceptOrder = async (orderId) => {
    const res = await fetch(`${API_URL}/orders/${orderId}/accept`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (res.ok) {
      alert('✅ Order assigned to you!');
      fetchAvailable();
      fetchMyDeliveries();
    } else {
      alert(`❌ Failed: ${data.message || 'Unknown error'}`);
    }
  };

  // 🔄 Load on mount
  useEffect(() => {
    if (user && user.role === 'rider') {
      Promise.all([fetchAvailable(), fetchMyDeliveries()]).then(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || user.role !== 'rider') return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Navigation className="text-orange-600" size={24} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Rider Dashboard</h1>
              <p className="text-sm text-gray-500">{user.name} • {user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => { fetchAvailable(); fetchMyDeliveries(); }} className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"><RefreshCw size={16} /><span>Refresh</span></button>
            <button onClick={logout} className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"><LogOut size={16} /><span>Logout</span></button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Orders */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold text-lg mb-4">Available Orders ({available.length})</h2>
            {available.length === 0 && <p className="text-gray-500 text-sm">No available orders.</p>}
            {available.map(order => (
              <div key={order._id} className="border rounded-lg p-3 mb-3">
                <p className="font-semibold">Order #{order.orderId}</p>
                <p className="text-sm text-gray-600">{order.restaurant.name} → {order.deliveryAddress}</p>
                <p className="text-green-600 font-bold">₱{order.total?.toFixed(2)}</p>
                <button onClick={() => acceptOrder(order._id)} className="mt-2 bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700">Accept</button>
              </div>
            ))}
          </div>

          {/* My Deliveries */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold text-lg mb-4">My Deliveries ({myDeliveries.length})</h2>
            {myDeliveries.length === 0 && <p className="text-gray-500 text-sm">No deliveries yet.</p>}
            {myDeliveries.map(order => (
              <div key={order._id} className="border rounded-lg p-3 mb-3">
                <p className="font-semibold">Order #{order.orderId}</p>
                <p className="text-sm text-gray-600">{order.restaurant.name} → {order.deliveryAddress}</p>
                <p className="text-green-600 font-bold">₱{order.total?.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Status: {order.status}</p>

                <div className="flex space-x-2 mt-2">
                  {order.status === 'assigned' && (
                    <button onClick={() => updateStatus(order._id, 'out_for_delivery')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Out for Delivery</button>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <button onClick={() => updateStatus(order._id, 'delivered')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Mark Delivered</button>
                  )}
                  <a href={`tel:${order.user.phone}`} className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">Call</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;