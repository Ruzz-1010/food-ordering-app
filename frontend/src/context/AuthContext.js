import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Start with NO user
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TEMPORARILY: Force clear any existing user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    
    console.log('🔐 AuthContext - Starting FRESH with no user');
  }, []);

  const login = async (email, password, role) => {
    setLoading(true);
    console.log('🔐 Login attempt:', { email, role });
    
    try {
      // Use environment variable with fallback for local development
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      console.log('🔐 Login response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔐 Login successful:', data);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Login failed');
      }
      
    } catch (error) {
      console.log('🔐 Login error:', error.message);
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('🔐 Logging out user');
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