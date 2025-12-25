/**
 * Glossary Page Component
 * 
 * Page to view faith term translations glossary.
 * Placeholder for now - will be implemented in task 10.
 */

import { AppLayout } from '../components/layout';
import './PlaceholderPage.css';

export default function GlossaryPage() {
  return (
    <AppLayout 
      pageTitle="Glossary" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Glossary' }
      ]}
    >
      <div className="placeholder-page">
        <div className="placeholder-page__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="8" y1="7" x2="16" y2="7" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>
        <h2 className="placeholder-page__title">Faith Terms Glossary</h2>
        <p className="placeholder-page__desc">
          View and manage your faith term translations. This page will be implemented in Task 10.
        </p>
        <button className="btn btn--primary btn--disabled" disabled>
          Coming Soon
        </button>
      </div>
    </AppLayout>
  );
}

