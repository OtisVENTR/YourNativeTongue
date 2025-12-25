/**
 * App Layout Component
 * 
 * Main application layout with:
 * - Left sidebar for navigation
 * - Top header with breadcrumbs, profile, settings, usage tracker
 * - Main content area
 */

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

interface AppLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function AppLayout({ 
  children, 
  pageTitle = 'Dashboard',
  breadcrumbs = []
}: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header pageTitle={pageTitle} breadcrumbs={breadcrumbs} />
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}

