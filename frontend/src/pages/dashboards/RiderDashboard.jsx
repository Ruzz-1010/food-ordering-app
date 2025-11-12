import React from 'react';

const RiderDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏍️ Rider Dashboard</h1>
          <p className="text-gray-600 mb-6">Manage your deliveries and earnings</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Active Deliveries</h3>
              <p className="text-2xl font-bold text-blue-700">3</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Today's Earnings</h3>
              <p className="text-2xl font-bold text-green-700">₱850</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Completed Today</h3>
              <p className="text-2xl font-bold text-purple-700">8</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              🚧 <strong>Rider Dashboard Under Development</strong> - Full features coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;