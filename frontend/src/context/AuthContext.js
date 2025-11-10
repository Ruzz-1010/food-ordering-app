import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password, role) => {
    setLoading(true);
    
    try {
      // DIRECT URL - WALANG ENV VARIABLE
      const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';
      
      console.log('🔐 Sending login to backend...');
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      console.log('🔐 Response status:', response.status);
      
      const data = await response.json();
      console.log('🔐 Response data:', data);
      
      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('✅ LOGIN SUCCESS!');
      } else {
        alert(data.message || 'Login failed');
      }
      
    } catch (error) {
      console.log('❌ Login error:', error);
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);