import React, { useEffect } from 'react'; // DAGDAGAN NG useEffect
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import CustomerDashboard from './components/customer/CustomerDashboard';

function AppContent() {
  const { user } = useAuth();

  // Test backend connection on app start
  useEffect(() => {
    const testConnection = async () => {
      try {
        const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';
        const response = await fetch(`${API_URL}/auth/test`);
        const data = await response.json();
        console.log('✅ Backend connection test:', data);
      } catch (error) {
        console.log('❌ Backend connection failed:', error.message);
      }
    };
    
    testConnection();
  }, []);

  if (!user) {
    return <Login />;
  }

  // Role-based routing
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