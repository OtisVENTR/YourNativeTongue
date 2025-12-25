/**
 * Jobs Page Component
 * 
 * Page to view all translation jobs.
 * Placeholder for now - will be implemented in task 9.
 */

import { AppLayout } from '../components/layout';
import './PlaceholderPage.css';

export default function JobsPage() {
  return (
    <AppLayout 
      pageTitle="Jobs" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Jobs' }
      ]}
    >
      <div className="placeholder-page">
        <div className="placeholder-page__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h2 className="placeholder-page__title">Translation Jobs</h2>
        <p className="placeholder-page__desc">
          View and manage all your translation jobs. This page will be implemented in Task 9.
        </p>
        <button className="btn btn--primary btn--disabled" disabled>
          Coming Soon
        </button>
      </div>
    </AppLayout>
  );
}

