// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Check if user is logged in on app start - FIXED VERSION
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔄 AuthContext - Checking authentication status...');
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('🔍 AuthContext - Token exists:', !!token);
      console.log('🔍 AuthContext - User data exists:', !!userData);
      
      if (token && userData) {
        try {
          console.log('🔐 AuthContext - Verifying token with backend...');
          
          // Verify token is still valid with backend
          const response = await fetch(`${API_URL}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('🔐 AuthContext - Verification response status:', response.status);
          
          if (response.ok) {
            const userObj = JSON.parse(userData);
            console.log('✅ AuthContext - Token valid, user loaded:', userObj);
            console.log('✅ AuthContext - User ID (_id):', userObj._id);
            console.log('✅ AuthContext - User Role:', userObj.role);
            
            // For restaurant owners, ensure restaurantId is set
            if (userObj.role === 'restaurant' && userObj._id && !userObj.restaurantId) {
              await fetchRestaurantForUser(userObj);
            } else {
              setUser(userObj);
            }
          } else {
            // Token is invalid, clear storage
            console.log('❌ AuthContext - Token invalid, clearing storage');
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
        console.log('🔍 AuthContext - No token or user data found in localStorage');
        setUser(null);
      }
      
      setLoading(false);
      setAuthChecked(true);
      console.log('✅ AuthContext - Authentication check completed');
    };

    checkAuthStatus();
  }, []);

  // Helper function to fetch restaurant data
  const fetchRestaurantForUser = async (userObj) => {
    try {
      console.log('🏪 Fetching restaurant for user:', userObj._id);
      const restaurantResponse = await fetch(`${API_URL}/restaurants/owner/${userObj._id}`);
      
      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json();
        if (restaurantData.success && restaurantData.restaurant) {
          const updatedUser = {
            ...userObj,
            restaurantId: restaurantData.restaurant._id
          };
          console.log('✅ Restaurant found:', restaurantData.restaurant._id);
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          console.log('❌ No restaurant found for user');
          setUser(userObj);
        }
      } else {
        console.log('❌ Restaurant fetch failed');
        setUser(userObj);
      }
    } catch (error) {
      console.error('❌ Error fetching restaurant:', error);
      setUser(userObj);
    }
  };

  // Enhanced login function - FIXED VERSION
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
        // ✅ CRITICAL FIX: Ensure _id is properly set
        const userData = {
          _id: data.user._id, // MongoDB always uses _id
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved !== false,
          phone: data.user.phone,
          address: data.user.address
        };
        
        console.log('✅ AuthContext - Login successful, user:', userData);
        console.log('🆔 User ID after login:', userData._id);
        
        // CRITICAL FIX: Check if rider/restaurant is approved
        if ((userData.role === 'rider' || userData.role === 'restaurant') && !userData.isApproved) {
          console.log('🚫 AuthContext - Rider/Restaurant not approved, blocking login');
          return { 
            success: false, 
            message: 'Your account is pending admin approval. Please wait for approval before logging in.' 
          };
        }
        
        // For restaurant owners, fetch restaurant data
        if (userData.role === 'restaurant') {
          await fetchRestaurantForUser(userData);
        } else {
          setUser(userData);
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('💾 AuthContext - User saved to localStorage');
        
        return { 
          success: true, 
          message: data.message || 'Login successful! 🎉', 
          user: userData 
        };
      } else {
        console.log('❌ AuthContext - Login failed:', data.message);
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

  // Enhanced register function
  const register = async (userData) => {
    setLoading(true);
    
    try {
      console.log('📝 AuthContext - REGISTERING USER DATA:', userData);
      console.log('🔗 AuthContext - Sending to:', `${API_URL}/auth/register`);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('📡 AuthContext - Registration response status:', response.status);
      
      const data = await response.json();
      console.log('📝 AuthContext - Register API Response:', data);

      if (response.ok && data.success) {
        console.log('✅ AuthContext - Registration successful! User data:', data.user);
        
        const userInfo = {
          _id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved !== false,
          phone: data.user.phone,
          address: data.user.address
        };
        
        console.log('✅ AuthContext - User ID after registration:', userInfo._id);
        console.log('✅ AuthContext - User Role:', userInfo.role);
        console.log('✅ AuthContext - Is Approved:', userInfo.isApproved);
        
        // CRITICAL FIX: Don't auto-login if rider/restaurant needs approval
        if ((userInfo.role === 'rider' || userInfo.role === 'restaurant') && !userInfo.isApproved) {
          console.log('🚫 AuthContext - Rider/Restaurant registered but needs approval - not auto-logging in');
          return { 
            success: true, 
            message: 'Registration successful! Your account is pending admin approval. You will be notified once approved.', 
            user: userInfo,
            needsApproval: true
          };
        }
        
        console.log('💾 AuthContext - Auto-logging in approved user:', userInfo);
        
        // For restaurant owners, fetch restaurant data
        if (userInfo.role === 'restaurant') {
          await fetchRestaurantForUser(userInfo);
        } else {
          setUser(userInfo);
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        return { 
          success: true, 
          message: data.message || 'Registration successful! 🎉', 
          user: userInfo 
        };
      } else {
        console.log('❌ AuthContext - Registration failed:', data.message);
        return { 
          success: false, 
          message: data.message || 'Registration failed. Please try again.' 
        };
      }
      
    } catch (error) {
      console.error('❌ AuthContext - Registration network error:', error);
      return { 
        success: false, 
        message: 'Network error. Please check your internet connection.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logout function
  const logout = () => {
    console.log('🚪 AuthContext - Logging out user:', user?.email);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('✅ AuthContext - Logout completed, redirecting to home...');
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

  // Function to update user data
  const updateUser = (updatedUserData) => {
    console.log('🔄 AuthContext - Updating user data:', updatedUserData);
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    // Also update localStorage
    localStorage.setItem('user', JSON.stringify(newUserData));
    console.log('✅ AuthContext - User data updated');
  };

  // Function to refresh user data from backend
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      console.log('🔄 AuthContext - Refreshing user data from backend...');
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
          
          // For restaurant owners, fetch restaurant data
          if (userData.role === 'restaurant') {
            await fetchRestaurantForUser(userData);
          } else {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
          console.log('✅ AuthContext - User data refreshed from backend');
        }
      }
    } catch (error) {
      console.error('❌ AuthContext - Error refreshing user data:', error);
    }
  };

  // Function to refresh restaurant data
  const refreshRestaurantData = async () => {
    if (user?.role === 'restaurant' && user?._id) {
      await fetchRestaurantForUser(user);
    }
  };

  // Function to check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  // Function to get user ID safely
  const getUserId = () => {
    return user?._id;
  };

  // Function to get restaurant ID safely
  const getRestaurantId = () => {
    return user?.restaurantId;
  };

  // Function to check if auth check is complete
  const isAuthChecked = () => {
    return authChecked;
  };

  return (
    <AuthContext.Provider value={{ 
      // State
      user, 
      loading,
      authChecked,
      
      // Auth actions
      login, 
      register, 
      logout,
      refreshUser,
      updateUser,
      refreshRestaurantData,
      
      // Utility functions
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