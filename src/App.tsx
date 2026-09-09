import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlanProvider } from './context/PlanContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CropDetailPage from './pages/CropDetailPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import TrainingHubPage from './pages/TrainingHubPage';
import AdminPage from './pages/AdminPage';

// ─── Protected Route Guard ────────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-agri-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="AgriPiyasa" className="h-16 w-auto object-contain animate-pulse" />
          <p className="text-agri-subtext text-sm font-medium animate-pulse">Loading AgriPiyasa…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ─── Admin Route Guard ────────────────────────────────────────────────────────
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-agri-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="AgriPiyasa" className="h-16 w-auto object-contain animate-pulse" />
          <p className="text-agri-subtext text-sm font-medium animate-pulse">Loading AgriPiyasa…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (profile && profile.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// ─── Public-only Route Guard ──────────────────────────────────────────────────
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-agri-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="AgriPiyasa" className="h-16 w-auto object-contain animate-pulse" />
          <p className="text-agri-subtext text-sm font-medium animate-pulse">Loading AgriPiyasa…</p>
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
    <PlanProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Farmer flow routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/crop-detail" element={<ProtectedRoute><CropDetailPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
          <Route path="/training-hub" element={<ProtectedRoute><TrainingHubPage /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

          {/* Default: redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </PlanProvider>
  </AuthProvider>
);

export default App;