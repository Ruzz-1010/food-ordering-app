import React from 'react';

const CustomerDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-customer mb-6">Customer Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Restaurant List */}
          <div className="col-span-2">
            <h2 className="text-xl font-semibold mb-4">Restaurants</h2>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="border-b pb-3 mb-3">
                <h3 className="font-bold">McDonald's</h3>
                <p className="text-gray-600">Fast Food • 🍔 🍟</p>
                <button className="mt-2 bg-primary text-white px-4 py-1 rounded">
                  View Menu
                </button>
              </div>
              <div className="border-b pb-3 mb-3">
                <h3 className="font-bold">Jollibee</h3>
                <p className="text-gray-600">Filipino • 🍗 🍚</p>
                <button className="mt-2 bg-primary text-white px-4 py-1 rounded">
                  View Menu
                </button>
              </div>
            </div>
          </div>

          {/* Cart */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500">Cart is empty</p>
              <button className="w-full bg-customer text-white p-2 rounded mt-4">
                Checkout
              </button>
            </div>

            {/* Recent Orders */}
            <h2 className="text-xl font-semibold mt-6 mb-4">Recent Orders</h2>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="border-b pb-2 mb-2">
                <p className="font-semibold">Order #001</p>
                <p className="text-sm text-gray-600">McDonald's • ₱250</p>
                <p className="text-xs text-green-600">Delivered</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;