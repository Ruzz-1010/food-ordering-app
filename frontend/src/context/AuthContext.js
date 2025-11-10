import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // ALWAYS start with no user
  useEffect(() => {
    setUser(null);
  }, []);

  const login = async (email, password, role) => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ALWAYS SUCCESS - mock data
    const mockUser = {
      id: 1,
      name: email.split('@')[0],
      email: email,
      role: role,
      isApproved: true
    };

    setUser(mockUser);
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);