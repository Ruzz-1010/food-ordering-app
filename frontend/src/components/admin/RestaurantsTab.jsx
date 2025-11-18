// RestaurantsTab.jsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { Store, RefreshCw, CheckCircle, XCircle, Edit, Trash2, Utensils, MapPin, Phone, Mail, AlertCircle, User } from 'lucide-react';

const RestaurantsTab = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  const fetchRestaurants = async () => {
    try {
      setRefreshing(true);
      setError('');
      const token = localStorage.getItem('token');
      
      console.log('🔄 FETCHING RESTAURANTS FROM DATABASE...');
      
      const response = await fetch(`${API_URL}/restaurants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🏪 DATABASE RESPONSE:', data);
      
      // Handle different response formats
      let restaurantsArray = [];
      
      if (data.success && Array.isArray(data.restaurants)) {
        restaurantsArray = data.restaurants;
      } else if (Array.isArray(data)) {
        restaurantsArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        restaurantsArray = data.data;
      } else {
        console.warn('Unexpected response format:', data);
        restaurantsArray = [];
      }
      
      console.log(`📊 FOUND ${restaurantsArray.length} RESTAURANTS IN DATABASE:`);
      restaurantsArray.forEach((rest, index) => {
        console.log(`   ${index + 1}. ${rest.name} - Approved: ${rest.isApproved} - Active: ${rest.isActive}`);
      });
      
      setRestaurants(restaurantsArray);
      
    } catch (error) {
      console.error('❌ Error fetching restaurants:', error);
      setError(`Failed to load restaurants: ${error.message}`);
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
      console.log('✅ APPROVING RESTAURANT:', restaurantId);
      
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

  const handleDeleteRestaurant = async (restaurantId, restaurantName) => {
    if (!confirm(`Are you sure you want to delete "${restaurantName}"? This action cannot be undone.`)) {
      return;
    }

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
    active: restaurants.filter(r => r.isActive).length,
    inactive: restaurants.filter(r => !r.isActive).length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🏪 Restaurant Management</h2>
        </div>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 text-lg">Loading restaurants from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900"> Restaurant Management</h2>
          <p className="text-gray-600 mt-1">Manage restaurant registrations and approvals</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-md"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Database Status */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-800">Database Status</p>
            <p className="text-sm text-blue-700">
              Connected to: {API_URL}/restaurants
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-blue-800">
              {restaurants.length} restaurants in database
            </p>
            <p className="text-xs text-blue-600">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle size={20} className="text-red-600" />
          <div>
            <p className="text-red-800 font-medium">Database Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <Store size={24} className="opacity-90" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Approved</p>
              <p className="text-2xl font-bold mt-1">{stats.approved}</p>
            </div>
            <CheckCircle size={24} className="opacity-90" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Pending</p>
              <p className="text-2xl font-bold mt-1">{stats.pending}</p>
            </div>
            <XCircle size={24} className="opacity-90" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Active</p>
              <p className="text-2xl font-bold mt-1">{stats.active}</p>
            </div>
            <Store size={24} className="opacity-90" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Inactive</p>
              <p className="text-2xl font-bold mt-1">{stats.inactive}</p>
            </div>
            <XCircle size={24} className="opacity-90" />
          </div>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="overflow-x-auto rounded-xl border border-orange-200 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
              <th className="text-left py-4 px-4 font-bold text-orange-900">RESTAURANT INFO</th>
              <th className="text-left py-4 px-4 font-bold text-orange-900">OWNER & CONTACT</th>
              <th className="text-left py-4 px-4 font-bold text-orange-900">CUISINE</th>
              <th className="text-left py-4 px-4 font-bold text-orange-900">STATUS</th>
              <th className="text-left py-4 px-4 font-bold text-orange-900">APPROVAL</th>
              <th className="text-left py-4 px-4 font-bold text-orange-900">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500">
                  <Store size={64} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-xl font-semibold">No restaurants in database</p>
                  <p className="text-gray-600 mt-2">Restaurants will appear here when owners register</p>
                </td>
              </tr>
            ) : (
              restaurants.map((restaurant, index) => (
                <tr 
                  key={restaurant._id || restaurant.id} 
                  className={`border-b border-orange-100 transition-all hover:bg-orange-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-orange-25'
                  }`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Utensils size={20} className="text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-lg truncate">{restaurant.name}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                          <p className="text-sm text-gray-600 truncate">{restaurant.address || 'No address provided'}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{restaurant.owner?.name || 'Owner not specified'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{restaurant.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{restaurant.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
                      {restaurant.cuisineType || restaurant.cuisine || 'Various'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                      restaurant.isActive 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {restaurant.isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                      restaurant.isApproved 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}>
                      {restaurant.isApproved ? '✅ APPROVED' : '⏳ PENDING'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col space-y-2">
                      {!restaurant.isApproved && (
                        <button 
                          onClick={() => handleApproveRestaurant(restaurant._id || restaurant.id)}
                          className="flex items-center justify-center space-x-1 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium shadow-sm"
                          title="Approve Restaurant"
                        >
                          <CheckCircle size={16} />
                          <span>Approve</span>
                        </button>
                      )}
                      <button 
                        onClick={() => handleToggleActive(restaurant._id || restaurant.id, restaurant.isActive)}
                        className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm ${
                          restaurant.isActive 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                        title={restaurant.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {restaurant.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        <span>{restaurant.isActive ? 'Deactivate' : 'Activate'}</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteRestaurant(restaurant._id || restaurant.id, restaurant.name)}
                        className="flex items-center justify-center space-x-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow-sm"
                        title="Delete Restaurant"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <p className="text-sm text-gray-600">
          <strong>Debug Info:</strong> These restaurants are from actual user registrations. 
          When someone registers as a restaurant owner, a restaurant entry is automatically created in your database.
          You need to manually approve them before they can accept orders.
        </p>
      </div>
    </div>
  );
};

export default RestaurantsTab;