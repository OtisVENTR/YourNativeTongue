/**
 * App Root Component
 * 
 * Main application component with routing configuration.
 * Handles protected routes and authentication flow.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OrganizationSetupPage from './pages/OrganizationSetupPage';
import DashboardPage from './pages/DashboardPage';
import SpeakersPage from './pages/SpeakersPage';
import UploadPage from './pages/UploadPage';
import JobsPage from './pages/JobsPage';
import GlossaryPage from './pages/GlossaryPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import TeamSettingsPage from './pages/TeamSettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/org-setup" element={<OrganizationSetupPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/speakers"
          element={
            <ProtectedRoute>
              <SpeakersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <JobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/glossary"
          element={
            <ProtectedRoute>
              <GlossaryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
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
        <Route
          path="/settings/team"
          element={
            <ProtectedRoute>
              <TeamSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect - ProtectedRoute will handle auth check */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 fallback - ProtectedRoute will handle auth check */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
