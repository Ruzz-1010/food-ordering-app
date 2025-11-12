import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, CheckCircle, XCircle, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_URL}/auth/users`);
      const data = await response.json();
      
      console.log('👥 Users data:', data);
      
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApproveUser = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/auth/users/${userId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchUsers(); // Refresh data
        alert('User approved successfully!');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchUsers(); // Refresh data
        alert('User deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: 'bg-purple-100 text-purple-800', label: 'Admin' },
      restaurant: { color: 'bg-orange-100 text-orange-800', label: 'Restaurant' },
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Users</p>
              <p className="text-xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <Users size={20} className="text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Customers</p>
              <p className="text-xl font-bold text-green-800">{stats.customers}</p>
            </div>
            <Users size={20} className="text-green-600" />
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Restaurants</p>
              <p className="text-xl font-bold text-orange-800">{stats.restaurants}</p>
            </div>
            <Users size={20} className="text-orange-600" />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Riders</p>
              <p className="text-xl font-bold text-blue-800">{stats.riders}</p>
            </div>
            <Users size={20} className="text-blue-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Admins</p>
              <p className="text-xl font-bold text-purple-800">{stats.admins}</p>
            </div>
            <Users size={20} className="text-purple-600" />
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-xl font-bold text-yellow-800">{stats.pending}</p>
            </div>
            <Users size={20} className="text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Contact</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Joined</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  <Users size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No users found in database</p>
                  <p className="text-sm">Users will appear here when they register</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id || user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">ID: {user._id || user.id}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Mail size={12} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone size={12} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{user.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(user.isApproved, user.role)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        title="View Details"
                      >
                        <Edit size={16} />
                      </button>
                      
                      {!user.isApproved && user.role !== 'customer' && (
                        <button 
                          onClick={() => handleApproveUser(user._id || user.id)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                          title="Approve User"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleDeleteUser(user._id || user.id, user.name)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        title="Delete User"
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

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">User Details</h3>
              <button 
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{selectedUser.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900">{selectedUser.phone}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-gray-900">{selectedUser.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  {getRoleBadge(selectedUser.role)}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {getStatusBadge(selectedUser.isApproved, selectedUser.role)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
                <p className="text-gray-900">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Close
              </button>
              {!selectedUser.isApproved && selectedUser.role !== 'customer' && (
                <button
                  onClick={() => {
                    handleApproveUser(selectedUser._id || selectedUser.id);
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