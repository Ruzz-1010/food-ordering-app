// OrdersTab.jsx - CLEANED AND OPTIMIZED VERSION
import React, { useState, useEffect } from 'react';
import { 
  Package, RefreshCw, CheckCircle, Truck, 
  Clock, MapPin, User, ChevronDown, ChevronUp, AlertCircle 
} from 'lucide-react';

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [error, setError] = useState('');

  const RAILWAY_BACKEND_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to access orders');
        return;
      }

      const response = await fetch(`${RAILWAY_BACKEND_URL}/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load orders: ${response.status}`);
      }

      const data = await response.json();
      
      let ordersArray = [];
      if (data.success && Array.isArray(data.orders)) {
        ordersArray = data.orders;
      } else if (data.success && Array.isArray(data.data)) {
        ordersArray = data.data;
      } else if (Array.isArray(data)) {
        ordersArray = data;
      }
      
      setOrders(ordersArray);
      
    } catch (error) {
      setError(`Failed to load orders: ${error.message}`);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${RAILWAY_BACKEND_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`Failed to update order status`);
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchOrders();
      } else {
        throw new Error(data.error || 'Failed to update order status');
      }
    } catch (error) {
      alert(`Failed to update order status: ${error.message}`);
    }
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: '⏳ Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: '✅ Confirmed' },
      preparing: { color: 'bg-orange-100 text-orange-800', label: '👨‍🍳 Preparing' },
      ready: { color: 'bg-purple-100 text-purple-800', label: '📦 Ready' },
      out_for_delivery: { color: 'bg-indigo-100 text-indigo-800', label: '🚚 Out for Delivery' },
      delivered: { color: 'bg-green-100 text-green-800', label: '🎉 Delivered' },
      completed: { color: 'bg-green-100 text-green-800', label: '✅ Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: '❌ Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTotalRevenue = () => {
    return orders
      .filter(order => order.status === 'delivered' || order.status === 'completed')
      .reduce((total, order) => total + (order.totalAmount || order.total || order.amount || 0), 0);
  };

  // Calculate statistics
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
  const inProgressOrders = orders.filter(o => ['preparing', 'ready', 'out_for_delivery', 'confirmed'].includes(o.status)).length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Order Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Order Management</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Failed to load orders</p>
            <p className="text-red-700 text-sm">{error}</p>
            <button 
              onClick={fetchOrders}
              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary - Optimized for all devices */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-600">Total Orders</p>
              <p className="text-lg font-bold text-orange-800">{orders.length}</p>
            </div>
            <Package size={16} className="text-orange-600 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-600">Completed</p>
              <p className="text-lg font-bold text-green-800">{completedOrders}</p>
            </div>
            <CheckCircle size={16} className="text-green-600 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600">In Progress</p>
              <p className="text-lg font-bold text-blue-800">{inProgressOrders}</p>
            </div>
            <Truck size={16} className="text-blue-600 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-600">Total Revenue</p>
              <p className="text-lg font-bold text-purple-800">
                ₱{getTotalRevenue().toLocaleString()}
              </p>
            </div>
            <Package size={16} className="text-purple-600 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500">No orders found</p>
            <p className="text-sm text-gray-500">
              {error ? 'Check backend connection' : 'Orders will appear here when placed'}
            </p>
            {error && (
              <button 
                onClick={fetchOrders}
                className="mt-3 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Retry Connection
              </button>
            )}
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id || order.id} className="border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      Order #{order.orderNumber || order._id?.substring(0, 8) || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.customer?.name || order.user?.name || 'Customer'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleOrderExpand(order._id || order.id)}
                  className="p-1 hover:bg-orange-100 rounded transition-colors"
                >
                  {expandedOrder === (order._id || order.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-lg font-bold text-orange-600">
                    ₱{(order.totalAmount || order.total || order.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
              </div>

              {/* Restaurant & Customer Info */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Restaurant</p>
                  <p className="text-sm text-gray-900 truncate">{order.restaurant?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="text-sm text-gray-900 truncate">{order.customer?.name || order.user?.name || 'N/A'}</p>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === (order._id || order.id) && (
                <div className="border-t border-orange-200 pt-3 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {order.customer?.name || order.user?.name || 'Customer'}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-500 break-words">
                        {order.deliveryAddress || order.address || 'No address provided'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Items ({order.items?.length || 0})</p>
                      <p className="text-sm text-gray-700">
                        {order.items?.map(item => item.name || item.product?.name).join(', ') || 'No items listed'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleUpdateOrderStatus(order._id || order.id, 'confirmed')}
                        className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Confirm
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button 
                        onClick={() => handleUpdateOrderStatus(order._id || order.id, 'preparing')}
                        className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Start Preparing
                      </button>
                    )}
                    {['preparing', 'ready', 'out_for_delivery'].includes(order.status) && (
                      <button 
                        onClick={() => handleUpdateOrderStatus(order._id || order.id, 'delivered')}
                        className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {!['delivered', 'completed', 'cancelled'].includes(order.status) && (
                      <button 
                        onClick={() => handleUpdateOrderStatus(order._id || order.id, 'cancelled')}
                        className="bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Action Buttons - Collapsed State */}
              {expandedOrder !== (order._id || order.id) && (
                <div className="flex space-x-2 border-t border-orange-200 pt-3">
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => handleUpdateOrderStatus(order._id || order.id, 'confirmed')}
                      className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      Confirm
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button 
                      onClick={() => handleUpdateOrderStatus(order._id || order.id, 'preparing')}
                      className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      Prepare
                    </button>
                  )}
                  {['preparing', 'ready', 'out_for_delivery'].includes(order.status) && (
                    <button 
                      onClick={() => handleUpdateOrderStatus(order._id || order.id, 'delivered')}
                      className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      Deliver
                    </button>
                  )}
                  {!['delivered', 'completed', 'cancelled'].includes(order.status) && (
                    <button 
                      onClick={() => handleUpdateOrderStatus(order._id || order.id, 'cancelled')}
                      className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersTab;