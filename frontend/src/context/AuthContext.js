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
      // For now, just create a mock user without API call
      const mockUser = {
        id: 1,
        name: email.split('@')[0],
        email: email,
        role: role,
        isApproved: true
      };

      const mockToken = 'mock-jwt-token';
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔐 Login successful, setting user:', mockUser);
      setUser(mockUser);
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
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