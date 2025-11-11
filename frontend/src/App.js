// App.js
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CustomerDashboard />
    </AuthProvider>
  );
}

export default App;