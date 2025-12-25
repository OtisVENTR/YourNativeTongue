/**
 * Profile Page Component
 * 
 * Page for user profile.
 * Placeholder for now - will be implemented later.
 */

import { AppLayout } from '../components/layout';
import { useAuth } from '../hooks/useAuth';
import './PlaceholderPage.css';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <AppLayout 
      pageTitle="Profile" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Profile' }
      ]}
    >
      <div className="placeholder-page">
        <div className="placeholder-page__avatar">
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <h2 className="placeholder-page__title">{user?.email || 'User'}</h2>
        <p className="placeholder-page__desc">
          Manage your profile and account details. This page will be implemented later.
        </p>
        <button className="btn btn--primary btn--disabled" disabled>
          Coming Soon
        </button>
      </div>
    </AppLayout>
  );
}

