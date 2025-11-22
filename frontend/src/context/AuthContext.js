// context/AuthContext.js - UPDATED VERSION
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Check if user is logged in on app start - IMPROVED FOR RESTAURANT OWNERS
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔄 AuthContext - Checking authentication status...');
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
            const userObj = JSON.parse(userData);
            
            // For restaurant owners, fetch their restaurant data
            if (userObj.role === 'restaurant') {
              try {
                const restaurantResponse = await fetch(`${API_URL}/restaurants/owner/${userObj._id}`);
                if (restaurantResponse.ok) {
                  const restaurantData = await restaurantResponse.json();
                  if (restaurantData.success && restaurantData.restaurant) {
                    userObj.restaurantId = restaurantData.restaurant._id;
                    console.log('🏪 Restaurant owner - Restaurant ID:', userObj.restaurantId);
                  }
                }
              } catch (error) {
                console.error('Error fetching restaurant data:', error);
              }
            }
            
            setUser(userObj);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (error) {
          console.error('❌ AuthContext - Auth verification failed:', error);
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

  // Enhanced login function for restaurant owners
  const login = async (email, password) => {
    setLoading(true);
    
    try {
      console.log('🔐 AuthContext - Attempting login for:', email);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('🔐 AuthContext - Login API Response:', data);

      if (response.ok && data.success) {
        const userData = {
          _id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved !== false,
          phone: data.user.phone,
          address: data.user.address
        };
        
        console.log('✅ AuthContext - Login successful, user:', userData);
        
        // For restaurant owners, fetch their restaurant ID
        if (userData.role === 'restaurant') {
          try {
            const restaurantResponse = await fetch(`${API_URL}/restaurants/owner/${userData._id}`);
            if (restaurantResponse.ok) {
              const restaurantData = await restaurantResponse.json();
              if (restaurantData.success && restaurantData.restaurant) {
                userData.restaurantId = restaurantData.restaurant._id;
                console.log('🏪 Restaurant owner - Restaurant ID:', userData.restaurantId);
              }
            }
          } catch (error) {
            console.error('Error fetching restaurant data during login:', error);
          }
        }
        
        if ((userData.role === 'rider' || userData.role === 'restaurant') && !userData.isApproved) {
          console.log('🚫 AuthContext - Rider/Restaurant not approved, blocking login');
          return { 
            success: false, 
            message: 'Your account is pending admin approval. Please wait for approval before logging in.' 
          };
        }
        
        setUser(userData);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { 
          success: true, 
          message: data.message || 'Login successful! 🎉', 
          user: userData 
        };
      } else {
        return { 
          success: false, 
          message: data.message || 'Login failed. Please check your credentials.' 
        };
      }
      
    } catch (error) {
      console.error('❌ AuthContext - Login error:', error);
      return { 
        success: false, 
        message: 'Network error. Please check your internet connection.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // ... (keep the rest of your AuthContext code the same)
  const register = async (userData) => {
    // ... your existing register function
  };

  const logout = () => {
    console.log('🚪 AuthContext - Logging out user:', user?.email);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const isApproved = () => {
    return user?.isApproved === true;
  };

  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          const userData = {
            _id: data.user._id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            isApproved: data.user.isApproved,
            phone: data.user.phone,
            address: data.user.address
          };
          
          // For restaurant owners, fetch restaurant ID
          if (userData.role === 'restaurant') {
            try {
              const restaurantResponse = await fetch(`${API_URL}/restaurants/owner/${userData._id}`);
              if (restaurantResponse.ok) {
                const restaurantData = await restaurantResponse.json();
                if (restaurantData.success && restaurantData.restaurant) {
                  userData.restaurantId = restaurantData.restaurant._id;
                }
              }
            } catch (error) {
              console.error('Error fetching restaurant data during refresh:', error);
            }
          }
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('❌ AuthContext - Error refreshing user data:', error);
    }
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  const getUserId = () => {
    return user?._id;
  };

  const getRestaurantId = () => {
    return user?.restaurantId;
  };

  const isAuthChecked = () => {
    return authChecked;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      authChecked,
      login, 
      register, 
      logout,
      refreshUser,
      updateUser,
      hasRole,
      isApproved,
      isAuthenticated,
      getUserId,
      getRestaurantId,
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