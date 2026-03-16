// RiderTab.jsx - FIXED API CALLS
import React, { useState, useEffect } from 'react';
import { 
  Bike, RefreshCw, CheckCircle, XCircle, Edit, Trash2, 
  Phone, Mail, MapPin, AlertCircle, ChevronDown, ChevronUp, 
  Save, X, Search, Filter, User, Clock, Star
} from 'lucide-react';

// ✅ FIXED: Separate API URLs for different endpoints
const ADMIN_API_URL = 'https://food-ordering-app-83lm.onrender.com/api/admin';
const AUTH_API_URL = 'https://food-ordering-app-83lm.onrender.com/api/auth';
const RIDER_API_URL = 'https://food-ordering-app-83lm.onrender.com/api/riders';

const RiderTab = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [error, setError] = useState('');
  const [expandedRider, setExpandedRider] = useState(null);
  const [editingRider, setEditingRider] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ✅ FIXED: Fetch riders from users endpoint and filter by role
  const fetchRiders = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      // Try /api/admin/users first, then filter by role='rider'
      const response = await fetch(`${ADMIN_API_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Users API response:', data);
      
      // Filter users with role='rider'
      let ridersArray = [];
      if (data.success && Array.isArray(data.users)) {
        ridersArray = data.users.filter(user => user.role === 'rider');
      } else if (Array.isArray(data)) {
        ridersArray = data.filter(user => user.role === 'rider');
      } else if (data.users && Array.isArray(data.users)) {
        ridersArray = data.users.filter(user => user.role === 'rider');
      }
      
      console.log('🚴 Filtered riders:', ridersArray.length);
      setRiders(ridersArray);
      
    } catch (error) {
      console.error('❌ Error fetching riders:', error);
      setError(`Failed to load riders: ${error.message}`);
      setRiders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  // Filter riders based on search and filters
  const filteredRiders = riders.filter(rider => {
    const matchesSearch = 
      rider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && rider.isApproved) ||
      (statusFilter === 'pending' && !rider.isApproved) ||
      (statusFilter === 'active' && rider.isActive) ||
      (statusFilter === 'inactive' && !rider.isActive);

    return matchesSearch && matchesStatus;
  });

  // ✅ FIXED: Approve rider using auth endpoint
  const handleApproveRider = async (riderId, riderName) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${AUTH_API_URL}/users/${riderId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await fetchRiders();
      alert(`✅ Rider ${riderName} approved successfully!`);
    } catch (error) {
      console.error('Error approving rider:', error);
      alert(`❌ Failed to approve rider: ${error.message}`);
    }
  };

  // ✅ FIXED: Delete rider using auth endpoint
  const handleDeleteRider = async (riderId, riderName) => {
    if (!window.confirm(`Are you sure you want to delete rider ${riderName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${AUTH_API_URL}/users/${riderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await fetchRiders();
      alert(`✅ Rider ${riderName} deleted successfully!`);
    } catch (error) {
      console.error('Error deleting rider:', error);
      alert(`❌ Failed to delete rider: ${error.message}`);
    }
  };

  // Edit rider function
  const handleEditRider = (rider) => {
    setEditingRider(rider._id || rider.id);
    setEditForm({
      name: rider.name || '',
      email: rider.email || '',
      phone: rider.phone || '',
      vehicleType: rider.vehicleType || 'motorcycle',
      licenseNumber: rider.licenseNumber || ''
    });
  };

  // ✅ FIXED: Save edit using auth endpoint
  const handleSaveEdit = async (riderId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${AUTH_API_URL}/users/${riderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchRiders();
      setEditingRider(null);
      alert('✅ Rider updated successfully!');
    } catch (error) {
      console.error('Error updating rider:', error);
      alert('❌ Failed to update rider');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingRider(null);
    setEditForm({});
  };

  const handleViewRider = (rider) => {
    setSelectedRider(rider);
    setShowRiderModal(true);
  };

  const handleRefresh = () => {
    fetchRiders();
  };

  const toggleRiderExpand = (riderId) => {
    setExpandedRider(expandedRider === riderId ? null : riderId);
  };

  const getVehicleIcon = (vehicleType) => {
    switch (vehicleType?.toLowerCase()) {
      case 'motorcycle': return '🏍️';
      case 'bicycle': return '🚲';
      case 'car': return '🚗';
      default: return '🚚';
    }
  };

  const getStatusBadge = (isApproved) => {
    return isApproved ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
        Approved
      </span>
    ) : (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
        Pending Approval
      </span>
    );
  };

  // Calculate statistics
  const stats = {
    total: riders.length,
    approved: riders.filter(r => r.isApproved).length,
    pending: riders.filter(r => !r.isApproved).length,
    motorcycle: riders.filter(r => r.vehicleType === 'motorcycle').length,
    bicycle: riders.filter(r => r.vehicleType === 'bicycle').length,
    car: riders.filter(r => r.vehicleType === 'car').length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]">Rider Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-[#FFF0C4] border-t-[#8C1007] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#660B05] mt-2">Loading riders from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]">Rider Management</h2>
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
          <div className="flex-1 min-w-0">
            <p className="text-red-800 font-medium">Failed to load riders</p>
            <p className="text-red-700 text-sm break-words">{error}</p>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search riders by name, email, phone, or vehicle..."
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
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">Total Riders</p>
              <p className="text-lg sm:text-xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <Bike size={16} className="text-blue-600 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-green-600 truncate">Approved</p>
              <p className="text-lg sm:text-xl font-bold text-green-800">{stats.approved}</p>
            </div>
            <CheckCircle size={16} className="text-green-600 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-yellow-600 truncate">Pending</p>
              <p className="text-lg sm:text-xl font-bold text-yellow-800">{stats.pending}</p>
            </div>
            <Clock size={16} className="text-yellow-600 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-purple-600 truncate">Motorcycles</p>
              <p className="text-lg sm:text-xl font-bold text-purple-800">{stats.motorcycle}</p>
            </div>
            <span className="text-lg flex-shrink-0 ml-2">🏍️</span>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-orange-600 truncate">Bicycles</p>
              <p className="text-lg sm:text-xl font-bold text-orange-800">{stats.bicycle}</p>
            </div>
            <span className="text-lg flex-shrink-0 ml-2">🚲</span>
          </div>
        </div>
      </div>

      {/* Riders List */}
      <div className="space-y-4">
        {filteredRiders.length === 0 ? (
          <div className="text-center py-8">
            <Bike size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-[#660B05]">No riders found</p>
            <p className="text-sm text-[#8C1007]">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredRiders.map((rider) => (
            <div key={rider._id || rider.id} className="border border-[#FFF0C4] rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              {/* Mobile Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {getVehicleIcon(rider.vehicleType)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingRider === (rider._id || rider.id) ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                      />
                    ) : (
                      <>
                        <p className="font-medium text-[#3E0703] truncate">{rider.name}</p>
                        <p className="text-xs text-[#660B05] truncate">{rider.email}</p>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleRiderExpand(rider._id || rider.id)}
                  className="p-1 hover:bg-[#FFF0C4] rounded transition-colors"
                >
                  {expandedRider === (rider._id || rider.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Basic Info - Always Visible */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-[#660B05]">Vehicle</p>
                  <div className="mt-1">
                    {editingRider === (rider._id || rider.id) ? (
                      <select
                        value={editForm.vehicleType}
                        onChange={(e) => setEditForm({...editForm, vehicleType: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                      >
                        <option value="motorcycle">Motorcycle</option>
                        <option value="bicycle">Bicycle</option>
                        <option value="car">Car</option>
                      </select>
                    ) : (
                      <span className="text-sm font-medium text-[#3E0703]">
                        {getVehicleIcon(rider.vehicleType)} {rider.vehicleType || 'Motorcycle'}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#660B05]">Status</p>
                  <div className="mt-1">{getStatusBadge(rider.isApproved)}</div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRider === (rider._id || rider.id) && (
                <div className="border-t border-[#FFF0C4] pt-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#660B05]">Phone</p>
                      {editingRider === (rider._id || rider.id) ? (
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                        />
                      ) : (
                        <p className="text-sm text-[#3E0703]">{rider.phone || 'N/A'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-[#660B05]">License Number</p>
                      {editingRider === (rider._id || rider.id) ? (
                        <input
                          type="text"
                          value={editForm.licenseNumber}
                          onChange={(e) => setEditForm({...editForm, licenseNumber: e.target.value})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                        />
                      ) : (
                        <p className="text-sm text-[#3E0703]">{rider.licenseNumber || 'N/A'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-[#660B05]">Joined</p>
                      <p className="text-sm text-[#3E0703]">
                        {rider.createdAt ? new Date(rider.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    {rider.licensePhoto && (
                      <div>
                        <p className="text-xs text-[#660B05]">License Photo</p>
                        <button 
                          onClick={() => window.open(rider.licensePhoto, '_blank')}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          View License
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {editingRider === (rider._id || rider.id) ? (
                      <>
                        <button 
                          onClick={() => handleSaveEdit(rider._id || rider.id)}
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
                          onClick={() => handleViewRider(rider)}
                          className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handleEditRider(rider)}
                          className="bg-[#8C1007] text-white px-3 py-2 rounded text-sm font-medium hover:bg-[#660B05] transition-colors flex items-center justify-center space-x-1"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        
                        {!rider.isApproved && (
                          <button 
                            onClick={() => handleApproveRider(rider._id || rider.id, rider.name)}
                            className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleDeleteRider(rider._id || rider.id, rider.name)}
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

              {/* Action Buttons - Collapsed State */}
              {expandedRider !== (rider._id || rider.id) && !editingRider && (
                <div className="flex space-x-2 border-t border-[#FFF0C4] pt-3">
                  <button 
                    onClick={() => handleViewRider(rider)}
                    className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleEditRider(rider)}
                    className="flex-1 bg-[#8C1007] text-white px-2 py-1 rounded text-xs font-medium hover:bg-[#660B05] transition-colors"
                  >
                    Edit
                  </button>
                  
                  {!rider.isApproved && (
                    <button 
                      onClick={() => handleApproveRider(rider._id || rider.id, rider.name)}
                      className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleDeleteRider(rider._id || rider.id, rider.name)}
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

      {/* Rider Details Modal */}
      {showRiderModal && selectedRider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#3E0703]">Rider Details</h3>
              <button 
                onClick={() => setShowRiderModal(false)}
                className="text-gray-400 hover:text-[#8C1007]"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white text-2xl">{getVehicleIcon(selectedRider.vehicleType)}</span>
                </div>
                <h4 className="font-bold text-lg mt-2">{selectedRider.name}</h4>
                <p className="text-sm text-gray-600">{selectedRider.email}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">Phone</label>
                  <p className="text-[#3E0703]">{selectedRider.phone || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">Vehicle Type</label>
                  <p className="text-[#3E0703]">{getVehicleIcon(selectedRider.vehicleType)} {selectedRider.vehicleType}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">License Number</label>
                  <p className="text-[#3E0703]">{selectedRider.licenseNumber || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">Status</label>
                  {getStatusBadge(selectedRider.isApproved)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#660B05] mb-1">Joined Date</label>
                <p className="text-[#3E0703]">
                  {selectedRider.createdAt ? new Date(selectedRider.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              {selectedRider.licensePhoto && (
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">License Photo</label>
                  <img 
                    src={selectedRider.licensePhoto} 
                    alt="License" 
                    className="w-full h-48 object-contain border rounded-lg"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRiderModal(false)}
                className="px-4 py-2 text-[#660B05] hover:text-[#3E0703] font-medium"
              >
                Close
              </button>
              {!selectedRider.isApproved && (
                <button
                  onClick={() => {
                    handleApproveRider(selectedRider._id || selectedRider.id, selectedRider.name);
                    setShowRiderModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                >
                  Approve Rider
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderTab;