// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

  // Check if user is logged in on app start - IMPROVED VERSION
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
            
            // Check if rider/restaurant is approved before setting user
            if ((userObj.role === 'rider' || userObj.role === 'restaurant') && !userObj.isApproved) {
              console.log('🚫 AuthContext - User not approved, logging out');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
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

  // Enhanced login function with better error handling
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
        // FIX: Use _id instead of id for MongoDB - COMPLETE FIX
        const userData = {
          _id: data.user._id, // MongoDB always uses _id
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved !== false, // Default to true if not specified
          vehicleType: data.user.vehicleType,
          licenseNumber: data.user.licenseNumber,
          phone: data.user.phone,
          address: data.user.address,
          location: data.user.location
        };
        
        console.log('✅ AuthContext - Login successful, user:', userData);
        console.log('✅ AuthContext - User ID (_id):', userData._id);
        console.log('✅ AuthContext - User Role:', userData.role);
        console.log('✅ AuthContext - Is Approved:', userData.isApproved);
        
        // CRITICAL FIX: Check if rider/restaurant is approved
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

  // Enhanced register function with complete user data
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
        
        // FIX: Use _id instead of id for MongoDB - COMPLETE FIX
        const userInfo = {
          _id: data.user._id, // MongoDB always uses _id
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isApproved: data.user.isApproved !== false, // Default to true if not specified
          vehicleType: data.user.vehicleType,
          licenseNumber: data.user.licenseNumber,
          phone: data.user.phone,
          address: data.user.address,
          location: data.user.location
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
        
        setUser(userInfo);
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
            vehicleType: data.user.vehicleType,
            licenseNumber: data.user.licenseNumber,
            phone: data.user.phone,
            address: data.user.address,
            location: data.user.location
          };
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('✅ AuthContext - User data refreshed from backend');
        }
      }
    } catch (error) {
      console.error('❌ AuthContext - Error refreshing user data:', error);
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
      
      // Utility functions
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

// Higher Order Component for protecting routes
export const withAuth = (Component) => {
  return function WithAuthComponent(props) {
    const { user, loading, authChecked } = useAuth();
    
    if (loading || !authChecked) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

// Higher Order Component for role-based protection
export const withRole = (roles) => (Component) => {
  return function WithRoleComponent(props) {
    const { user, isAuthenticated, hasRole } = useAuth();
    
    if (!isAuthenticated()) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">Please login to access this page.</p>
          </div>
        </div>
      );
    }
    
    const hasRequiredRole = Array.isArray(roles) 
      ? roles.some(role => hasRole(role))
      : hasRole(roles);
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
            <p className="text-gray-500 text-sm mt-2">Your role: {user?.role}</p>
            <p className="text-gray-500 text-sm">Required role: {Array.isArray(roles) ? roles.join(' or ') : roles}</p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};