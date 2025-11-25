import React, { useState, useEffect } from 'react';
import { Bike, RefreshCw, CheckCircle, XCircle, Edit, Trash2, MapPin, Phone, Mail, User, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { apiService } from '../../services/api';

const RiderTab = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, rider: null });
  const [expandedRider, setExpandedRider] = useState(null);

  const fetchRiders = async () => {
    try {
      setRefreshing(true);
      const data = await apiService.getUsers();
      
      // Filter only riders
      let ridersArray = [];
      if (data.success && Array.isArray(data.users)) {
        ridersArray = data.users.filter(user => user.role === 'rider');
      } else if (Array.isArray(data)) {
        ridersArray = data.filter(user => user.role === 'rider');
      }
      
      setRiders(ridersArray);
      
    } catch (error) {
      console.error('❌ Error fetching riders:', error);
      setRiders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const handleApproveRider = async (riderId, riderName) => {
    try {
      await apiService.approveUser(riderId);
      await fetchRiders();
      alert(`✅ Rider "${riderName}" approved successfully!`);
    } catch (error) {
      console.error('Error approving rider:', error);
      alert('❌ Failed to approve rider');
    }
  };

  const handleToggleActive = async (riderId, currentStatus, riderName) => {
    try {
      // This endpoint might need to be created in your backend
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiService.baseURL}/auth/users/${riderId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchRiders();
        alert(`✅ Rider "${riderName}" ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        throw new Error('Failed to update rider status');
      }
    } catch (error) {
      console.error('Error toggling rider status:', error);
      alert('❌ Failed to update rider status');
    }
  };

  const showDeleteConfirm = (riderId, riderName) => {
    setDeleteConfirm({
      show: true,
      rider: { id: riderId, name: riderName }
    });
  };

  const hideDeleteConfirm = () => {
    setDeleteConfirm({ show: false, rider: null });
  };

  const handleDeleteRider = async () => {
    if (!deleteConfirm.rider) return;

    const { id: riderId, name: riderName } = deleteConfirm.rider;

    try {
      await apiService.deleteUser(riderId);
      await fetchRiders();
      alert('✅ Rider deleted successfully!');
    } catch (error) {
      console.error('Error deleting rider:', error);
      alert('❌ Failed to delete rider');
    } finally {
      hideDeleteConfirm();
    }
  };

  const handleRefresh = () => {
    fetchRiders();
  };

  const toggleRiderExpand = (riderId) => {
    setExpandedRider(expandedRider === riderId ? null : riderId);
  };

  // Calculate statistics
  const stats = {
    total: riders.length,
    approved: riders.filter(r => r.isApproved).length,
    pending: riders.filter(r => !r.isApproved).length,
    active: riders.filter(r => r.isActive).length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Rider Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading riders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900"> Rider Management</h2>
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
              <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">Total Riders</p>
              <p className="text-lg sm:text-xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <Bike size={16} className="text-blue-600 flex-shrink-0 ml-2" />
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
            <Bike size={16} className="text-purple-600 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Riders List - Mobile Responsive */}
      <div className="space-y-4">
        {riders.length === 0 ? (
          <div className="text-center py-8">
            <Bike size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500">No riders found in database</p>
            <p className="text-sm text-gray-500">Riders will appear here when users register as delivery riders</p>
          </div>
        ) : (
          riders.map((rider) => (
            <div key={rider._id || rider.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Mobile Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{rider.name}</p>
                    <p className="text-xs text-gray-500 truncate">{rider.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleRiderExpand(rider._id || rider.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {expandedRider === (rider._id || rider.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Basic Info - Always Visible */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rider.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {rider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Approval</p>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rider.isApproved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rider.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="mb-3">
                <p className="text-xs text-gray-500">Vehicle</p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  rider.vehicleType === 'motorcycle' ? 'bg-blue-100 text-blue-800' :
                  rider.vehicleType === 'bicycle' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {rider.vehicleType === 'motorcycle' ? '🏍️ Motorcycle' :
                   rider.vehicleType === 'bicycle' ? '🚲 Bicycle' : '🚗 Car'}
                </span>
                {rider.licenseNumber && (
                  <p className="text-xs text-gray-500 mt-1">License: {rider.licenseNumber}</p>
                )}
              </div>

              {/* Expanded Details */}
              {expandedRider === (rider._id || rider.id) && (
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{rider.phone || 'N/A'}</span>
                    </div>
                    {rider.address && (
                      <div className="flex items-start space-x-2">
                        <MapPin size={14} className="text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-500 break-words">{rider.address}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Joined Date</p>
                      <p className="text-sm text-gray-700">
                        {rider.createdAt ? new Date(rider.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {!rider.isApproved && (
                      <button 
                        onClick={() => handleApproveRider(rider._id || rider.id, rider.name)}
                        className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    <button 
                      onClick={() => handleToggleActive(rider._id || rider.id, rider.isActive, rider.name)}
                      className={`${
                        rider.isActive 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white px-3 py-2 rounded text-sm font-medium transition-colors`}
                    >
                      {rider.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                      Edit
                    </button>
                    <button 
                      onClick={() => showDeleteConfirm(rider._id || rider.id, rider.name)}
                      className="bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons - Collapsed State */}
              {expandedRider !== (rider._id || rider.id) && (
                <div className="flex space-x-2 border-t pt-3">
                  {!rider.isApproved && (
                    <button 
                      onClick={() => handleApproveRider(rider._id || rider.id, rider.name)}
                      className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  <button 
                    onClick={() => handleToggleActive(rider._id || rider.id, rider.isActive, rider.name)}
                    className={`flex-1 ${
                      rider.isActive 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white px-2 py-1 rounded text-xs font-medium transition-colors`}
                  >
                    {rider.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => showDeleteConfirm(rider._id || rider.id, rider.name)}
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
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Rider</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete rider <strong>"{deleteConfirm.rider?.name}"</strong>? 
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
                  onClick={handleDeleteRider}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Rider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderTab;