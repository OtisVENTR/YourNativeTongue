/**
 * Profile Page Component
 * 
 * Page for managing user profile information.
 * Allows users to update their full name and organization.
 */

import { useState, FormEvent, useEffect } from 'react';
import { AppLayout } from '../components/layout';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, organization: userOrganization, role } = useAuth();
  const { profile, loading: profileLoading, error: profileError, updateProfile } = useUserProfile(user?.id);
  
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Initialize form fields when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);

    try {
      const { error } = await updateProfile({
        full_name: fullName.trim() || null,
      });

      if (error) {
        setSubmitError(error.message);
        return;
      }

      setSubmitSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return profile.full_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const displayName = profile?.full_name || user?.email || 'User';

  if (profileLoading) {
    return (
      <AppLayout 
        pageTitle="Profile" 
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Profile' }
        ]}
      >
        <div className="profile-page">
          <div className="profile-loading">Loading profile...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      pageTitle="Profile" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Profile' }
      ]}
    >
      <div className="profile-page">
        <div className="profile-header">
          <div className="profile-avatar">
            {getUserInitials()}
          </div>
          <div className="profile-header-info">
            <h2 className="profile-display-name">{displayName}</h2>
            <p className="profile-email">{user?.email}</p>
            {profile?.plan_type && (
              <span className="profile-plan-badge">{profile.plan_type}</span>
            )}
          </div>
        </div>

        <div className="profile-content">
          {profileError && (
            <div className="profile-error" role="alert">
              {profileError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
            {submitError && (
              <div className="form-error" role="alert">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="form-success" role="alert">
                Profile updated successfully!
              </div>
            )}

            <div className="form-section">
              <h3 className="form-section-title">Personal Information</h3>
              
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
                <p className="form-hint">This name will be displayed in your profile</p>
              </div>

              <div className="form-group">
                <label htmlFor="organizationName" className="form-label">
                  Church Organization
                </label>
                <input
                  id="organizationName"
                  type="text"
                  value={userOrganization?.name || 'No organization'}
                  className="form-input form-input--readonly"
                  disabled
                  readOnly
                />
                <p className="form-hint">
                  {userOrganization 
                    ? `Your role: ${role || 'member'}` 
                    : 'You are not a member of any organization. Go to Settings to join or create one.'}
                </p>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Account Information</h3>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  className="form-input form-input--readonly"
                  disabled
                  readOnly
                />
                <p className="form-hint">Email cannot be changed here. Contact support to change your email.</p>
              </div>

              <div className="form-group">
                <label htmlFor="planType" className="form-label">
                  Plan Type
                </label>
                <input
                  id="planType"
                  type="text"
                  value={profile?.plan_type || 'Free'}
                  className="form-input form-input--readonly"
                  disabled
                  readOnly
                />
                <p className="form-hint">Your current subscription plan</p>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
