import React, { useState, useEffect } from 'react';
import { Bike, RefreshCw, CheckCircle, XCircle, Edit, Trash2, MapPin, Phone, Mail, User, AlertCircle } from 'lucide-react';

const RiderTab = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, rider: null });

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  const fetchRiders = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter only riders
      let ridersArray = [];
      if (data.success && Array.isArray(data.users)) {
        ridersArray = data.users.filter(user => user.role === 'rider');
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/users/${riderId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchRiders();
        alert(`✅ Rider "${riderName}" approved successfully!`);
      } else {
        throw new Error('Failed to approve rider');
      }
    } catch (error) {
      console.error('Error approving rider:', error);
      alert('❌ Failed to approve rider');
    }
  };

  const handleToggleActive = async (riderId, currentStatus, riderName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/users/${riderId}/toggle-active`, {
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/users/${riderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchRiders();
        alert('✅ Rider deleted successfully!');
      } else {
        throw new Error('Failed to delete rider');
      }
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

  // Calculate statistics
  const stats = {
    total: riders.length,
    approved: riders.filter(r => r.isApproved).length,
    pending: riders.filter(r => !r.isApproved).length,
    active: riders.filter(r => r.isActive).length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Rider Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading riders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🚴 Rider Management</h2>
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
              <p className="text-sm font-medium text-blue-600">Total Riders</p>
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <Bike size={24} className="text-blue-600" />
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
            <Bike size={24} className="text-purple-600" />
          </div>
        </div>
      </div>

      {/* Riders Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Rider Information</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Contact Details</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Vehicle</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Approval</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {riders.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  <Bike size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No riders found in database</p>
                  <p className="text-sm">Riders will appear here when users register as delivery riders</p>
                </td>
              </tr>
            ) : (
              riders.map((rider) => (
                <tr key={rider._id || rider.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{rider.name}</p>
                        <p className="text-xs text-gray-500">
                          Joined: {rider.createdAt ? new Date(rider.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Mail size={12} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{rider.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone size={12} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{rider.phone || 'N/A'}</span>
                      </div>
                      {rider.address && (
                        <div className="flex items-center space-x-1">
                          <MapPin size={12} className="text-gray-400" />
                          <span className="text-sm text-gray-500 truncate">{rider.address}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
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
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rider.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {rider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rider.isApproved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rider.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      {!rider.isApproved && (
                        <button 
                          onClick={() => handleApproveRider(rider._id || rider.id, rider.name)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                          title="Approve Rider"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleToggleActive(rider._id || rider.id, rider.isActive, rider.name)}
                        className={`text-sm font-medium ${
                          rider.isActive 
                            ? 'text-red-600 hover:text-red-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title={rider.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {rider.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => showDeleteConfirm(rider._id || rider.id, rider.name)}
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