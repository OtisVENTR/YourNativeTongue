/**
 * Header Component
 * 
 * Top header with:
 * - Breadcrumbs
 * - Page title
 * - Profile dropdown
 * - Settings
 * - Usage/Credits tracker
 * - Theme toggle
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import './Header.css';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeaderProps {
  pageTitle: string;
  breadcrumbs?: Breadcrumb[];
}

// Icons
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Header({ pageTitle, breadcrumbs = [] }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Mock usage data - will be replaced with real data
  const usageData = {
    used: 45,
    total: 100,
    unit: 'minutes'
  };

  const usagePercentage = (usageData.used / usageData.total) * 100;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setProfileOpen(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="header">
      {/* Left: Breadcrumbs & Page Title */}
      <div className="header__left">
        {breadcrumbs.length > 0 && (
          <nav className="header__breadcrumbs" aria-label="Breadcrumb">
            <ol className="breadcrumbs__list">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="breadcrumbs__item">
                  {crumb.href ? (
                    <Link to={crumb.href} className="breadcrumbs__link">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="breadcrumbs__current">{crumb.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <span className="breadcrumbs__separator">/</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="header__title">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="header__right">
        {/* Usage Tracker */}
        <div className="header__usage" title={`${usageData.used} of ${usageData.total} ${usageData.unit} used`}>
          <div className="usage__info">
            <span className="usage__label">Usage</span>
            <span className="usage__value">{usageData.used}/{usageData.total} min</span>
          </div>
          <div className="usage__bar">
            <div 
              className="usage__bar-fill" 
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>

        {/* Theme Toggle */}
        <button 
          className="header__icon-btn" 
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Settings */}
        <Link to="/settings" className="header__icon-btn" aria-label="Settings" title="Settings">
          <SettingsIcon />
        </Link>

        {/* Profile Dropdown */}
        <div className="header__profile" ref={profileRef}>
          <button 
            className="profile__trigger"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            <div className="profile__avatar">
              {getUserInitials()}
            </div>
            <ChevronDownIcon />
          </button>

          {profileOpen && (
            <div className="profile__dropdown">
              <div className="profile__header">
                <div className="profile__avatar profile__avatar--large">
                  {getUserInitials()}
                </div>
                <div className="profile__info">
                  <span className="profile__email">{user?.email}</span>
                  <span className="profile__plan">Free Plan</span>
                </div>
              </div>
              <div className="profile__divider" />
              <Link to="/profile" className="profile__item" onClick={() => setProfileOpen(false)}>
                <UserIcon />
                <span>Profile</span>
              </Link>
              <Link to="/settings" className="profile__item" onClick={() => setProfileOpen(false)}>
                <SettingsIcon />
                <span>Settings</span>
              </Link>
              <div className="profile__divider" />
              <button className="profile__item profile__item--danger" onClick={handleSignOut}>
                <LogoutIcon />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

