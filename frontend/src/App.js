"use client";

import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext"; // Import ThemeProvider
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import SubAdminDashboard from "./components/SubAdminDashboard";
import Login from "./components/Login";
import Register from "./components/Register";
import ErrorNotification from "./components/ErrorNotification";

const AppContent = () => {
  const { user, loading, isAdmin, isSubAdmin, isUser } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading TaskFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {isLoginMode ? (
          <Login onToggleMode={() => setIsLoginMode(false)} />
        ) : (
          <Register onToggleMode={() => setIsLoginMode(true)} />
        )}
      </>
    );
  }

  // Role-based dashboard routing
  const renderDashboard = () => {
    if (isAdmin()) {
      return <AdminDashboard />;
    } else if (isSubAdmin()) {
      return <SubAdminDashboard />;
    } else if (isUser()) {
      return <Dashboard />;
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600">
              Your role is not recognized. Please contact an administrator.
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      {renderDashboard()}
      {error && (
        <ErrorNotification message={error} onClose={() => setError(null)} />
      )}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        {" "}
        {/* Wrap AppContent with ThemeProvider */}
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
