// OrdersTab.jsx - Fixed and unique version
import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, CheckCircle, XCircle, Truck, Clock, MapPin, User } from 'lucide-react';

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Fetch orders data
  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_URL}/orders`);
      const data = await response.json();
      
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
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchOrders(); // Refresh data
        alert(`Order status updated to ${newStatus}!`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleRefresh = () => {
    fetchOrders();
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
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.color}`}>
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
      <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📦 Order Management</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Total Orders</p>
              <p className="text-2xl font-bold text-orange-800">{orders.length}</p>
            </div>
            <Package size={24} className="text-orange-600" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-800">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
            <CheckCircle size={24} className="text-green-600" />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-800">
                {orders.filter(o => ['preparing', 'ready', 'out_for_delivery'].includes(o.status)).length}
              </p>
            </div>
            <Truck size={24} className="text-blue-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-800">
                ₱{getTotalRevenue().toLocaleString()}
              </p>
            </div>
            <Package size={24} className="text-purple-600" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto border border-orange-100 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b border-orange-200 bg-orange-50">
              <th className="text-left py-4 px-4 font-semibold text-orange-900">Order Info</th>
              <th className="text-left py-4 px-4 font-semibold text-orange-900">Customer</th>
              <th className="text-left py-4 px-4 font-semibold text-orange-900">Restaurant</th>
              <th className="text-left py-4 px-4 font-semibold text-orange-900">Amount</th>
              <th className="text-left py-4 px-4 font-semibold text-orange-900">Status</th>
              <th className="text-left py-4 px-4 font-semibold text-orange-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  <Package size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No orders found in database</p>
                  <p className="text-sm">Orders will appear here when customers place orders</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id || order.id} className="border-b border-orange-100 hover:bg-orange-50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-gray-900">Order #{order.orderNumber || order._id?.substring(0, 8)}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock size={12} className="text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={14} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.customer?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order.customer?.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium text-gray-900">{order.restaurant?.name || 'N/A'}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <MapPin size={10} className="text-gray-400" />
                      <p className="text-xs text-gray-500">{order.deliveryAddress || 'No address'}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-lg font-bold text-orange-600">₱{(order.totalAmount || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{order.items?.length || 0} items</p>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(order._id || order.id, 'confirmed')}
                          className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Confirm Order"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(order._id || order.id, 'preparing')}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Start Preparing"
                        >
                          <Truck size={18} />
                        </button>
                      )}
                      {['preparing', 'ready', 'out_for_delivery'].includes(order.status) && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(order._id || order.id, 'delivered')}
                          className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as Delivered"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {!['delivered', 'cancelled'].includes(order.status) && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(order._id || order.id, 'cancelled')}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel Order"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTab;