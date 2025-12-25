/**
 * Upload Page Component
 * 
 * Page to upload audio files for translation.
 * Placeholder for now - will be implemented in task 8.
 */

import { AppLayout } from '../components/layout';
import './PlaceholderPage.css';

export default function UploadPage() {
  return (
    <AppLayout 
      pageTitle="Upload" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Upload' }
      ]}
    >
      <div className="placeholder-page">
        <div className="placeholder-page__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <h2 className="placeholder-page__title">Upload Audio</h2>
        <p className="placeholder-page__desc">
          Upload audio files to start a new translation job. This page will be implemented in Task 8.
        </p>
        <button className="btn btn--primary btn--disabled" disabled>
          Coming Soon
        </button>
      </div>
    </AppLayout>
  );
}

