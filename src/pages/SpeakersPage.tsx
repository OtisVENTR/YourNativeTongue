/**
 * Speakers Page Component
 * 
 * Page to manage voice profiles/speakers.
 * Placeholder for now - will be implemented in task 7.
 */

import { AppLayout } from '../components/layout';
import './PlaceholderPage.css';

export default function SpeakersPage() {
  return (
    <AppLayout 
      pageTitle="Speakers" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Speakers' }
      ]}
    >
      <div className="placeholder-page">
        <div className="placeholder-page__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>
        <h2 className="placeholder-page__title">Voice Profiles</h2>
        <p className="placeholder-page__desc">
          Manage your speaker profiles and voice clones. This page will be implemented in Task 7.
        </p>
        <button className="btn btn--primary btn--disabled" disabled>
          Coming Soon
        </button>
      </div>
    </AppLayout>
  );
}

