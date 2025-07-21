"use client";
import { createContext, useContext, useState, useEffect } from "react";
import apiService from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if apiService methods exist
      if (!apiService || typeof apiService.getToken !== "function") {
        throw new Error("API service not properly configured");
      }

      const token = apiService.getToken();

      if (token) {
        await getCurrentUser();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await apiService.getCurrentUser();

      if (response.success) {
        setUser(response.user);
        setError(null);
      } else {
        throw new Error(response.message || "Failed to get user");
      }
    } catch (error) {
      console.error("Failed to get current user:", error);

      // Handle authentication errors
      if (
        error.message.includes("Authentication failed") ||
        error.message.includes("Unauthorized") ||
        error.message.includes("Invalid token") ||
        error.message.includes("Token expired")
      ) {
        logout();
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.login(credentials);

      if (response.success && response.token) {
        apiService.setToken(response.token);

        // If user data is returned with login, use it
        if (response.user) {
          setUser(response.user);
          setLoading(false);
          return { success: true };
        } else {
          // Otherwise fetch user data
          const userResponse = await apiService.getCurrentUser();
          if (userResponse.success) {
            setUser(userResponse.user);
            setLoading(false);
            return { success: true };
          } else {
            logout();
            return {
              success: false,
              message:
                userResponse.message || "Failed to fetch user data after login",
            };
          }
        }
      } else {
        setLoading(false);
        return {
          success: false,
          message: response.message || "Login failed",
        };
      }
    } catch (error) {
      setLoading(false);
      setError(error.message);
      return {
        success: false,
        message: error.message || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.register(userData);

      if (response.success && response.token) {
        apiService.setToken(response.token);

        // If user data is returned with registration, use it
        if (response.user) {
          setUser(response.user);
          setLoading(false);
          return { success: true };
        } else {
          // Otherwise fetch user data
          const userResponse = await apiService.getCurrentUser();
          if (userResponse.success) {
            setUser(userResponse.user);
            setLoading(false);
            return { success: true };
          } else {
            logout();
            return {
              success: false,
              message:
                userResponse.message ||
                "Failed to fetch user data after registration",
            };
          }
        }
      } else {
        setLoading(false);
        return {
          success: false,
          message: response.message || "Registration failed",
        };
      }
    } catch (error) {
      setLoading(false);
      setError(error.message);
      return {
        success: false,
        message: error.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    apiService.removeToken();
    setUser(null);
    setError(null);
    setLoading(false);

    // Redirect to login page
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const refreshUser = async () => {
    await getCurrentUser();
  };

  // Role checking methods
  const isAdmin = () => user?.role === "admin";
  const isSubAdmin = () => user?.role === "subadmin";
  const isUser = () => user?.role === "user";
  const hasRole = (roles) => {
    if (!user?.role) return false;
    return Array.isArray(roles)
      ? roles.includes(user.role)
      : roles === user.role;
  };

  // Auth status checks
  const isAuthenticated = () => !!user && !!apiService.getToken();

  const value = {
    // State
    user,
    loading,
    error,

    // Actions
    login,
    register,
    logout,
    refreshUser,

    // Role checks
    isAdmin,
    isSubAdmin,
    isUser,
    hasRole,

    // Status checks
    isAuthenticated,

    // Clear error
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
