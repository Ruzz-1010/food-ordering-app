// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Function to fetch restaurant data
  const fetchRestaurantData = async (userId, userEmail) => {
    try {
      console.log('🔍 Searching for restaurant data...');
      console.log('👤 User ID:', userId);
      console.log('📧 User Email:', userEmail);

      // Method 1: Try by owner ID
      const ownerResponse = await fetch(`${API_URL}/restaurants/owner/${userId}`);
      if (ownerResponse.ok) {
        const ownerData = await ownerResponse.json();
        if (ownerData.success && ownerData.restaurant) {
          console.log('✅ Restaurant found by owner ID:', ownerData.restaurant._id);
          return {
            restaurantId: ownerData.restaurant._id,
            restaurantData: ownerData.restaurant
          };
        }
      }

      // Method 2: Try by email
      const emailResponse = await fetch(`${API_URL}/restaurants/email/${userEmail}`);
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        if (emailData.success && emailData.restaurant) {
          console.log('✅ Restaurant found by email:', emailData.restaurant._id);
          return {
            restaurantId: emailData.restaurant._id,
            restaurantData: emailData.restaurant
          };
        }
      }

      console.log('❌ No restaurant found');
      return null;
    } catch (error) {
      console.error('❌ Error fetching restaurant data:', error);
      return null;
    }
  };

  // Check auth status - FIXED VERSION
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔄 AuthContext - Checking authentication status...');
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const userObj = JSON.parse(userData);
          console.log('👤 User from localStorage:', userObj);

          // Validate that user has required fields
          if (!userObj._id) {
            console.error('❌ Invalid user data: missing _id');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          } else {
            // For restaurant users, ensure we have restaurant data
            if (userObj.role === 'restaurant' && !userObj.restaurantId) {
              console.log('🏪 Restaurant user detected, fetching restaurant data...');
              const restaurantInfo = await fetchRestaurantData(userObj._id, userObj.email);
              
              if (restaurantInfo) {
                const updatedUser = {
                  ...userObj,
                  restaurantId: restaurantInfo.restaurantId,
                  restaurantData: restaurantInfo.restaurantData
                };
                console.log('✅ User updated with restaurant data');
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
              } else {
                console.log('❌ No restaurant data found');
                setUser(userObj);
              }
            } else {
              console.log('✅ User loaded from localStorage');
              setUser(userObj);
            }
          }
        } catch (error) {
          console.error('❌ Auth verification failed:', error);
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

  // Login function - FIXED VERSION
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
        // CRITICAL FIX: Ensure we have the user _id
        if (!data.user._id) {
          console.error('❌ Server returned user without _id');
          return { 
            success: false, 
            message: 'Server error: User ID missing' 
          };
        }

        const userData = {
          _id: data.user._id, // This must be present
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved !== false,
          phone: data.user.phone,
          address: data.user.address
        };
        
        console.log('✅ Login successful, user ID:', userData._id);
        
        // For restaurant owners, fetch restaurant data
        if (userData.role === 'restaurant') {
          console.log('🏪 Fetching restaurant data for restaurant owner...');
          const restaurantInfo = await fetchRestaurantData(userData._id, userData.email);
          
          if (restaurantInfo) {
            userData.restaurantId = restaurantInfo.restaurantId;
            userData.restaurantData = restaurantInfo.restaurantData;
            console.log('✅ Restaurant data added to user');
          }
        }
        
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
          message: data.message || 'Login failed.' 
        };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        message: 'Network error.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Register function
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
        if (!data.user._id) {
          console.error('❌ Server returned user without _id');
          return { 
            success: false, 
            message: 'Server error: User ID missing' 
          };
        }

        const userInfo = {
          _id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved !== false,
          phone: data.user.phone,
          address: data.user.address
        };
        
        if ((userInfo.role === 'rider' || userInfo.role === 'restaurant') && !userInfo.isApproved) {
          return { 
            success: true, 
            message: 'Registration successful! Your account is pending approval.', 
            user: userInfo,
            needsApproval: true
          };
        }
        
        // For restaurant owners, fetch restaurant data
        if (userInfo.role === 'restaurant') {
          const restaurantInfo = await fetchRestaurantData(userInfo._id, userInfo.email);
          if (restaurantInfo) {
            userInfo.restaurantId = restaurantInfo.restaurantId;
            userInfo.restaurantData = restaurantInfo.restaurantData;
          }
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
  };

  // Update user function
  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  // Utility functions
  const hasRole = (role) => user?.role === role;
  const isApproved = () => user?.isApproved === true;
  const isAuthenticated = () => !!user && !!localStorage.getItem('token');
  const getUserId = () => user?._id;
  const getRestaurantId = () => user?.restaurantId;
  const getRestaurantData = () => user?.restaurantData;
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
      getRestaurantId,
      getRestaurantData,
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