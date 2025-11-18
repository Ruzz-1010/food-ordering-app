// RestaurantsTab.jsx - Fixed and improved version
import React, { useState, useEffect } from 'react';
import { Store, RefreshCw, CheckCircle, XCircle, Edit, Trash2, Utensils, MapPin, Clock } from 'lucide-react';

const RestaurantsTab = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  const fetchRestaurants = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_URL}/restaurants`);
      const data = await response.json();
      
      console.log('🏪 Restaurants data:', data);
      
      if (data.success && Array.isArray(data.restaurants)) {
        setRestaurants(data.restaurants);
      } else if (Array.isArray(data)) {
        setRestaurants(data);
      } else {
        setRestaurants([]);
      }
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
      const response = await fetch(`${API_URL}/restaurants/${restaurantId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchRestaurants();
        alert('Restaurant approved successfully!');
      }
    } catch (error) {
      console.error('Error approving restaurant:', error);
    }
  };

  const handleToggleActive = async (restaurantId, currentStatus) => {
    try {
      const response = await fetch(`${API_URL}/restaurants/${restaurantId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      if (response.ok) {
        fetchRestaurants();
        alert(`Restaurant ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      console.error('Error toggling restaurant status:', error);
    }
  };

  const handleRefresh = () => {
    fetchRestaurants();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Restaurant Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900"> Restaurant Management</h2>
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
              <p className="text-sm font-medium text-orange-600">Total Restaurants</p>
              <p className="text-2xl font-bold text-orange-800">{restaurants.length}</p>
            </div>
            <Store size={24} className="text-orange-600" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Approved</p>
              <p className="text-2xl font-bold text-green-800">
                {restaurants.filter(r => r.isApproved).length}
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
                {restaurants.filter(r => !r.isApproved).length}
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
                {restaurants.filter(r => r.isActive).length}
              </p>
            </div>
            <Store size={24} className="text-purple-600" />
          </div>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="overflow-x-auto border border-orange-100 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b border-orange-200 bg-orange-50">
              <th className="text-left py-4 px-4 font-semibold text-orange-900">Restaurant Info</th>
              <th className="text-left py-4 px-4 font-semibold text-orange-900">Owner & Contact</th>
              <th className="text-left py-4 px-4 font-semibold text-orange-900">Cuisine Type</th>
              <th className="text-left py-4 px-4 font-semibold text-orange-900">Status</th>
              <th className="text-left py-4 px-4 font-semibold text-orange-900">Approval</th>
              <th className="text-left py-4 px-4 font-semibold text-orange-900">Actions</th>
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
                <tr key={restaurant._id || restaurant.id} className="border-b border-orange-100 hover:bg-orange-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Utensils size={16} className="text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{restaurant.name}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <MapPin size={12} className="text-gray-400" />
                          <p className="text-xs text-gray-500">{restaurant.address || 'No address'}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium text-gray-900">{restaurant.owner?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{restaurant.email}</p>
                    <p className="text-xs text-gray-500">{restaurant.phone}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-orange-100 px-3 py-1 rounded-full text-xs font-medium text-orange-800">
                      {restaurant.cuisine || 'Various'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      restaurant.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {restaurant.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      restaurant.isApproved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {restaurant.isApproved ? '✅ Approved' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      {!restaurant.isApproved && (
                        <button 
                          onClick={() => handleApproveRestaurant(restaurant._id || restaurant.id)}
                          className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve Restaurant"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleToggleActive(restaurant._id || restaurant.id, restaurant.isActive)}
                        className={`p-2 hover:bg-gray-50 rounded-lg transition-colors ${
                          restaurant.isActive 
                            ? 'text-red-600 hover:text-red-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title={restaurant.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {restaurant.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>
                      <button className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={18} />
                      </button>
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

export default RestaurantsTab;