// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          // Verify token is still valid with backend
          const response = await fetch(`${API_URL}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            setUser(JSON.parse(userData));
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

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
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved,
          vehicleType: data.user.vehicleType,
          licenseNumber: data.user.licenseNumber
        };
        
        console.log('✅ Login successful, user:', userData);
        
        setUser(userData);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { 
          success: true, 
          message: data.message || 'Login successful! 🎉', 
          user: userData 
        };
      } else {
        console.log('❌ Login failed:', data.message);
        return { 
          success: false, 
          message: data.message || 'Login failed. Please check your credentials.' 
        };
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        message: 'Network error: ' + error.message 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    
    try {
      console.log('📝 REGISTERING USER DATA:', userData);
      console.log('🔗 Sending to:', `${API_URL}/auth/register`);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('📡 Registration response status:', response.status);
      
      const data = await response.json();
      console.log('📝 Register API Response:', data);

      if (response.ok && data.success) {
        console.log('✅ Registration successful! User data:', data.user);
        
        // Store user data immediately after successful registration
        const userInfo = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved,
          vehicleType: data.user.vehicleType,
          licenseNumber: data.user.licenseNumber
        };
        
        console.log('💾 Storing user in context and localStorage:', userInfo);
        
        setUser(userInfo);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        return { 
          success: true, 
          message: data.message || 'Registration successful! 🎉', 
          user: userInfo 
        };
      } else {
        console.log('❌ Registration failed:', data.message);
        return { 
          success: false, 
          message: data.message || 'Registration failed. Please try again.' 
        };
      }
      
    } catch (error) {
      console.error('❌ Registration network error:', error);
      return { 
        success: false, 
        message: 'Network error: ' + error.message 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user:', user?.email);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to home page after logout
    window.location.href = '/';
  };

  // Function to check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Function to check if user is approved
  const isApproved = () => {
    return user?.isApproved === true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      loading,
      hasRole,
      isApproved
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