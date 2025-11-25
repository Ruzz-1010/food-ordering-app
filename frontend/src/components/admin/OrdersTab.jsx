// OrdersTab.jsx - MODERN REDESIGN
import React, { useState, useEffect } from 'react';
import { 
  Package, RefreshCw, CheckCircle, Truck, 
  Clock, MapPin, User, ChevronDown, ChevronUp, 
  AlertCircle, Edit, Trash2, Search, Filter,
  Save, X, Eye, DollarSign
} from 'lucide-react';

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, order: null });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

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

  // Enhanced order status update
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
        alert(`✅ Order status updated to ${newStatus}`);
      } else {
        throw new Error(data.error || 'Failed to update order status');
      }
    } catch (error) {
      alert(`❌ Failed to update order status: ${error.message}`);
    }
  };

  // Edit order function
  const handleEditOrder = (order) => {
    setEditingOrder(order._id || order.id);
    setEditForm({
      totalAmount: order.totalAmount || order.total || order.amount || 0,
      deliveryAddress: order.deliveryAddress || order.address || '',
      specialInstructions: order.specialInstructions || ''
    });
  };

  // Save edited order
  const handleSaveEdit = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${RAILWAY_BACKEND_URL}/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await fetchOrders();
        setEditingOrder(null);
        alert('✅ Order updated successfully!');
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('❌ Failed to update order');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingOrder(null);
    setEditForm({});
  };

  // Delete order with confirmation
  const showDeleteConfirm = (orderId, orderNumber) => {
    setDeleteConfirm({
      show: true,
      order: { id: orderId, number: orderNumber }
    });
  };

  const hideDeleteConfirm = () => {
    setDeleteConfirm({ show: false, order: null });
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirm.order) return;

    const { id: orderId, number: orderNumber } = deleteConfirm.order;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${RAILWAY_BACKEND_URL}/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchOrders();
        alert('✅ Order deleted successfully!');
      } else {
        throw new Error('Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('❌ Failed to delete order');
    } finally {
      hideDeleteConfirm();
    }
  };

  // View order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.restaurant?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order._id?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]">Order Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-[#FFF0C4] border-t-[#8C1007] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#660B05] mt-2">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]">📦 Order Management</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-gradient-to-r from-[#8C1007] to-[#660B05] text-white px-4 py-2 rounded-lg hover:shadow-md transition-all disabled:opacity-50 w-full sm:w-auto justify-center"
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

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by ID, customer, or restaurant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
          />
        </div>
        <div className="flex space-x-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="bg-[#FFF0C4] border border-[#8C1007] rounded-lg px-3 py-2 flex items-center">
            <Filter size={16} className="text-[#8C1007] mr-2" />
            <span className="text-sm font-medium text-[#660B05]">{filteredOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-r from-[#8C1007] to-[#660B05] text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-90">Total Orders</p>
              <p className="text-lg font-bold">{orders.length}</p>
            </div>
            <Package size={16} className="opacity-90" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-90">Completed</p>
              <p className="text-lg font-bold">{completedOrders}</p>
            </div>
            <CheckCircle size={16} className="opacity-90" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-90">In Progress</p>
              <p className="text-lg font-bold">{inProgressOrders}</p>
            </div>
            <Truck size={16} className="opacity-90" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-90">Total Revenue</p>
              <p className="text-lg font-bold">
                ₱{getTotalRevenue().toLocaleString()}
              </p>
            </div>
            <DollarSign size={16} className="opacity-90" />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-[#660B05]">
              {orders.length === 0 ? 'No orders found' : 'No orders match your search'}
            </p>
            <p className="text-sm text-[#8C1007]">
              {error ? 'Check backend connection' : 'Orders will appear here when placed'}
            </p>
            {error && (
              <button 
                onClick={fetchOrders}
                className="mt-3 bg-gradient-to-r from-[#8C1007] to-[#660B05] text-white px-4 py-2 rounded-lg hover:shadow-md transition-all"
              >
                Retry Connection
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order._id || order.id} className="border border-[#FFF0C4] rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#8C1007] to-[#660B05] rounded-full flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#3E0703] truncate">
                      Order #{order.orderNumber || order._id?.substring(0, 8) || 'N/A'}
                    </p>
                    <p className="text-xs text-[#660B05] truncate">
                      {order.customer?.name || order.user?.name || 'Customer'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleOrderExpand(order._id || order.id)}
                  className="p-1 hover:bg-[#FFF0C4] rounded transition-colors"
                >
                  {expandedOrder === (order._id || order.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-[#660B05]">Amount</p>
                  {editingOrder === (order._id || order.id) ? (
                    <input
                      type="number"
                      value={editForm.totalAmount}
                      onChange={(e) => setEditForm({...editForm, totalAmount: parseFloat(e.target.value)})}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-bold text-[#8C1007] focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                    />
                  ) : (
                    <p className="text-lg font-bold text-[#8C1007]">
                      ₱{(order.totalAmount || order.total || order.amount || 0).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#660B05]">Status</p>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
              </div>

              {/* Restaurant & Customer Info */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-[#660B05]">Restaurant</p>
                  <p className="text-sm text-[#3E0703] truncate">{order.restaurant?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#660B05]">Customer</p>
                  <p className="text-sm text-[#3E0703] truncate">{order.customer?.name || order.user?.name || 'N/A'}</p>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === (order._id || order.id) && (
                <div className="border-t border-[#FFF0C4] pt-3 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User size={14} className="text-[#660B05]" />
                      <span className="text-sm text-[#3E0703]">
                        {order.customer?.name || order.user?.name || 'Customer'}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin size={14} className="text-[#660B05] mt-0.5" />
                      {editingOrder === (order._id || order.id) ? (
                        <textarea
                          value={editForm.deliveryAddress}
                          onChange={(e) => setEditForm({...editForm, deliveryAddress: e.target.value})}
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                          rows="2"
                          placeholder="Delivery address"
                        />
                      ) : (
                        <span className="text-sm text-[#660B05] break-words">
                          {order.deliveryAddress || order.address || 'No address provided'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={14} className="text-[#660B05]" />
                      <span className="text-sm text-[#3E0703]">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-[#660B05]">Items ({order.items?.length || 0})</p>
                      <p className="text-sm text-[#3E0703]">
                        {order.items?.map(item => item.name || item.product?.name).join(', ') || 'No items listed'}
                      </p>
                    </div>
                    {editingOrder === (order._id || order.id) && (
                      <div>
                        <p className="text-xs text-[#660B05]">Special Instructions</p>
                        <textarea
                          value={editForm.specialInstructions}
                          onChange={(e) => setEditForm({...editForm, specialInstructions: e.target.value})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                          rows="2"
                          placeholder="Special instructions"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {editingOrder === (order._id || order.id) ? (
                      <>
                        <button 
                          onClick={() => handleSaveEdit(order._id || order.id)}
                          className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Save size={14} />
                          <span>Save</span>
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <X size={14} />
                          <span>Cancel</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleViewOrder(order)}
                          className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => handleEditOrder(order)}
                          className="bg-[#8C1007] text-white px-3 py-2 rounded text-sm font-medium hover:bg-[#660B05] transition-colors flex items-center justify-center space-x-1"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
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
                        <button 
                          onClick={() => showDeleteConfirm(order._id || order.id, order.orderNumber || order._id)}
                          className="bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Action Buttons - Collapsed State */}
              {expandedOrder !== (order._id || order.id) && !editingOrder && (
                <div className="flex space-x-2 border-t border-[#FFF0C4] pt-3">
                  <button 
                    onClick={() => handleViewOrder(order)}
                    className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Eye size={12} />
                    <span>View</span>
                  </button>
                  <button 
                    onClick={() => handleEditOrder(order)}
                    className="flex-1 bg-[#8C1007] text-white px-2 py-1 rounded text-xs font-medium hover:bg-[#660B05] transition-colors flex items-center justify-center space-x-1"
                  >
                    <Edit size={12} />
                    <span>Edit</span>
                  </button>
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
                  <button 
                    onClick={() => showDeleteConfirm(order._id || order.id, order.orderNumber || order._id)}
                    className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#3E0703]">
                Order Details - #{selectedOrder.orderNumber || selectedOrder._id?.substring(0, 8)}
              </h3>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-[#8C1007]"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[#3E0703] mb-2">Customer Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedOrder.customer?.name || selectedOrder.user?.name || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.customer?.email || selectedOrder.user?.email || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedOrder.customer?.phone || selectedOrder.user?.phone || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-[#3E0703] mb-2">Restaurant Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedOrder.restaurant?.name || 'N/A'}</p>
                    <p><span className="font-medium">Address:</span> {selectedOrder.restaurant?.address || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedOrder.restaurant?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[#3E0703] mb-2">Order Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Status:</span> {getStatusBadge(selectedOrder.status)}</p>
                    <p><span className="font-medium">Total Amount:</span> ₱{(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()}</p>
                    <p><span className="font-medium">Order Date:</span> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}</p>
                    <p><span className="font-medium">Delivery Address:</span> {selectedOrder.deliveryAddress || selectedOrder.address || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-[#3E0703] mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between border-b pb-2">
                        <span>{item.quantity}x {item.name || item.product?.name}</span>
                        <span>₱{((item.price || item.product?.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                      </div>
                    )) || <p>No items listed</p>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 text-[#660B05] hover:text-[#3E0703] font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#3E0703] mb-2">Delete Order</h3>
              <p className="text-[#660B05] mb-6">
                Are you sure you want to delete order <strong>"{deleteConfirm.order?.number}"</strong>? 
                This action cannot be undone and will permanently remove the order from the system.
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={hideDeleteConfirm}
                  className="px-4 py-2 border border-gray-300 text-[#660B05] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrder}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;