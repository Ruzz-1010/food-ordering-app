// RestaurantsTab.jsx - MODERN REDESIGN
import React, { useState, useEffect } from 'react';
import { Store, RefreshCw, CheckCircle, XCircle, Edit, Trash2, Utensils, MapPin, Phone, Mail, ChevronDown, ChevronUp, Save, X, Search, Filter } from 'lucide-react';
import { apiService } from '../../services/api';

const RestaurantsTab = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, restaurant: null });
  const [expandedRestaurant, setExpandedRestaurant] = useState(null);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRestaurants = async () => {
    try {
      setRefreshing(true);
      const data = await apiService.getRestaurants();
      
      // Handle different response formats
      let restaurantsArray = [];
      
      if (data.success && Array.isArray(data.restaurants)) {
        restaurantsArray = data.restaurants;
      } else if (Array.isArray(data)) {
        restaurantsArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        restaurantsArray = data.data;
      } else {
        restaurantsArray = [];
      }
      
      setRestaurants(restaurantsArray);
      
    } catch (error) {
      console.error('❌ Error fetching restaurants:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Filter restaurants
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = 
      restaurant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cuisine?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && restaurant.isActive) ||
      (statusFilter === 'inactive' && !restaurant.isActive) ||
      (statusFilter === 'approved' && restaurant.isApproved) ||
      (statusFilter === 'pending' && !restaurant.isApproved);

    return matchesSearch && matchesStatus;
  });

  const handleApproveRestaurant = async (restaurantId, restaurantName) => {
    try {
      await apiService.approveRestaurant(restaurantId);
      await fetchRestaurants();
      alert(`✅ Restaurant "${restaurantName}" approved successfully!`);
    } catch (error) {
      console.error('Error approving restaurant:', error);
      alert('❌ Failed to approve restaurant');
    }
  };

  const handleToggleActive = async (restaurantId, currentStatus, restaurantName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiService.baseURL}/restaurants/${restaurantId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      if (response.ok) {
        await fetchRestaurants();
        alert(`✅ Restaurant "${restaurantName}" ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        throw new Error('Failed to update restaurant status');
      }
    } catch (error) {
      console.error('Error toggling restaurant status:', error);
      alert('❌ Failed to update restaurant status');
    }
  };

  // Edit restaurant function
  const handleEditRestaurant = (restaurant) => {
    setEditingRestaurant(restaurant._id || restaurant.id);
    setEditForm({
      name: restaurant.name || '',
      email: restaurant.email || '',
      phone: restaurant.phone || '',
      cuisine: restaurant.cuisine || '',
      address: restaurant.address || '',
      description: restaurant.description || ''
    });
  };

  // Save edited restaurant
  const handleSaveEdit = async (restaurantId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiService.baseURL}/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await fetchRestaurants();
        setEditingRestaurant(null);
        alert('✅ Restaurant updated successfully!');
      } else {
        throw new Error('Failed to update restaurant');
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      alert('❌ Failed to update restaurant');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingRestaurant(null);
    setEditForm({});
  };

  const showDeleteConfirm = (restaurantId, restaurantName) => {
    setDeleteConfirm({
      show: true,
      restaurant: { id: restaurantId, name: restaurantName }
    });
  };

  const hideDeleteConfirm = () => {
    setDeleteConfirm({ show: false, restaurant: null });
  };

  const handleDeleteRestaurant = async () => {
    if (!deleteConfirm.restaurant) return;

    const { id: restaurantId, name: restaurantName } = deleteConfirm.restaurant;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiService.baseURL}/restaurants/${restaurantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchRestaurants();
        alert('✅ Restaurant deleted successfully!');
      } else {
        throw new Error('Failed to delete restaurant');
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      alert('❌ Failed to delete restaurant');
    } finally {
      hideDeleteConfirm();
    }
  };

  const handleRefresh = () => {
    fetchRestaurants();
  };

  const toggleRestaurantExpand = (restaurantId) => {
    setExpandedRestaurant(expandedRestaurant === restaurantId ? null : restaurantId);
  };

  // Calculate statistics
  const stats = {
    total: restaurants.length,
    approved: restaurants.filter(r => r.isApproved).length,
    pending: restaurants.filter(r => !r.isApproved).length,
    active: restaurants.filter(r => r.isActive).length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]">Restaurant Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-[#FFF0C4] border-t-[#8C1007] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#660B05] mt-2">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]"> Restaurant Management</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-gradient-to-r from-[#8C1007] to-[#660B05] text-white px-4 py-2 rounded-lg hover:shadow-md transition-all disabled:opacity-50 w-full sm:w-auto justify-center"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants by name, cuisine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-90">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
            <Store size={20} className="opacity-90" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-90">Approved</p>
              <p className="text-lg font-bold">{stats.approved}</p>
            </div>
            <CheckCircle size={20} className="opacity-90" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-90">Pending</p>
              <p className="text-lg font-bold">{stats.pending}</p>
            </div>
            <XCircle size={20} className="opacity-90" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-[#8C1007] to-[#660B05] text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-90">Active</p>
              <p className="text-lg font-bold">{stats.active}</p>
            </div>
            <Store size={20} className="opacity-90" />
          </div>
        </div>
      </div>

      {/* Restaurants List - Mobile Responsive */}
      <div className="space-y-4">
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-8">
            <Store size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-[#660B05]">No restaurants found</p>
            <p className="text-sm text-[#8C1007]">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <div key={restaurant._id || restaurant.id} className="border border-[#FFF0C4] rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              {/* Mobile Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#8C1007] to-[#660B05] rounded-full flex items-center justify-center flex-shrink-0">
                    <Store size={16} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingRestaurant === (restaurant._id || restaurant.id) ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                        placeholder="Restaurant name"
                      />
                    ) : (
                      <>
                        <p className="font-medium text-[#3E0703] truncate">{restaurant.name}</p>
                        <p className="text-xs text-[#660B05] truncate">{restaurant.email}</p>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleRestaurantExpand(restaurant._id || restaurant.id)}
                  className="p-1 hover:bg-[#FFF0C4] rounded transition-colors"
                >
                  {expandedRestaurant === (restaurant._id || restaurant.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Basic Info - Always Visible */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-[#660B05]">Status</p>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      restaurant.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {restaurant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#660B05]">Approval</p>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      restaurant.isApproved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {restaurant.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cuisine and Owner Info */}
              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-xs text-[#660B05]">Cuisine</p>
                  {editingRestaurant === (restaurant._id || restaurant.id) ? (
                    <input
                      type="text"
                      value={editForm.cuisine}
                      onChange={(e) => setEditForm({...editForm, cuisine: e.target.value})}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                      placeholder="Cuisine type"
                    />
                  ) : (
                    <span className="bg-[#FFF0C4] px-2 py-1 rounded text-xs text-[#660B05]">
                      {restaurant.cuisine || 'Various'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#660B05]">Owner</p>
                  <p className="text-sm text-[#3E0703]">{restaurant.owner?.name || 'N/A'}</p>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRestaurant === (restaurant._id || restaurant.id) && (
                <div className="border-t border-[#FFF0C4] pt-3 space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2">
                      <Phone size={14} className="text-[#660B05]" />
                      {editingRestaurant === (restaurant._id || restaurant.id) ? (
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                          placeholder="Phone number"
                        />
                      ) : (
                        <span className="text-sm text-[#3E0703]">{restaurant.phone || 'N/A'}</span>
                      )}
                    </div>
                    {editingRestaurant === (restaurant._id || restaurant.id) ? (
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-[#660B05]">Address</p>
                          <textarea
                            value={editForm.address}
                            onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                            rows="2"
                            placeholder="Restaurant address"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-[#660B05]">Description</p>
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                            rows="2"
                            placeholder="Restaurant description"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {restaurant.address && (
                          <div className="flex items-start space-x-2">
                            <MapPin size={14} className="text-[#660B05] mt-0.5" />
                            <span className="text-sm text-[#660B05] break-words">{restaurant.address}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-[#660B05]">Description</p>
                          <p className="text-sm text-[#3E0703]">{restaurant.description || 'No description'}</p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {editingRestaurant === (restaurant._id || restaurant.id) ? (
                      <>
                        <button 
                          onClick={() => handleSaveEdit(restaurant._id || restaurant.id)}
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
                        {!restaurant.isApproved && (
                          <button 
                            onClick={() => handleApproveRestaurant(restaurant._id || restaurant.id, restaurant.name)}
                            className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        <button 
                          onClick={() => handleToggleActive(restaurant._id || restaurant.id, restaurant.isActive, restaurant.name)}
                          className={`${
                            restaurant.isActive 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white px-3 py-2 rounded text-sm font-medium transition-colors`}
                        >
                          {restaurant.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          onClick={() => handleEditRestaurant(restaurant)}
                          className="bg-[#8C1007] text-white px-3 py-2 rounded text-sm font-medium hover:bg-[#660B05] transition-colors flex items-center justify-center space-x-1"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => showDeleteConfirm(restaurant._id || restaurant.id, restaurant.name)}
                          className="bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons - Collapsed State */}
              {expandedRestaurant !== (restaurant._id || restaurant.id) && !editingRestaurant && (
                <div className="flex space-x-2 border-t border-[#FFF0C4] pt-3">
                  {!restaurant.isApproved && (
                    <button 
                      onClick={() => handleApproveRestaurant(restaurant._id || restaurant.id, restaurant.name)}
                      className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  <button 
                    onClick={() => handleToggleActive(restaurant._id || restaurant.id, restaurant.isActive, restaurant.name)}
                    className={`flex-1 ${
                      restaurant.isActive 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white px-2 py-1 rounded text-xs font-medium transition-colors`}
                  >
                    {restaurant.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => handleEditRestaurant(restaurant)}
                    className="flex-1 bg-[#8C1007] text-white px-2 py-1 rounded text-xs font-medium hover:bg-[#660B05] transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => showDeleteConfirm(restaurant._id || restaurant.id, restaurant.name)}
                    className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#3E0703] mb-2">Delete Restaurant</h3>
              <p className="text-[#660B05] mb-6">
                Are you sure you want to delete <strong>"{deleteConfirm.restaurant?.name}"</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={hideDeleteConfirm}
                  className="px-4 py-2 border border-gray-300 text-[#660B05] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRestaurant}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantsTab;