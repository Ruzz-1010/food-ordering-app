// UsersTab.jsx - CLEAN MODERN DESIGN
import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, MoreHorizontal, CheckCircle, XCircle, Shield } from 'lucide-react';

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const API_URL = 'https://food-ordering-app-83lm.onrender.com/api';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => ({
    admin: 'bg-purple-100 text-purple-700',
    restaurant: 'bg-red-100 text-red-700',
    rider: 'bg-blue-100 text-blue-700',
    customer: 'bg-green-100 text-green-700'
  }[role] || 'bg-gray-100 text-gray-700');

  const approveUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/auth/users/${userId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <p className="text-gray-500 mt-1">Manage platform users</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: users.length, color: 'bg-blue-500' },
          { label: 'Customers', value: users.filter(u => u.role === 'customer').length, color: 'bg-green-500' },
          { label: 'Restaurants', value: users.filter(u => u.role === 'restaurant').length, color: 'bg-red-500' },
          { label: 'Riders', value: users.filter(u => u.role === 'rider').length, color: 'bg-blue-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="restaurant">Restaurants</option>
          <option value="rider">Riders</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-30" />
            <p>No users found</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex gap-2">
                  {!user.isApproved && user.role !== 'customer' && (
                    <button
                      onClick={() => approveUser(user._id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Approve"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteUser(user._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{user.name}</h3>
              <p className="text-sm text-gray-500 mb-3 truncate">{user.email}</p>
              
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
                {user.isApproved ? (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> Approved
                  </span>
                ) : (
                  <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                    <Shield size={12} /> Pending
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersTab;