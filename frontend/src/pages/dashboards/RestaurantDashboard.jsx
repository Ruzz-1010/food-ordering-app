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
  const [activeTab, setActiveTab] = useState('available');

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

  // ✅ Accept order
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

  // ✅ Update delivery status
  const updateStatus = async (orderId, status) => {
    const res = await fetch(`${API_URL}/orders/${orderId}/delivery-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (res.ok) {
      alert(`✅ Status updated to ${status}`);
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
        <div className="flex space-x-4 mb-6">
          <button onClick={() => setActiveTab('available')} className={`px-4 py-2 rounded-lg ${activeTab === 'available' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border'}`}>Available ({available.length})</button>
          <button onClick={() => setActiveTab('my-deliveries')} className={`px-4 py-2 rounded-lg ${activeTab === 'my-deliveries' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border'}`}>My Deliveries ({myDeliveries.length})</button>
        </div>

        {activeTab === 'available' && (
          <div className="grid gap-4">
            {available.length === 0 && <div className="text-center py-8 text-gray-500">No available orders right now.</div>}
            {available.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Order #{order.orderId}</p>
                  <p className="text-sm text-gray-600">{order.restaurant.name} • {order.restaurant.address}</p>
                  <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
                  <p className="text-green-600 font-bold">₱{order.total?.toFixed(2)}</p>
                </div>
                <button onClick={() => acceptOrder(order._id)} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">Accept</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'my-deliveries' && (
          <div className="grid gap-4">
            {myDeliveries.length === 0 && <div className="text-center py-8 text-gray-500">You haven't accepted any deliveries yet.</div>}
            {myDeliveries.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">Order #{order.orderId}</p>
                    <p className="text-sm text-gray-600">{order.restaurant.name} → {order.deliveryAddress}</p>
                    <p className="text-green-600 font-bold">₱{order.total?.toFixed(2)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{order.status}</span>
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  {order.status === 'assigned' && (
                    <button onClick={() => updateStatus(order._id, 'out_for_delivery')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Mark Out for Delivery</button>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <button onClick={() => updateStatus(order._id, 'delivered')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Mark Delivered</button>
                  )}
                  <a href={`tel:${order.user.phone}`} className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center space-x-1"><Phone size={14} /><span>Call</span></a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;