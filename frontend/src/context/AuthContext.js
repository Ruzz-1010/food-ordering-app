// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Check auth status - SIMPLIFIED AND FIXED
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔄 AuthContext - Checking authentication status...');
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const userObj = JSON.parse(userData);
          console.log('👤 User loaded from localStorage:', userObj);
          
          // Validate user data
          if (userObj && userObj._id) {
            setUser(userObj);
          } else {
            console.error('❌ Invalid user data in localStorage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log('🔍 No token or user data found');
        setUser(null);
      }
      
      setLoading(false);
      setAuthChecked(true);
    };

    checkAuthStatus();
  }, []);

  // Login function - SIMPLIFIED AND FIXED
  const login = async (email, password) => {
    setLoading(true);
    
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('🔐 Login API Response:', data);

      if (response.ok && data.success) {
        // VALIDATE CRITICAL FIELDS
        if (!data.user || !data.user._id) {
          console.error('❌ Server returned invalid user data');
          return { 
            success: false, 
            message: 'Server error: Invalid user data received' 
          };
        }

        const userData = {
          _id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved !== false,
          phone: data.user.phone || '',
          address: data.user.address || ''
        };
        
        console.log('✅ Login successful, user ID:', userData._id);
        
        // Check approval for riders and restaurants
        if ((userData.role === 'rider' || userData.role === 'restaurant') && !userData.isApproved) {
          console.log('🚫 Account not approved');
          return { 
            success: false, 
            message: 'Your account is pending admin approval.' 
          };
        }
        
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
          message: data.message || 'Login failed. Please check your credentials.' 
        };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        message: 'Network error. Please check your connection.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Register function - SIMPLIFIED
  const register = async (userData) => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();

      if (response.ok && data.success) {
        if (!data.user || !data.user._id) {
          return { 
            success: false, 
            message: 'Server error: Invalid user data received' 
          };
        }

        const userInfo = {
          _id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved !== false,
          phone: data.user.phone || '',
          address: data.user.address || ''
        };
        
        // For riders and restaurants, check if approved
        if ((userInfo.role === 'rider' || userInfo.role === 'restaurant') && !userInfo.isApproved) {
          return { 
            success: true, 
            message: 'Registration successful! Your account is pending approval.', 
            user: userInfo,
            needsApproval: true
          };
        }
        
        setUser(userInfo);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        return { 
          success: true, 
          message: 'Registration successful! 🎉', 
          user: userInfo 
        };
      } else {
        return { 
          success: false, 
          message: data.message || 'Registration failed.' 
        };
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { 
        success: false, 
        message: 'Network error.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    console.log('🚪 Logging out user');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Optional: redirect to home page
    window.location.href = '/';
  };

  // Update user function
  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  // Simple utility functions
  const hasRole = (role) => user?.role === role;
  const isApproved = () => user?.isApproved === true;
  const isAuthenticated = () => !!user && !!localStorage.getItem('token');
  const getUserId = () => user?._id;
  const isAuthChecked = () => authChecked;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      authChecked,
      login, 
      register, 
      logout,
      updateUser,
      hasRole,
      isApproved,
      isAuthenticated,
      getUserId,
      isAuthChecked
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