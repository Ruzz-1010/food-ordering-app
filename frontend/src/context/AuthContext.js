// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // ✅ FIXED – no trailing space
  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Function to fetch restaurant data
  const fetchRestaurantData = async (userId, userEmail) => {
    try {
      console.log('🔍 Searching for restaurant data...');
      console.log('👤 User ID:', userId);
      console.log('📧 User Email:', userEmail);

      // Method 1: Try by owner ID
      console.log('🔄 Method 1: Searching by owner ID...');
      const ownerResponse = await fetch(`${API_URL}/restaurants/owner/${userId}`);
      if (ownerResponse.ok) {
        const ownerData = await ownerResponse.json();
        console.log('📊 Owner API Response:', ownerData);
        
        if (ownerData.success && ownerData.restaurant) {
          console.log('✅ Restaurant found by owner ID:', ownerData.restaurant._id);
          return {
            restaurantId: ownerData.restaurant._id,
            restaurantData: ownerData.restaurant
          };
        }
      }

      // Method 2: Try by email
      console.log('🔄 Method 2: Searching by email...');
      const emailResponse = await fetch(`${API_URL}/restaurants/email/${userEmail}`);
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        console.log('📊 Email API Response:', emailData);
        
        if (emailData.success && emailData.restaurant) {
          console.log('✅ Restaurant found by email:', emailData.restaurant._id);
          return {
            restaurantId: emailData.restaurant._id,
            restaurantData: emailData.restaurant
          };
        }
      }

      // Method 3: Get all restaurants and find by owner or email
      console.log('🔄 Method 3: Searching in all restaurants...');
      const allResponse = await fetch(`${API_URL}/restaurants`);
      if (allResponse.ok) {
        const allData = await allResponse.json();
        console.log('📊 All restaurants count:', allData.restaurants?.length);
        
        if (allData.success && allData.restaurants) {
          // Find by owner
          const byOwner = allData.restaurants.find(r => r.owner === userId || r.owner?._id === userId);
          if (byOwner) {
            console.log('✅ Restaurant found in all list by owner:', byOwner._id);
            return {
              restaurantId: byOwner._id,
              restaurantData: byOwner
            };
          }

          // Find by email
          const byEmail = allData.restaurants.find(r => r.email === userEmail);
          if (byEmail) {
            console.log('✅ Restaurant found in all list by email:', byEmail._id);
            return {
              restaurantId: byEmail._id,
              restaurantData: byEmail
            };
          }
        }
      }

      console.log('❌ No restaurant found through any method');
      return null;
    } catch (error) {
      console.error('❌ Error fetching restaurant data:', error);
      return null;
    }
  };

  // EMERGENCY SYNC FUNCTION
  const emergencySyncApproval = async (email) => {
    try {
      console.log('🔄 Emergency sync for:', email);
      const response = await fetch(`${API_URL}/auth/sync-restaurant-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      console.log('🔄 Sync response:', data);
      return data;
    } catch (error) {
      console.error('❌ Emergency sync error:', error);
      return { success: false, message: 'Sync failed' };
    }
  };

  // Check auth status
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔄 AuthContext - Checking authentication status...');
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const userObj = JSON.parse(userData);
          console.log('👤 User from localStorage:', userObj);

          // For restaurant users, ensure we have restaurant data
          if (userObj.role === 'restaurant' && userObj._id && !userObj.restaurantId) {
            console.log('🏪 Restaurant user detected, fetching restaurant data...');
            const restaurantInfo = await fetchRestaurantData(userObj._id, userObj.email);
            
            if (restaurantInfo) {
              const updatedUser = {
                ...userObj,
                restaurantId: restaurantInfo.restaurantId,
                restaurantData: restaurantInfo.restaurantData
              };
              console.log('✅ User updated with restaurant data:', updatedUser);
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
              console.log('❌ No restaurant data found, setting user without restaurant');
              setUser(userObj);
            }
          } else {
            console.log('✅ User loaded from localStorage:', userObj);
            setUser(userObj);
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

  // Login function - UPDATED WITH SYNC
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
          _id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved !== false,
          phone: data.user.phone,
          address: data.user.address
        };
        
        console.log('✅ Login successful, user:', userData);
        
        // For restaurant owners, fetch restaurant data
        if (userData.role === 'restaurant') {
          console.log('🏪 Fetching restaurant data for restaurant owner...');
          const restaurantInfo = await fetchRestaurantData(userData._id, userData.email);
          
          if (restaurantInfo) {
            userData.restaurantId = restaurantInfo.restaurantId;
            userData.restaurantData = restaurantInfo.restaurantData;
            console.log('✅ Restaurant data added to user:', userData.restaurantId);
          } else {
            console.log('❌ No restaurant data found for this user');
          }
        }
        
        // Emergency sync if restaurant user is not approved but should be
        if (userData.role === 'restaurant' && !userData.isApproved) {
          console.log('🔄 Restaurant user not approved, attempting emergency sync...');
          const syncResult = await emergencySyncApproval(userData.email);
          if (syncResult.success && syncResult.updated) {
            userData.isApproved = true;
            console.log('✅ User approved via emergency sync');
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

  // Register function - FIXED VERSION
const register = async (userData) => {
  setLoading(true);
  
  try {
    console.log('📝 Sending registration data:', userData);
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    console.log('📝 Registration response status:', response.status);
    
    const data = await response.json();
    console.log('📝 Registration API Response:', data);

    if (response.ok && data.success) {
      const userInfo = {
        _id: data.user.id || data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        isApproved: data.user.isApproved !== false,
        phone: data.user.phone,
        address: data.user.address
      };
      
      console.log('✅ Registration successful, user:', userInfo);
      
      if ((userInfo.role === 'rider' || userInfo.role === 'restaurant') && !userInfo.isApproved) {
        return { 
          success: true, 
          message: data.message || 'Registration successful! Your account is pending approval.', 
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
        message: data.message || 'Registration successful! 🎉', 
        user: userInfo 
      };
    } else {
      console.log('❌ Registration failed:', data.message);
      return { 
        success: false, 
        message: data.message || 'Registration failed.' 
      };
    }
  } catch (error) {
    console.error('❌ Registration network error:', error);
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
    console.log('🚪 Logging out user');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Update user function
  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  // Refresh user data
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
          
          if (userData.role === 'restaurant') {
            const restaurantInfo = await fetchRestaurantData(userData._id, userData.email);
            if (restaurantInfo) {
              userData.restaurantId = restaurantInfo.restaurantId;
              userData.restaurantData = restaurantInfo.restaurantData;
            }
          }
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  };

  // Refresh restaurant data
  const refreshRestaurantData = async () => {
    if (user?.role === 'restaurant' && user?._id) {
      const restaurantInfo = await fetchRestaurantData(user._id, user.email);
      if (restaurantInfo) {
        const updatedUser = {
          ...user,
          restaurantId: restaurantInfo.restaurantId,
          restaurantData: restaurantInfo.restaurantData
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };

  // Emergency sync function
  const syncRestaurantApproval = async (email) => {
    return await emergencySyncApproval(email);
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
      refreshUser,
      updateUser,
      refreshRestaurantData,
      syncRestaurantApproval,
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