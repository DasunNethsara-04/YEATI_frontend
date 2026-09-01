import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AuthCallbackPage from './pages/AuthCallbackPage';

// ─── Protected Route Guard ────────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-agri-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-agri-dark flex items-center justify-center animate-pulse">
            <svg className="h-7 w-7 text-agri-lime" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21c-.19.41.39.81.74.53l1.1-.87C7 19.5 8.5 19 10 19c4 0 5-2.5 8-2.5s4 2.5 7 2.5c.55 0 1-.45 1-1 0-4.5-5-10-9-10z" />
            </svg>
          </div>
          <p className="text-agri-subtext text-sm font-medium animate-pulse">Loading YEATI…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.email_confirmed_at) return <Navigate to="/login" state={{ unconfirmed: true }} replace />;
  return <>{children}</>;
};

// ─── Public-only Route Guard (redirect to dashboard if already logged in) ─────
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-agri-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-agri-dark flex items-center justify-center animate-pulse">
            <svg className="h-7 w-7 text-agri-lime" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21c-.19.41.39.81.74.53l1.1-.87C7 19.5 8.5 19 10 19c4 0 5-2.5 8-2.5s4 2.5 7 2.5c.55 0 1-.45 1-1 0-4.5-5-10-9-10z" />
            </svg>
          </div>
          <p className="text-agri-subtext text-sm font-medium animate-pulse">Loading YEATI…</p>
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// ─── Root App ─────────────────────────────────────────────────────────────────
import React from 'react';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        {/* Default: redirect to dashboard (will bounce to login if not authed) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;