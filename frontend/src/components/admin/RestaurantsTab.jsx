// RestaurantsTab.jsx - CLEAN VERSION
import React, { useState, useEffect } from 'react';
import { Store, RefreshCw, CheckCircle, XCircle, Edit, Trash2, Utensils, MapPin, Phone, Mail } from 'lucide-react';

const RestaurantsTab = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, restaurant: null });

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  const fetchRestaurants = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/restaurants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
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

  const handleApproveRestaurant = async (restaurantId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/restaurants/${restaurantId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchRestaurants();
        alert('✅ Restaurant approved successfully!');
      } else {
        throw new Error('Failed to approve restaurant');
      }
    } catch (error) {
      console.error('Error approving restaurant:', error);
      alert('❌ Failed to approve restaurant');
    }
  };

  const handleToggleActive = async (restaurantId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/restaurants/${restaurantId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      if (response.ok) {
        await fetchRestaurants();
        alert(`✅ Restaurant ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
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
      const response = await fetch(`${API_URL}/restaurants/${restaurantId}`, {
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

  // Calculate statistics
  const stats = {
    total: restaurants.length,
    approved: restaurants.filter(r => r.isApproved).length,
    pending: restaurants.filter(r => !r.isApproved).length,
    active: restaurants.filter(r => r.isActive).length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Restaurant Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Restaurant Management</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Restaurants</p>
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <Store size={24} className="text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Approved</p>
              <p className="text-2xl font-bold text-green-800">
                {stats.approved}
              </p>
            </div>
            <CheckCircle size={24} className="text-green-600" />
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">
                {stats.pending}
              </p>
            </div>
            <XCircle size={24} className="text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Active</p>
              <p className="text-2xl font-bold text-purple-800">
                {stats.active}
              </p>
            </div>
            <Store size={24} className="text-purple-600" />
          </div>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Restaurant</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Owner</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Cuisine</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Approval</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  <Store size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No restaurants found in database</p>
                  <p className="text-sm">Restaurants will appear here when users register as restaurant owners</p>
                </td>
              </tr>
            ) : (
              restaurants.map((restaurant) => (
                <tr key={restaurant._id || restaurant.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{restaurant.name}</p>
                      <p className="text-xs text-gray-500">{restaurant.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-900">{restaurant.owner?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{restaurant.phone}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                      {restaurant.cuisine || 'Various'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      restaurant.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {restaurant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      restaurant.isApproved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {restaurant.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      {!restaurant.isApproved && (
                        <button 
                          onClick={() => handleApproveRestaurant(restaurant._id || restaurant.id)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                          title="Approve Restaurant"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleToggleActive(restaurant._id || restaurant.id, restaurant.isActive)}
                        className={`text-sm font-medium ${
                          restaurant.isActive 
                            ? 'text-red-600 hover:text-red-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title={restaurant.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {restaurant.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => showDeleteConfirm(restaurant._id || restaurant.id, restaurant.name)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium" 
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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