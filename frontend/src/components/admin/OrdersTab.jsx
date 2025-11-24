import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, CheckCircle, XCircle, Truck, Clock, MapPin, User, ChevronDown, ChevronUp } from 'lucide-react';
import { apiService } from '../../services/api';

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Fetch orders data
  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const data = await apiService.getOrders();
      
      console.log('📦 Orders data:', data);
      
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
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
      await apiService.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Refresh data
      alert(`Order status updated to ${newStatus}!`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
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
      .filter(order => order.status === 'delivered')
      .reduce((total, order) => total + (order.totalAmount || 0), 0);
  };

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📦 Order Management</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-orange-600 truncate">Total Orders</p>
              <p className="text-lg sm:text-xl font-bold text-orange-800">{orders.length}</p>
            </div>
            <Package size={16} className="text-orange-600 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-green-600 truncate">Completed</p>
              <p className="text-lg sm:text-xl font-bold text-green-800">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
            <CheckCircle size={16} className="text-green-600 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">In Progress</p>
              <p className="text-lg sm:text-xl font-bold text-blue-800">
                {orders.filter(o => ['preparing', 'ready', 'out_for_delivery'].includes(o.status)).length}
              </p>
            </div>
            <Truck size={16} className="text-blue-600 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-purple-600 truncate">Total Revenue</p>
              <p className="text-lg sm:text-xl font-bold text-purple-800">
                ₱{getTotalRevenue().toLocaleString()}
              </p>
            </div>
            <Package size={16} className="text-purple-600 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Orders List - Mobile Responsive */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500">No orders found in database</p>
            <p className="text-sm text-gray-500">Orders will appear here when customers place orders</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id || order.id} className="border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Mobile Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      Order #{order.orderNumber || order._id?.substring(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.customer?.name || 'Customer'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleOrderExpand(order._id || order.id)}
                  className="p-1 hover:bg-orange-100 rounded"
                >
                  {expandedOrder === (order._id || order.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Basic Info - Always Visible */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-lg font-bold text-orange-600">₱{(order.totalAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
              </div>

              {/* Restaurant Info */}
              <div className="mb-3">
                <p className="text-xs text-gray-500">Restaurant</p>
                <p className="text-sm text-gray-900">{order.restaurant?.name || 'N/A'}</p>
              </div>

              {/* Expanded Details */}
              {expandedOrder === (order._id || order.id) && (
                <div className="border-t border-orange-200 pt-3 space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2">
                      <User size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{order.customer?.name || 'Customer'}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-500 break-words">{order.deliveryAddress || 'No address'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Items ({order.items?.length || 0})</p>
                      <p className="text-sm text-gray-700">
                        {order.items?.map(item => item.name).join(', ') || 'No items'}
                      </p>
                    </div>
                  </div>
                  
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
                    {!['delivered', 'cancelled'].includes(order.status) && (
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

              {/* Action Buttons - Collapsed State */}
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
                  {!['delivered', 'cancelled'].includes(order.status) && (
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