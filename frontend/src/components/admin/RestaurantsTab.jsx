// RestaurantsTab.jsx - CLEAN MODERN DESIGN
import React, { useState, useEffect } from 'react';
import { 
  Utensils, Search, Plus, MapPin, Phone, Star, 
  CheckCircle, XCircle, Clock, Edit, Trash2 
} from 'lucide-react';

const RestaurantsTab = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '', cuisine: '', address: '', phone: '', email: '',
    description: '', deliveryFee: 35, deliveryTime: '30-45 min'
  });

  const API_URL = 'https://food-ordering-app-83lm.onrender.com/api';

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${API_URL}/restaurants`);
      const data = await res.json();
      setRestaurants(data.restaurants || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.cuisine?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRestaurant)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewRestaurant({
          name: '', cuisine: '', address: '', phone: '', email: '',
          description: '', deliveryFee: 35, deliveryTime: '30-45 min'
        });
        fetchRestaurants();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await fetch(`${API_URL}/restaurants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchRestaurants();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteRestaurant = async (id) => {
    if (!window.confirm('Delete this restaurant?')) return;
    try {
      await fetch(`${API_URL}/restaurants/${id}`, { method: 'DELETE' });
      fetchRestaurants();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Restaurants</h2>
          <p className="text-gray-500 mt-1">Manage partner restaurants</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Add Restaurant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: restaurants.length },
          { label: 'Active', value: restaurants.filter(r => r.isActive).length, color: 'text-green-600' },
          { label: 'Pending', value: restaurants.filter(r => !r.isApproved).length, color: 'text-yellow-600' },
          { label: 'Avg Rating', value: '4.2', color: 'text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color || 'text-gray-900'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search restaurants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
        />
      </div>

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-400">Loading...</div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            <Utensils size={48} className="mx-auto mb-3 opacity-30" />
            <p>No restaurants found</p>
          </div>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <div key={restaurant._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
              {/* Image */}
              <div className="h-32 bg-gradient-to-br from-red-500 to-red-700 relative">
                {restaurant.image ? (
                  <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Utensils size={32} className="text-white/50" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    restaurant.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {restaurant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">{restaurant.name}</h3>
                  {restaurant.rating > 0 && (
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-yellow-700">{restaurant.rating}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-red-600 text-sm font-medium mb-3">{restaurant.cuisine}</p>
                
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="truncate">{restaurant.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span>{restaurant.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span>{restaurant.deliveryTime} • ₱{restaurant.deliveryFee}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStatus(restaurant._id, restaurant.isActive)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      restaurant.isActive 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {restaurant.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteRestaurant(restaurant._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Add New Restaurant</h3>
            </div>
            <form onSubmit={handleAddRestaurant} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                  <input
                    required
                    type="text"
                    value={newRestaurant.name}
                    onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
                  <select
                    value={newRestaurant.cuisine}
                    onChange={(e) => setNewRestaurant({...newRestaurant, cuisine: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  >
                    <option value="">Select...</option>
                    {['Italian', 'Chinese', 'Japanese', 'American', 'Filipino', 'Mexican', 'Indian'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newRestaurant.phone}
                    onChange={(e) => setNewRestaurant({...newRestaurant, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={newRestaurant.address}
                    onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Add Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantsTab;