import React, { useState, useEffect } from 'react';
import { Store, RefreshCw, CheckCircle, XCircle, Edit, Trash2, Utensils, MapPin, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { apiService } from '../../services/api';

const RestaurantsTab = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, restaurant: null });
  const [expandedRestaurant, setExpandedRestaurant] = useState(null);

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Restaurant Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900"> Restaurant Management</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">Total Restaurants</p>
              <p className="text-lg sm:text-xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <Store size={16} className="text-blue-600 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-green-600 truncate">Approved</p>
              <p className="text-lg sm:text-xl font-bold text-green-800">
                {stats.approved}
              </p>
            </div>
            <CheckCircle size={16} className="text-green-600 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-yellow-600 truncate">Pending</p>
              <p className="text-lg sm:text-xl font-bold text-yellow-800">
                {stats.pending}
              </p>
            </div>
            <XCircle size={16} className="text-yellow-600 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-purple-600 truncate">Active</p>
              <p className="text-lg sm:text-xl font-bold text-purple-800">
                {stats.active}
              </p>
            </div>
            <Store size={16} className="text-purple-600 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Restaurants List - Mobile Responsive */}
      <div className="space-y-4">
        {restaurants.length === 0 ? (
          <div className="text-center py-8">
            <Store size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500">No restaurants found in database</p>
            <p className="text-sm text-gray-500">Restaurants will appear here when users register as restaurant owners</p>
          </div>
        ) : (
          restaurants.map((restaurant) => (
            <div key={restaurant._id || restaurant.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Mobile Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Store size={16} className="text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{restaurant.name}</p>
                    <p className="text-xs text-gray-500 truncate">{restaurant.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleRestaurantExpand(restaurant._id || restaurant.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {expandedRestaurant === (restaurant._id || restaurant.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Basic Info - Always Visible */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Status</p>
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
                  <p className="text-xs text-gray-500">Approval</p>
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
                  <p className="text-xs text-gray-500">Cuisine</p>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                    {restaurant.cuisine || 'Various'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Owner</p>
                  <p className="text-sm text-gray-900">{restaurant.owner?.name || 'N/A'}</p>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRestaurant === (restaurant._id || restaurant.id) && (
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{restaurant.phone || 'N/A'}</span>
                    </div>
                    {restaurant.address && (
                      <div className="flex items-start space-x-2">
                        <MapPin size={14} className="text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-500 break-words">{restaurant.address}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Description</p>
                      <p className="text-sm text-gray-700">{restaurant.description || 'No description'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
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
                    <button className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                      Edit
                    </button>
                    <button 
                      onClick={() => showDeleteConfirm(restaurant._id || restaurant.id, restaurant.name)}
                      className="bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons - Collapsed State */}
              {expandedRestaurant !== (restaurant._id || restaurant.id) && (
                <div className="flex space-x-2 border-t pt-3">
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Restaurant</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>"{deleteConfirm.restaurant?.name}"</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={hideDeleteConfirm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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