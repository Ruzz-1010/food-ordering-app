// App.js
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import RestaurantDashboard from './pages/dashboards/RestaurantDashboard';
import RiderDashboard from './pages/dashboards/RiderDashboard';
import './App.css';

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading FoodExpress...</p>
    </div>
  </div>
);

// Debug Component
const DebugAuth = () => {
  const { user, loading, authChecked } = useAuth();
  
  React.useEffect(() => {
    console.log('=== APP DEBUG INFO ===');
    console.log('🔄 Loading:', loading);
    console.log('✅ Auth Checked:', authChecked);
    console.log('👤 User:', user);
    console.log('👤 User _id:', user?._id);
    console.log('👤 User role:', user?.role);
    
    // Check localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    console.log('🔑 Token in localStorage:', token ? 'EXISTS' : 'MISSING');
    console.log('👤 User in localStorage:', userData ? 'EXISTS' : 'MISSING');
    
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        console.log('📝 Parsed user data:', parsed);
        console.log('🆔 Parsed user _id:', parsed._id);
      } catch (e) {
        console.log('❌ Cannot parse user data from localStorage');
      }
    }
    console.log('=======================');
  }, [user, loading, authChecked]);

  return null;
};

// Main App Component with Role-based Routing
const AppContent = () => {
  const { user, loading, authChecked } = useAuth();

  console.log('🎯 AppContent rendering - Loading:', loading, 'AuthChecked:', authChecked, 'User:', user);

  // Show loading spinner until auth check is complete
  if (loading || !authChecked) {
    console.log('⏳ AppContent - Still loading or auth not checked');
    return <LoadingSpinner />;
  }

  console.log('🚀 AppContent - Auth check complete, rendering dashboard');

  // Get the appropriate dashboard based on user role
  const getDashboardByRole = () => {
    // If no user is logged in, show customer dashboard (public view)
    if (!user) {
      console.log('👤 No user logged in, showing CustomerDashboard (public view)');
      return <CustomerDashboard />;
    }

    console.log('🎯 User logged in, role:', user.role);
    console.log('🆔 User ID:', user._id);
    console.log('📧 User email:', user.email);
    console.log('✅ User approved:', user.isApproved);
    
    switch (user.role) {
      case 'admin':
        console.log('👑 Rendering AdminDashboard');
        return <AdminDashboard />;
      
      case 'restaurant':
        console.log('🏪 Rendering RestaurantDashboard');
        // Check if restaurant is approved
        if (!user.isApproved) {
          console.log('⏳ Restaurant not approved, showing waiting message');
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">⏳</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
                <p className="text-gray-600 mb-4">
                  Your restaurant account is pending admin approval.
                </p>
                <p className="text-gray-500 text-sm">
                  You will be able to access the dashboard once your account is approved.
                </p>
              </div>
            </div>
          );
        }
        return <RestaurantDashboard />;
      
      case 'rider':
        console.log('🚴 Rendering RiderDashboard');
        // Check if rider is approved
        if (!user.isApproved) {
          console.log('⏳ Rider not approved, showing waiting message');
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">⏳</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
                <p className="text-gray-600 mb-4">
                  Your rider account is pending admin approval.
                </p>
                <p className="text-gray-500 text-sm">
                  You will be able to access the dashboard once your account is approved.
                </p>
              </div>
            </div>
          );
        }
        return <RiderDashboard />;
      
      case 'customer':
      default:
        console.log('👤 Rendering CustomerDashboard');
        return <CustomerDashboard />;
    }
  };

  return (
    <>
      <DebugAuth />
      {getDashboardByRole()}
    </>
  );
};

// Main App Wrapper
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;