// RiderTab.jsx - CLEAN MODERN DESIGN
import React, { useState, useEffect } from 'react';
import { 
  Bike, Search, CheckCircle, XCircle, Phone, Mail, 
  MapPin, Star, Edit, Trash2, Shield 
} from 'lucide-react';

const RiderTab = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const ADMIN_API_URL = 'https://food-ordering-app-83lm.onrender.com/api/admin';
  const AUTH_API_URL = 'https://food-ordering-app-83lm.onrender.com/api/auth';

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${ADMIN_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const ridersList = (data.users || []).filter(u => u.role === 'rider');
      setRiders(ridersList);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = 
      rider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && rider.isApproved) ||
      (statusFilter === 'pending' && !rider.isApproved);
    return matchesSearch && matchesStatus;
  });

  const approveRider = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${AUTH_API_URL}/users/${id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRiders();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteRider = async (id) => {
    if (!window.confirm('Delete this rider?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${AUTH_API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRiders();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getVehicleIcon = (type) => {
    const icons = { motorcycle: '🏍️', bicycle: '🚲', car: '🚗' };
    return icons[type] || '🚚';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Riders</h2>
          <p className="text-gray-500 mt-1">Manage delivery personnel</p>
        </div>
        <button
          onClick={fetchRiders}
          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Riders', value: riders.length, icon: Bike },
          { label: 'Approved', value: riders.filter(r => r.isApproved).length, color: 'text-green-600' },
          { label: 'Pending', value: riders.filter(r => !r.isApproved).length, color: 'text-yellow-600' },
          { label: 'Active Now', value: '12', color: 'text-blue-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color || 'text-gray-900'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search riders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Riders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-400">Loading...</div>
        ) : filteredRiders.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            <Bike size={48} className="mx-auto mb-3 opacity-30" />
            <p>No riders found</p>
          </div>
        ) : (
          filteredRiders.map((rider) => (
            <div key={rider._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-2xl">
                  {getVehicleIcon(rider.vehicleType)}
                </div>
                <div className="flex gap-2">
                  {!rider.isApproved && (
                    <button
                      onClick={() => approveRider(rider._id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Approve"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteRider(rider._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 text-lg mb-1">{rider.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{rider.email}</p>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span>{rider.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-gray-400" />
                  <span>License: {rider.licenseNumber || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  rider.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {rider.isApproved ? 'Approved' : 'Pending'}
                </span>
                <span className="text-xs text-gray-400">
                  {rider.vehicleType || 'motorcycle'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RiderTab;