import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import CustomerDashboard from './components/customer/CustomerDashboard';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  // Role-based routing
  switch (user.role) {
    case 'customer':
      return <CustomerDashboard />;
    case 'restaurant':
      return <div className="p-6 text-center">
        <h1 className="text-3xl font-bold text-restaurant">Restaurant Owner Dashboard - Coming Soon</h1>
      </div>;
    case 'rider':
      return <div className="p-6 text-center">
        <h1 className="text-3xl font-bold text-rider">Rider Dashboard - Coming Soon</h1>
      </div>;
    case 'admin':
      return <div className="p-6 text-center">
        <h1 className="text-3xl font-bold text-admin">Admin Dashboard - Coming Soon</h1>
      </div>;
    default:
      return <Login />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;