import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import CustomerDashboard from './components/customer/CustomerDashboard';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  switch (user.role) {
    case 'customer':
      return <CustomerDashboard />;
    case 'restaurant':
      return <div className="p-6 text-center">
        <h1 className="text-3xl font-bold text-green-600">Restaurant Owner Dashboard</h1>
        <p>Welcome, {user.name}!</p>
      </div>;
    case 'rider':
      return <div className="p-6 text-center">
        <h1 className="text-3xl font-bold text-yellow-600">Rider Dashboard</h1>
        <p>Welcome, {user.name}!</p>
      </div>;
    case 'admin':
      return <div className="p-6 text-center">
        <h1 className="text-3xl font-bold text-blue-600">Admin Dashboard</h1>
        <p>Welcome, {user.name}!</p>
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