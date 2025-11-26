// RestaurantTab.jsx - UPDATED FOR YOUR BACKEND
import React, { useState, useEffect } from 'react';
import { 
  Utensils, Plus, Search, Filter, MapPin, Phone, 
  Clock, Edit, Trash2, CheckCircle, XCircle, 
  Star, Image, Upload, X, AlertCircle, RefreshCw,
  Mail, User
} from 'lucide-react';

const RestaurantTab = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, restaurant: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [imagePreview, setImagePreview] = useState(null);

  // New restaurant form state - UPDATED TO MATCH YOUR SCHEMA
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    cuisine: '',
    deliveryTime: '20-30 min',
    deliveryFee: 35,
    openingHours: {
      open: '08:00',
      close: '22:00'
    },
    image: '',
    bannerImage: '',
    owner: '' // You'll need to get this from your auth context
  });

  const API_URL = 'http://localhost:5000/api';

  const fetchRestaurants = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_URL}/restaurants`);
      const data = await response.json();
      
      if (data.success) {
        setRestaurants(data.restaurants);
      } else {
        setRestaurants([]);
        console.error('Failed to fetch restaurants:', data.message);
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('openingHours.')) {
      const field = name.split('.')[1];
      setNewRestaurant(prev => ({
        ...prev,
        openingHours: {
          ...prev.openingHours,
          [field]: value
        }
      }));
    } else {
      setNewRestaurant(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle image URL change
  const handleImageUrlChange = (e) => {
    const { value } = e.target;
    setNewRestaurant(prev => ({ ...prev, image: value }));
    setImagePreview(value);
  };

  // Add new restaurant
  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newRestaurant.name.trim() || !newRestaurant.address.trim() || 
        !newRestaurant.phone.trim() || !newRestaurant.email.trim() ||
        !newRestaurant.cuisine.trim()) {
      alert('Please fill in all required fields (Name, Address, Phone, Email, Cuisine)');
      return;
    }

    try {
      // For demo - you'll need to get the owner ID from your auth context
      // This is a temporary solution - in real app, get from logged in user
      const restaurantData = {
        ...newRestaurant,
        owner: '65d8f1a9e4b0a1b2c3d4e5f6' // TEMPORARY - replace with actual owner ID
      };

      const response = await fetch(`${API_URL}/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restaurantData),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the restaurants list
        await fetchRestaurants();
        
        // Reset form and close modal
        resetForm();
        setShowAddModal(false);
        
        alert('✅ Restaurant added successfully!');
      } else {
        alert(result.message || '❌ Failed to add restaurant');
      }
      
    } catch (error) {
      console.error('Error adding restaurant:', error);
      alert('❌ Failed to add restaurant');
    }
  };

  // Reset form
  const resetForm = () => {
    setNewRestaurant({
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      cuisine: '',
      deliveryTime: '20-30 min',
      deliveryFee: 35,
      openingHours: {
        open: '08:00',
        close: '22:00'
      },
      image: '',
      bannerImage: '',
      owner: ''
    });
    setImagePreview(null);
  };

  // Delete restaurant
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
      const response = await fetch(`${API_URL}/restaurants/${restaurantId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setRestaurants(prev => prev.filter(r => r._id !== restaurantId));
        alert('✅ Restaurant deleted successfully!');
      } else {
        alert(result.message || '❌ Failed to delete restaurant');
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      alert('❌ Failed to delete restaurant');
    } finally {
      hideDeleteConfirm();
    }
  };

  // Toggle restaurant active status
  const handleToggleStatus = async (restaurantId, currentStatus, restaurantName) => {
    try {
      const response = await fetch(`${API_URL}/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const result = await response.json();

      if (result.success) {
        setRestaurants(prev => prev.map(r => 
          r._id === restaurantId ? { ...r, isActive: !currentStatus } : r
        ));
        alert(`✅ Restaurant "${restaurantName}" ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        alert(result.message || '❌ Failed to update restaurant status');
      }
    } catch (error) {
      console.error('Error toggling restaurant status:', error);
      alert('❌ Failed to update restaurant status');
    }
  };

  // Toggle restaurant approval status
  const handleToggleApproval = async (restaurantId, currentStatus, restaurantName) => {
    try {
      if (!currentStatus) {
        // Approve restaurant
        const response = await fetch(`${API_URL}/restaurants/${restaurantId}/approve`, {
          method: 'PUT',
        });

        const result = await response.json();

        if (result.success) {
          setRestaurants(prev => prev.map(r => 
            r._id === restaurantId ? { ...r, isApproved: true } : r
          ));
          alert(`✅ Restaurant "${restaurantName}" approved successfully!`);
        } else {
          alert(result.message || '❌ Failed to approve restaurant');
        }
      } else {
        // For disapproval, we'll just update locally since your API only has approve
        setRestaurants(prev => prev.map(r => 
          r._id === restaurantId ? { ...r, isApproved: false } : r
        ));
        alert(`✅ Restaurant "${restaurantName}" disapproved!`);
      }
    } catch (error) {
      console.error('Error toggling approval:', error);
      alert('❌ Failed to update approval status');
    }
  };

  // Filter restaurants
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = 
      restaurant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cuisine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && restaurant.isActive) ||
      (statusFilter === 'inactive' && !restaurant.isActive) ||
      (statusFilter === 'approved' && restaurant.isApproved) ||
      (statusFilter === 'pending' && !restaurant.isApproved);

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: restaurants.length,
    active: restaurants.filter(r => r.isActive).length,
    inactive: restaurants.filter(r => !r.isActive).length,
    approved: restaurants.filter(r => r.isApproved).length,
    pending: restaurants.filter(r => !r.isApproved).length
  };

  const cuisineTypes = [
    'Italian', 'Chinese', 'Indian', 'Mexican', 'American',
    'Japanese', 'Thai', 'Mediterranean', 'French', 'Filipino', 'Other'
  ];

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
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]">Restaurant Management</h2>
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={fetchRestaurants}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all disabled:opacity-50 flex-1 sm:flex-none justify-center"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#8C1007] to-[#660B05] text-white px-4 py-2 rounded-lg hover:shadow-md transition-all flex-1 sm:flex-none justify-center"
          >
            <Plus size={16} />
            <span>Add Restaurant</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants by name, address, cuisine..."
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Total Restaurants</p>
              <p className="text-lg sm:text-xl font-bold">{stats.total}</p>
            </div>
            <Utensils size={16} className="opacity-90 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Active</p>
              <p className="text-lg sm:text-xl font-bold">{stats.active}</p>
            </div>
            <CheckCircle size={16} className="opacity-90 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Inactive</p>
              <p className="text-lg sm:text-xl font-bold">{stats.inactive}</p>
            </div>
            <XCircle size={16} className="opacity-90 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Approved</p>
              <p className="text-lg sm:text-xl font-bold">{stats.approved}</p>
            </div>
            <Star size={16} className="opacity-90 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Pending</p>
              <p className="text-lg sm:text-xl font-bold">{stats.pending}</p>
            </div>
            <Clock size={16} className="opacity-90 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Restaurants List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRestaurants.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Utensils size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-[#660B05]">No restaurants found</p>
            <p className="text-sm text-[#8C1007]">Try adjusting your search or add a new restaurant</p>
          </div>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <div key={restaurant._id} className="border border-[#FFF0C4] rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              {/* Restaurant Image */}
              <div className="h-32 bg-gradient-to-r from-[#8C1007] to-[#660B05] relative">
                {restaurant.image ? (
                  <img 
                    src={restaurant.image} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Utensils size={32} className="text-white opacity-50" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex space-x-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    restaurant.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {restaurant.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    restaurant.isApproved 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {restaurant.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Restaurant Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[#3E0703] text-lg truncate">{restaurant.name}</h3>
                  {restaurant.rating > 0 && (
                    <div className="flex items-center space-x-1 bg-[#FFF0C4] px-2 py-1 rounded-full">
                      <Star size={12} className="text-yellow-500 fill-current" />
                      <span className="text-xs font-bold text-[#660B05]">{restaurant.rating}</span>
                    </div>
                  )}
                </div>

                <p className="text-[#660B05] text-sm mb-3">{restaurant.cuisine}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} className="text-[#8C1007]" />
                    <span className="text-sm text-[#660B05] truncate">{restaurant.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone size={14} className="text-[#8C1007]" />
                    <span className="text-sm text-[#660B05]">{restaurant.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail size={14} className="text-[#8C1007]" />
                    <span className="text-sm text-[#660B05] truncate">{restaurant.email}</span>
                  </div>
                  {restaurant.owner && (
                    <div className="flex items-center space-x-2">
                      <User size={14} className="text-[#8C1007]" />
                      <span className="text-sm text-[#660B05] truncate">
                        {restaurant.owner.name || 'Owner'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Delivery Info */}
                <div className="flex justify-between items-center mb-4 text-xs text-[#660B05]">
                  <span>Delivery: ₱{restaurant.deliveryFee}</span>
                  <span>{restaurant.deliveryTime}</span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleToggleStatus(restaurant._id, restaurant.isActive, restaurant.name)}
                    className={`${
                      restaurant.isActive 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white px-3 py-2 rounded text-sm font-medium transition-colors`}
                  >
                    {restaurant.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => handleToggleApproval(restaurant._id, restaurant.isApproved, restaurant.name)}
                    className={`${
                      restaurant.isApproved 
                        ? 'bg-yellow-600 hover:bg-yellow-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white px-3 py-2 rounded text-sm font-medium transition-colors`}
                  >
                    {restaurant.isApproved ? 'Disapprove' : 'Approve'}
                  </button>
                  <button className="bg-[#8C1007] text-white px-3 py-2 rounded text-sm font-medium hover:bg-[#660B05] transition-colors">
                    Edit
                  </button>
                  <button 
                    onClick={() => showDeleteConfirm(restaurant._id, restaurant.name)}
                    className="bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-[#3E0703]">Add New Restaurant</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddRestaurant} className="p-6 space-y-4">
              {/* Restaurant Image Preview */}
              {imagePreview && (
                <div className="text-center">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="h-32 object-cover rounded-lg mx-auto mb-2"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-red-600 text-sm hover:text-red-800"
                  >
                    Remove Image
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Restaurant Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#660B05] mb-1">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newRestaurant.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>

                {/* Cuisine Type */}
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">
                    Cuisine Type *
                  </label>
                  <select
                    name="cuisine"
                    value={newRestaurant.cuisine}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
                    required
                  >
                    <option value="">Select Cuisine</option>
                    {cuisineTypes.map(cuisine => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newRestaurant.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
                    placeholder="restaurant@email.com"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newRestaurant.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
                    placeholder="+63 XXX XXX XXXX"
                    required
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#660B05] mb-1">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={newRestaurant.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
                    placeholder="Enter full address"
                    required
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#660B05] mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newRestaurant.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
                    placeholder="Describe your restaurant..."
                  />
                </div>

                {/* Delivery Fee */}
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">
                    Delivery Fee (₱)
                  </label>
                  <input
                    type="number"
                    name="deliveryFee"
                    value={newRestaurant.deliveryFee}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
                    min="0"
                    step="1"
                  />
                </div>

                {/* Delivery Time */}
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">
                    Delivery Time
                  </label>
                  <input
                    type="text"
                    name="deliveryTime"
                    value={newRestaurant.deliveryTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
                    placeholder="e.g., 20-30 min"
                  />
                </div>

                {/* Opening Hours */}
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    name="openingHours.open"
                    value={newRestaurant.openingHours.open}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    name="openingHours.close"
                    value={newRestaurant.openingHours.close}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
                  />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#660B05] mb-1">
                    Restaurant Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={newRestaurant.image}
                    onChange={handleImageUrlChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
                    placeholder="https://example.com/restaurant-image.jpg"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-[#660B05] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#8C1007] to-[#660B05] text-white rounded-lg hover:shadow-md transition-all"
                >
                  Add Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#3E0703] mb-2">Delete Restaurant</h3>
              <p className="text-[#660B05] mb-6">
                Are you sure you want to delete restaurant <strong>"{deleteConfirm.restaurant?.name}"</strong>? 
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
                  Delete Restaurant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantTab;