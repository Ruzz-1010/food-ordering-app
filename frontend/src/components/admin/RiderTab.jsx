import React, { useState, useEffect } from 'react';
import { 
  Bike, RefreshCw, CheckCircle, XCircle, Edit, Trash2, 
  MapPin, Phone, Mail, User, AlertCircle, ChevronDown, 
  ChevronUp, Image, FileText, Download
} from 'lucide-react';
import { apiService } from '../../services/api';

const RiderTab = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, rider: null });
  const [expandedRider, setExpandedRider] = useState(null);
  const [imagePreview, setImagePreview] = useState({ show: false, imageData: '', riderName: '' });

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
      
      // 🐛 DEBUG: Check license data
      console.log('🚴 Riders data from backend:', ridersArray);
      ridersArray.forEach(rider => {
        if (rider.licensePhoto) {
          console.log(`📸 Rider ${rider.name} licensePhoto type:`, 
            rider.licensePhoto.startsWith('data:image/') ? 'Base64' : 'URL',
            'Length:', rider.licensePhoto.length
          );
        }
      });
      
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

  // ✅ UPDATED: Handle both Base64 and URL images
  const getLicenseImageData = (rider) => {
    // Check if it's a Base64 string (new format)
    if (rider.licensePhoto && rider.licensePhoto.startsWith('data:image/')) {
      return {
        data: rider.licensePhoto,
        type: 'base64'
      };
    }
    
    // Fallback to other possible image fields (old format)
    if (rider.licenseImage) return { data: rider.licenseImage, type: 'url' };
    if (rider.licenseImageUrl) return { data: rider.licenseImageUrl, type: 'url' };
    if (rider.licensePhotoUrl) return { data: rider.licensePhotoUrl, type: 'url' };
    if (rider.image) return { data: rider.image, type: 'url' };
    
    return null;
  };

  // ✅ UPDATED: Download both Base64 and URL images
  const downloadImage = async (imageData, imageType, riderName) => {
    try {
      let blob;
      
      if (imageType === 'base64') {
        // Handle Base64 string
        const response = await fetch(imageData);
        blob = await response.blob();
      } else {
        // Handle regular URL
        const response = await fetch(imageData);
        blob = await response.blob();
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${riderName}-license.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('✅ License photo downloaded successfully!');
      
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('❌ Failed to download image');
    }
  };

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

  const showImagePreview = (imageData, riderName) => {
    setImagePreview({
      show: true,
      imageData: imageData,
      riderName: riderName
    });
  };

  const hideImagePreview = () => {
    setImagePreview({ show: false, imageData: '', riderName: '' });
  };

  // Calculate statistics
  const stats = {
    total: riders.length,
    approved: riders.filter(r => r.isApproved).length,
    pending: riders.filter(r => !r.isApproved).length,
    active: riders.filter(r => r.isActive).length,
    withLicense: riders.filter(r => getLicenseImageData(r)).length
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🚴 Rider Management</h2>
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-6">
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

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-indigo-600 truncate">With License</p>
              <p className="text-lg sm:text-xl font-bold text-indigo-800">
                {stats.withLicense}
              </p>
            </div>
            <FileText size={16} className="text-indigo-600 flex-shrink-0 ml-2" />
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
          riders.map((rider) => {
            const licenseData = getLicenseImageData(rider);
            
            return (
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

                {/* License Image Preview - Always Visible if available */}
                {licenseData && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">License Photo</p>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => showImagePreview(licenseData.data, rider.name)}
                      >
                        <img 
                          src={licenseData.data} 
                          alt={`${rider.name}'s license`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full bg-gray-100 hidden items-center justify-center">
                          <Image size={20} className="text-gray-400" />
                        </div>
                      </div>
                      <button
                        onClick={() => showImagePreview(licenseData.data, rider.name)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Full Size
                      </button>
                    </div>
                  </div>
                )}

                {/* No License Warning */}
                {!licenseData && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">License Photo</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <p className="text-xs text-yellow-800 flex items-center">
                        <AlertCircle size={12} className="mr-1" />
                        No license photo uploaded
                      </p>
                    </div>
                  </div>
                )}

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
                    
                    {/* License Image Actions in Expanded View */}
                    {licenseData && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">License Photo Actions</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => showImagePreview(licenseData.data, rider.name)}
                            className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Image size={12} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => downloadImage(licenseData.data, licenseData.type, rider.name)}
                            className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    )}
                    
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
            );
          })
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

      {/* License Image Preview Modal */}
      {imagePreview.show && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                License Photo - {imagePreview.riderName}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const imageType = imagePreview.imageData.startsWith('data:image/') ? 'base64' : 'url';
                    downloadImage(imagePreview.imageData, imageType, imagePreview.riderName);
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-1"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
                <button
                  onClick={hideImagePreview}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto flex items-center justify-center">
              <img 
                src={imagePreview.imageData} 
                alt={`${imagePreview.riderName}'s license`}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  document.getElementById('image-error').style.display = 'block';
                }}
              />
              <div id="image-error" className="hidden text-center py-8">
                <Image size={48} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Failed to load image</p>
                <p className="text-sm text-gray-400">The license photo may have been moved or deleted</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderTab;