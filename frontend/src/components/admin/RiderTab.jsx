// RiderTab.jsx - DEBUG VERSION
import React, { useState, useEffect } from 'react';
import { 
  Bike, RefreshCw, CheckCircle, XCircle, Edit, Trash2, 
  Phone, Mail, MapPin, AlertCircle, ChevronDown, ChevronUp, 
  Save, X, Search, Filter, User, Clock, Star, Bug
} from 'lucide-react';

const API_URL = 'https://food-ordering-app-83lm.onrender.com/api';

const RiderTab = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [expandedRider, setExpandedRider] = useState(null);
  const [editingRider, setEditingRider] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch riders from admin users endpoint
  const fetchRiders = async () => {
    try {
      setRefreshing(true);
      setError('');
      setDebugInfo('Fetching from: ' + `${API_URL}/admin/users`);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/admin/users`, {
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
      setDebugInfo(prev => prev + `\nFound ${ridersArray.length} riders`);
      
    } catch (error) {
      console.error('❌ Error fetching riders:', error);
      setError(`Failed to load riders: ${error.message}`);
      setDebugInfo(prev => prev + `\nError: ${error.message}`);
      setRiders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  // TEST FUNCTION - Try different endpoints
  const testEndpoints = async (riderId) => {
    const token = localStorage.getItem('token');
    const results = [];
    
    // Test 1: /api/auth/users/:id/approve
    try {
      const r1 = await fetch(`${API_URL}/auth/users/${riderId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      results.push(`✅ /auth/users/${riderId}/approve: ${r1.status}`);
    } catch (e) {
      results.push(`❌ /auth/users/${riderId}/approve: ${e.message}`);
    }
    
    // Test 2: /api/admin/users/:id/approve
    try {
      const r2 = await fetch(`${API_URL}/admin/users/${riderId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      results.push(`✅ /admin/users/${riderId}/approve: ${r2.status}`);
    } catch (e) {
      results.push(`❌ /admin/users/${riderId}/approve: ${e.message}`);
    }
    
    // Test 3: /api/users/:id/approve
    try {
      const r3 = await fetch(`${API_URL}/users/${riderId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      results.push(`✅ /users/${riderId}/approve: ${r3.status}`);
    } catch (e) {
      results.push(`❌ /users/${riderId}/approve: ${e.message}`);
    }
    
    setDebugInfo(results.join('\n'));
  };

  // Approve rider - try multiple endpoints
  const handleApproveRider = async (riderId, riderName) => {
    const token = localStorage.getItem('token');
    let lastError = null;
    
    // Try endpoint 1: /api/auth/users/:id/approve
    try {
      setDebugInfo(`Trying: ${API_URL}/auth/users/${riderId}/approve`);
      const response = await fetch(`${API_URL}/auth/users/${riderId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchRiders();
        alert(`✅ Rider ${riderName} approved successfully!`);
        setDebugInfo(`✅ Success with /auth/users/${riderId}/approve`);
        return;
      } else {
        lastError = `Auth endpoint: ${response.status}`;
      }
    } catch (error) {
      lastError = `Auth endpoint: ${error.message}`;
    }
    
    // Try endpoint 2: /api/admin/users/:id/approve
    try {
      setDebugInfo(`Trying: ${API_URL}/admin/users/${riderId}/approve`);
      const response = await fetch(`${API_URL}/admin/users/${riderId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchRiders();
        alert(`✅ Rider ${riderName} approved successfully!`);
        setDebugInfo(`✅ Success with /admin/users/${riderId}/approve`);
        return;
      } else {
        lastError += ` | Admin endpoint: ${response.status}`;
      }
    } catch (error) {
      lastError += ` | Admin endpoint: ${error.message}`;
    }
    
    // Try endpoint 3: /api/users/:id/approve (no prefix)
    try {
      setDebugInfo(`Trying: ${API_URL}/users/${riderId}/approve`);
      const response = await fetch(`${API_URL}/users/${riderId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchRiders();
        alert(`✅ Rider ${riderName} approved successfully!`);
        setDebugInfo(`✅ Success with /users/${riderId}/approve`);
        return;
      } else {
        lastError += ` | Users endpoint: ${response.status}`;
      }
    } catch (error) {
      lastError += ` | Users endpoint: ${error.message}`;
    }
    
    alert(`❌ Failed to approve rider. Errors: ${lastError}`);
    setDebugInfo(`❌ All endpoints failed:\n${lastError}`);
  };

  // Delete rider - try multiple endpoints
  const handleDeleteRider = async (riderId, riderName) => {
    if (!window.confirm(`Are you sure you want to delete rider ${riderName}?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    let lastError = null;
    
    // Try endpoint 1: /api/auth/users/:id
    try {
      setDebugInfo(`Trying DELETE: ${API_URL}/auth/users/${riderId}`);
      const response = await fetch(`${API_URL}/auth/users/${riderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchRiders();
        alert(`✅ Rider ${riderName} deleted successfully!`);
        setDebugInfo(`✅ DELETE Success with /auth/users/${riderId}`);
        return;
      } else {
        lastError = `Auth endpoint: ${response.status}`;
      }
    } catch (error) {
      lastError = `Auth endpoint: ${error.message}`;
    }
    
    // Try endpoint 2: /api/admin/users/:id
    try {
      setDebugInfo(`Trying DELETE: ${API_URL}/admin/users/${riderId}`);
      const response = await fetch(`${API_URL}/admin/users/${riderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchRiders();
        alert(`✅ Rider ${riderName} deleted successfully!`);
        setDebugInfo(`✅ DELETE Success with /admin/users/${riderId}`);
        return;
      } else {
        lastError += ` | Admin endpoint: ${response.status}`;
      }
    } catch (error) {
      lastError += ` | Admin endpoint: ${error.message}`;
    }
    
    // Try endpoint 3: /api/users/:id
    try {
      setDebugInfo(`Trying DELETE: ${API_URL}/users/${riderId}`);
      const response = await fetch(`${API_URL}/users/${riderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchRiders();
        alert(`✅ Rider ${riderName} deleted successfully!`);
        setDebugInfo(`✅ DELETE Success with /users/${riderId}`);
        return;
      } else {
        lastError += ` | Users endpoint: ${response.status}`;
      }
    } catch (error) {
      lastError += ` | Users endpoint: ${error.message}`;
    }
    
    alert(`❌ Failed to delete rider. Errors: ${lastError}`);
    setDebugInfo(`❌ All DELETE endpoints failed:\n${lastError}`);
  };

  // Edit rider
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

  // Save edit - try multiple endpoints
  const handleSaveEdit = async (riderId) => {
    const token = localStorage.getItem('token');
    let lastError = null;
    
    // Try endpoint 1: /api/auth/users/:id
    try {
      const response = await fetch(`${API_URL}/auth/users/${riderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await fetchRiders();
        setEditingRider(null);
        alert('✅ Rider updated successfully!');
        return;
      } else {
        lastError = `Auth endpoint: ${response.status}`;
      }
    } catch (error) {
      lastError = `Auth endpoint: ${error.message}`;
    }
    
    // Try endpoint 2: /api/admin/users/:id
    try {
      const response = await fetch(`${API_URL}/admin/users/${riderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await fetchRiders();
        setEditingRider(null);
        alert('✅ Rider updated successfully!');
        return;
      } else {
        lastError += ` | Admin endpoint: ${response.status}`;
      }
    } catch (error) {
      lastError += ` | Admin endpoint: ${error.message}`;
    }
    
    alert(`❌ Failed to update rider. Errors: ${lastError}`);
  };

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

  const stats = {
    total: riders.length,
    approved: riders.filter(r => r.isApproved).length,
    pending: riders.filter(r => !r.isApproved).length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]">Rider Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-[#FFF0C4] border-t-[#8C1007] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#660B05] mt-2">Loading riders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
      {/* Debug Panel */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-gray-300">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-sm flex items-center">
            <Bug size={14} className="mr-1" /> Debug Info
          </h4>
          <button 
            onClick={() => setDebugInfo('')}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
        <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
          {debugInfo || 'No debug info yet...'}
        </pre>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]">Rider Management</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-gradient-to-r from-[#8C1007] to-[#660B05] text-white px-4 py-2 rounded-lg hover:shadow-md transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-blue-800">{stats.total}</p>
          <p className="text-xs text-blue-600">Total</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-800">{stats.approved}</p>
          <p className="text-xs text-green-600">Approved</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-yellow-800">{stats.pending}</p>
          <p className="text-xs text-yellow-600">Pending</p>
        </div>
      </div>

      {/* Riders List */}
      <div className="space-y-4">
        {riders.length === 0 ? (
          <div className="text-center py-8">
            <Bike size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-[#660B05]">No riders found</p>
          </div>
        ) : (
          riders.map((rider) => (
            <div key={rider._id || rider.id} className="border border-[#FFF0C4] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getVehicleIcon(rider.vehicleType)}</span>
                  <div>
                    <p className="font-medium text-[#3E0703]">{rider.name}</p>
                    <p className="text-xs text-[#660B05]">{rider.email}</p>
                  </div>
                </div>
                {getStatusBadge(rider.isApproved)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Phone:</span> {rider.phone || 'N/A'}
                </div>
                <div>
                  <span className="text-gray-500">License:</span> {rider.licenseNumber || 'N/A'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {!rider.isApproved && (
                  <button 
                    onClick={() => handleApproveRider(rider._id || rider.id, rider.name)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                )}
                <button 
                  onClick={() => handleEditRider(rider)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteRider(rider._id || rider.id, rider.name)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
                <button 
                  onClick={() => testEndpoints(rider._id || rider.id)}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  Test APIs
                </button>
              </div>

              {/* Edit Form */}
              {editingRider === (rider._id || rider.id) && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="border rounded px-2 py-1 text-sm"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="border rounded px-2 py-1 text-sm"
                      placeholder="Phone"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSaveEdit(rider._id || rider.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Save
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RiderTab;