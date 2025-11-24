import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Check auth status
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const userObj = JSON.parse(userData);
          setUser(userObj);
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
      setAuthChecked(true);
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = {
          _id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved,
          phone: data.user.phone,
          address: data.user.address
        };
        
        setUser(userData);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { 
          success: true, 
          message: 'Login successful! 🎉', 
          user: userData 
        };
      } else {
        return { 
          success: false, 
          message: data.message || 'Login failed.' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Network error.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Register function - SIMPLE VERSION
  const register = async (userData) => {
    setLoading(true);
    
    try {
      console.log('📝 Sending registration:', userData);
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      console.log('📝 Registration response:', data);

      if (response.ok && data.success) {
        const userInfo = {
          _id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved,
          phone: data.user.phone,
          address: data.user.address
        };
        
        setUser(userInfo);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        return { 
          success: true, 
          message: data.message || 'Registration successful! 🎉', 
          user: userInfo 
        };
      } else {
        return { 
          success: false, 
          message: data.message || 'Registration failed.' 
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: 'Network error during registration.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Update user function
  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      authChecked,
      login, 
      register, 
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};