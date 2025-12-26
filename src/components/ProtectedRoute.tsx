/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication.
 * Redirects to /login if user is not authenticated.
 * Redirects to /org-setup if user has no organization.
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, organization, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        fontFamily: 'var(--font-family-body, Inter, sans-serif)'
      }}>
        Loading...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If logged in but no organization, redirect to setup
  if (!organization) {
    return <Navigate to="/org-setup" replace />;
  }

  // Render protected content if authenticated and has organization
  return <>{children}</>;
}

