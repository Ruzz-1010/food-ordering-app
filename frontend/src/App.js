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
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Main App Component with Role-based Routing
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Get the appropriate dashboard based on user role
  const getDashboardByRole = () => {
    // If no user is logged in, show customer dashboard (public view)
    if (!user) {
      return <CustomerDashboard />;
    }

    console.log('🔄 User role detected:', user.role);
    console.log('👤 User data:', user);
    
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      
      case 'restaurant':
        return <RestaurantDashboard />;
      
      case 'rider':
        return <RiderDashboard />;
      
      case 'customer':
      default:
        return <CustomerDashboard />;
    }
  };

  return getDashboardByRole();
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