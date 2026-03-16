// OrdersTab.jsx - CLEAN MODERN DESIGN
import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, ChevronDown, ChevronUp, 
  MoreHorizontal, CheckCircle, XCircle, Clock
} from 'lucide-react';

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const API_URL = 'https://food-ordering-app-83lm.onrender.com/api';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => ({
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    preparing: 'bg-orange-100 text-orange-700 border-orange-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200'
  }[status] || 'bg-gray-100 text-gray-700');

  const updateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-gray-500 mt-1">Manage and track all orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredOrders.map((order) => (
              <div key={order._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <Package size={20} className="text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">#{order.orderNumber || order._id?.slice(-6)}</p>
                      <p className="text-sm text-gray-500">{order.customer?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <p className="font-bold text-gray-900">₱{(order.totalAmount || 0).toLocaleString()}</p>
                    <button 
                      onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {expandedOrder === order._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order._id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Customer</p>
                        <p className="font-medium text-gray-900">{order.customer?.name}</p>
                        <p className="text-sm text-gray-500">{order.customer?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Restaurant</p>
                        <p className="font-medium text-gray-900">{order.restaurant?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
                        <p className="font-medium text-gray-900">{order.deliveryAddress}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Order Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Status Actions */}
                    <div className="flex flex-wrap gap-2">
                      {['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'].map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(order._id, status)}
                          disabled={order.status === status}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            order.status === status 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTab;