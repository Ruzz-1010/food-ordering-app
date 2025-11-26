// UsersTab.jsx - MODERN REDESIGN
import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, CheckCircle, XCircle, Edit, Trash2, Mail, Phone, AlertCircle, ChevronDown, ChevronUp, Save, X, Search, Filter } from 'lucide-react';
import { apiService } from '../../services/api';

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [error, setError] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const data = await apiService.getUsers();
      
      // Handle different response formats
      let usersArray = [];
      if (data.success && Array.isArray(data.users)) {
        usersArray = data.users;
      } else if (Array.isArray(data)) {
        usersArray = data;
      } else if (data.users && Array.isArray(data.users)) {
        usersArray = data.users;
      } else {
        usersArray = [];
      }
      
      setUsers(usersArray);
      
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setError(`Failed to load users: ${error.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && user.isApproved) ||
      (statusFilter === 'pending' && !user.isApproved && user.role !== 'customer');

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleApproveUser = async (userId, userName) => {
    try {
      await apiService.approveUser(userId);
      await fetchUsers();
      alert(`✅ User ${userName} approved successfully!`);
    } catch (error) {
      console.error('Error approving user:', error);
      alert(`❌ Failed to approve user: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteUser(userId);
      await fetchUsers();
      alert(`✅ User ${userName} deleted successfully!`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`❌ Failed to delete user: ${error.message}`);
    }
  };

  // Edit user function
  const handleEditUser = (user) => {
    setEditingUser(user._id || user.id);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'customer'
    });
  };

  // Save edited user
  const handleSaveEdit = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiService.baseURL}/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await fetchUsers();
        setEditingUser(null);
        alert('✅ User updated successfully!');
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('❌ Failed to update user');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const toggleUserExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: 'bg-purple-100 text-purple-800', label: 'Admin' },
      restaurant: { color: 'bg-[#FFF0C4] text-[#660B05]', label: 'Restaurant' },
      rider: { color: 'bg-blue-100 text-blue-800', label: 'Rider' },
      customer: { color: 'bg-green-100 text-green-800', label: 'Customer' }
    };
    
    const config = roleConfig[role] || roleConfig.customer;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (isApproved, role) => {
    if (role === 'customer' || role === 'admin') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          Active
        </span>
      );
    }
    
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
    total: users.length,
    customers: users.filter(u => u.role === 'customer').length,
    restaurants: users.filter(u => u.role === 'restaurant').length,
    riders: users.filter(u => u.role === 'rider').length,
    admins: users.filter(u => u.role === 'admin').length,
    pending: users.filter(u => !u.isApproved && u.role !== 'customer').length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]">User Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-[#FFF0C4] border-t-[#8C1007] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#660B05] mt-2">Loading users from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#FFF0C4] p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#3E0703]"> User Management</h2>
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
            <p className="text-red-800 font-medium">Failed to load users</p>
            <p className="text-red-700 text-sm break-words">{error}</p>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
          />
        </div>
        <select 
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C1007]"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="restaurant">Restaurants</option>
          <option value="rider">Riders</option>
          <option value="admin">Admins</option>
        </select>
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

      {/* Stats Summary - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">Total</p>
              <p className="text-lg sm:text-xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <Users size={16} className="text-blue-600 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-green-600 truncate">Customers</p>
              <p className="text-lg sm:text-xl font-bold text-green-800">{stats.customers}</p>
            </div>
            <Users size={16} className="text-green-600 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-[#FFF0C4] border border-[#8C1007] rounded-lg p-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-[#660B05] truncate">Restaurants</p>
              <p className="text-lg sm:text-xl font-bold text-[#8C1007]">{stats.restaurants}</p>
            </div>
            <Users size={16} className="text-[#8C1007] flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">Riders</p>
              <p className="text-lg sm:text-xl font-bold text-blue-800">{stats.riders}</p>
            </div>
            <Users size={16} className="text-blue-600 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-purple-600 truncate">Admins</p>
              <p className="text-lg sm:text-xl font-bold text-purple-800">{stats.admins}</p>
            </div>
            <Users size={16} className="text-purple-600 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-yellow-600 truncate">Pending</p>
              <p className="text-lg sm:text-xl font-bold text-yellow-800">{stats.pending}</p>
            </div>
            <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Users List - Mobile Responsive */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-[#660B05]">No users found</p>
            <p className="text-sm text-[#8C1007]">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user._id || user.id} className="border border-[#FFF0C4] rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              {/* Mobile Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#8C1007] to-[#660B05] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingUser === (user._id || user.id) ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                      />
                    ) : (
                      <>
                        <p className="font-medium text-[#3E0703] truncate">{user.name}</p>
                        <p className="text-xs text-[#660B05] truncate">{user.email}</p>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleUserExpand(user._id || user.id)}
                  className="p-1 hover:bg-[#FFF0C4] rounded transition-colors"
                >
                  {expandedUser === (user._id || user.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Basic Info - Always Visible */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-[#660B05]">Role</p>
                  <div className="mt-1">
                    {editingUser === (user._id || user.id) ? (
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                      >
                        <option value="customer">Customer</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="rider">Rider</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      getRoleBadge(user.role)
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#660B05]">Status</p>
                  <div className="mt-1">{getStatusBadge(user.isApproved, user.role)}</div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedUser === (user._id || user.id) && (
                <div className="border-t border-[#FFF0C4] pt-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#660B05]">Phone</p>
                      {editingUser === (user._id || user.id) ? (
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C1007]"
                        />
                      ) : (
                        <p className="text-sm text-[#3E0703]">{user.phone || 'N/A'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-[#660B05]">Joined</p>
                      <p className="text-sm text-[#3E0703]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {editingUser === (user._id || user.id) ? (
                      <>
                        <button 
                          onClick={() => handleSaveEdit(user._id || user.id)}
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
                          onClick={() => handleViewUser(user)}
                          className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="bg-[#8C1007] text-white px-3 py-2 rounded text-sm font-medium hover:bg-[#660B05] transition-colors flex items-center justify-center space-x-1"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        
                        {!user.isApproved && user.role !== 'customer' && (
                          <button 
                            onClick={() => handleApproveUser(user._id || user.id, user.name)}
                            className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleDeleteUser(user._id || user.id, user.name)}
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
              {expandedUser !== (user._id || user.id) && !editingUser && (
                <div className="flex space-x-2 border-t border-[#FFF0C4] pt-3">
                  <button 
                    onClick={() => handleViewUser(user)}
                    className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleEditUser(user)}
                    className="flex-1 bg-[#8C1007] text-white px-2 py-1 rounded text-xs font-medium hover:bg-[#660B05] transition-colors"
                  >
                    Edit
                  </button>
                  
                  {!user.isApproved && user.role !== 'customer' && (
                    <button 
                      onClick={() => handleApproveUser(user._id || user.id, user.name)}
                      className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleDeleteUser(user._id || user.id, user.name)}
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

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#3E0703]">User Details</h3>
              <button 
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-[#8C1007]"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#660B05] mb-1">Name</label>
                <p className="text-[#3E0703]">{selectedUser.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#660B05] mb-1">Email</label>
                <p className="text-[#3E0703] break-words">{selectedUser.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#660B05] mb-1">Phone</label>
                <p className="text-[#3E0703]">{selectedUser.phone || 'N/A'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">Role</label>
                  {getRoleBadge(selectedUser.role)}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#660B05] mb-1">Status</label>
                  {getStatusBadge(selectedUser.isApproved, selectedUser.role)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#660B05] mb-1">Joined Date</label>
                <p className="text-[#3E0703]">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 text-[#660B05] hover:text-[#3E0703] font-medium"
              >
                Close
              </button>
              {!selectedUser.isApproved && selectedUser.role !== 'customer' && (
                <button
                  onClick={() => {
                    handleApproveUser(selectedUser._id || selectedUser.id, selectedUser.name);
                    setShowUserModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                >
                  Approve User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTab;