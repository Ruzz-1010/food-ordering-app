// OrdersTab.jsx - DEBUG VERSION
import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, ChevronDown, ChevronUp, 
  Bug, AlertCircle, RefreshCw
} from 'lucide-react';

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [error, setError] = useState('');

  const API_URL = 'https://food-ordering-app-83lm.onrender.com/api';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      setDebugInfo('Fetching orders...\n');
      
      const token = localStorage.getItem('token');
      setDebugInfo(prev => prev + `Token: ${token ? 'Present' : 'MISSING'}\n`);
      
      if (!token) {
        setError('No authentication token found. Please login.');
        setLoading(false);
        return;
      }

      const url = `${API_URL}/admin/orders`;
      setDebugInfo(prev => prev + `URL: ${url}\n`);
      
      const res = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setDebugInfo(prev => prev + `Response Status: ${res.status}\n`);
      
      if (!res.ok) {
        const errorText = await res.text();
        setDebugInfo(prev => prev + `Error Response: ${errorText}\n`);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      setDebugInfo(prev => prev + `Response Data: ${JSON.stringify(data, null, 2).substring(0, 500)}...\n`);
      
      console.log('Orders data:', data);
      
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
        setDebugInfo(prev => prev + `✅ Loaded ${data.orders.length} orders\n`);
      } else if (Array.isArray(data)) {
        setOrders(data);
        setDebugInfo(prev => prev + `✅ Loaded ${data.length} orders (direct array)\n`);
      } else {
        setOrders([]);
        setDebugInfo(prev => prev + `⚠️ No orders array in response\n`);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(`Failed to load orders: ${error.message}`);
      setDebugInfo(prev => prev + `❌ Error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  // Alternative fetch - try different endpoints
  const tryAlternativeEndpoints = async () => {
    const token = localStorage.getItem('token');
    const endpoints = [
      '/admin/orders',
      '/orders',
      '/riders/orders',
      '/auth/orders'
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const url = `${API_URL}${endpoint}`;
        const res = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        results.push(`${endpoint}: ${res.status} - ${data.orders?.length || 0} orders`);
      } catch (e) {
        results.push(`${endpoint}: ERROR - ${e.message}`);
      }
    }
    
    setDebugInfo(results.join('\n'));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => ({
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    preparing: 'bg-orange-100 text-orange-700 border-orange-200',
    ready: 'bg-purple-100 text-purple-700 border-purple-200',
    out_for_delivery: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200'
  }[status] || 'bg-gray-100 text-gray-700');

  const updateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        fetchOrders();
      } else {
        const errorData = await res.text();
        alert(`Failed to update status: ${errorData}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Debug Panel */}
      <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-sm flex items-center">
            <Bug size={14} className="mr-1" /> Debug Info
          </h4>
          <div className="space-x-2">
            <button 
              onClick={() => setDebugInfo('')}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
            <button 
              onClick={tryAlternativeEndpoints}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Test Endpoints
            </button>
          </div>
        </div>
        <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all max-h-40 overflow-y-auto bg-white p-2 rounded">
          {debugInfo || 'No debug info yet...'}
        </pre>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-gray-500 mt-1">Manage and track all orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error Loading Orders</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by number, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
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
          <option value="ready">Ready</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-800">{orders.length}</p>
          <p className="text-xs text-blue-600">Total</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-800">{orders.filter(o => o.status === 'pending').length}</p>
          <p className="text-xs text-yellow-600">Pending</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-800">{orders.filter(o => o.status === 'delivered').length}</p>
          <p className="text-xs text-green-600">Delivered</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-purple-800">
            ₱{orders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-purple-600">Total Revenue</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No orders found</p>
            <p className="text-sm text-gray-400 mt-1">
              {orders.length === 0 ? 'No orders in database' : 'No orders match your filters'}
            </p>
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
                      <p className="font-semibold text-gray-900">
                        #{order.orderNumber || order.orderId || order._id?.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.customer?.name || order.user?.name || 'Unknown Customer'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                      {order.status || 'unknown'}
                    </span>
                    <p className="font-bold text-gray-900">
                      ₱{(order.totalAmount || order.total || 0).toLocaleString()}
                    </p>
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
                        <p className="font-medium text-gray-900">
                          {order.customer?.name || order.user?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.customer?.email || order.user?.email || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.customer?.phone || order.user?.phone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Restaurant</p>
                        <p className="font-medium text-gray-900">
                          {order.restaurant?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
                        <p className="font-medium text-gray-900">
                          {order.deliveryAddress || order.address || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Order Date</p>
                        <p className="font-medium text-gray-900">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">Order Items</p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm py-1">
                              <span>{item.productName || item.name || 'Item'} x {item.quantity}</span>
                              <span>₱{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Status Actions */}
                    <div className="flex flex-wrap gap-2">
                      {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
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
                          {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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