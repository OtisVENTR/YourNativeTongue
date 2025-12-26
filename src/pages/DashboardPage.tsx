/**
 * Dashboard Page Component
 * 
 * Main dashboard page for authenticated users.
 * Shows usage stats, recent jobs, and quick actions.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import './DashboardPage.css';

// Icons
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Types
interface UsageStats {
  minutesUsed: number;
  minutesTotal: number;
  jobsCompleted: number;
  jobsInProgress: number;
  speakersCount: number;
}

interface RecentJob {
  id: string;
  job_type: string;
  status: string;
  created_at: string;
  input_file_name?: string;
}

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const [stats, setStats] = useState<UsageStats>({
    minutesUsed: 0,
    minutesTotal: 30,
    jobsCompleted: 0,
    jobsInProgress: 0,
    speakersCount: 0,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user, organization]);

  const fetchDashboardData = async () => {
    if (!user || !organization) return;

    try {
      // Fetch organization minutes (shared pool)
      const minutesUsed = Number(organization.minutes_used) || 0;
      const minutesTotal = organization.minutes_included || 30;

      // Fetch job counts for organization
      const { count: completedCount, error: completedError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'completed');

      const { count: inProgressCount, error: progressError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .in('status', ['queued', 'processing_transcription', 'processing_translation', 'processing_tts', 'processing_finalize']);

      // Fetch speakers count for organization
      const { count: speakersCount, error: speakersError } = await supabase
        .from('speakers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      // Fetch recent jobs for organization
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, job_type, status, created_at, input_file_path')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
      }

      setStats({
        minutesUsed,
        minutesTotal,
        jobsCompleted: completedCount || 0,
        jobsInProgress: inProgressCount || 0,
        speakersCount: speakersCount || 0,
      });

      setRecentJobs(
        (jobs || []).map((job: any) => ({
          id: job.id,
          job_type: job.job_type,
          status: job.status,
          created_at: job.created_at,
          input_file_name: job.input_file_path?.split('/').pop(),
        }))
      );
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffTime / (1000 * 60));
        return `${diffMins} min ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'failed':
        return <AlertCircleIcon />;
      default:
        return <ClockIcon />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status--completed';
      case 'failed':
        return 'status--failed';
      default:
        return 'status--processing';
    }
  };

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      translation_only: 'Translation',
      voice_clone: 'Voice Clone',
      full_dub: 'Full Dub',
    };
    return labels[type] || type;
  };

  return (
    <AppLayout pageTitle="Dashboard">
      <div className="dashboard">
        {/* Welcome Section */}
        <section className="dashboard__welcome">
          <div className="welcome__text">
            <h2 className="welcome__greeting">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h2>
            <p className="welcome__subtitle">
              {organization ? `${organization.name} - ` : ''}Here's an overview of your translation activity.
            </p>
          </div>
          <div className="welcome__actions">
            <Link to="/upload" className="btn btn--primary">
              <PlusIcon />
              <span>New Translation</span>
            </Link>
            <Link to="/speakers" className="btn btn--secondary">
              <MicIcon />
              <span>Add Speaker</span>
            </Link>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="dashboard__stats">
          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Minutes Used</span>
              <span className="stat-card__period">This Month</span>
            </div>
            <div className="stat-card__value">
              {loading ? '—' : stats.minutesUsed}
              <span className="stat-card__unit">/ {stats.minutesTotal}</span>
            </div>
            <div className="stat-card__bar">
              <div 
                className="stat-card__bar-fill" 
                style={{ width: `${Math.min((stats.minutesUsed / stats.minutesTotal) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Jobs Completed</span>
            </div>
            <div className="stat-card__value stat-card__value--success">
              {loading ? '—' : stats.jobsCompleted}
            </div>
            <div className="stat-card__footer">
              <CheckCircleIcon />
              <span>All time</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">In Progress</span>
            </div>
            <div className="stat-card__value stat-card__value--info">
              {loading ? '—' : stats.jobsInProgress}
            </div>
            <div className="stat-card__footer">
              <ClockIcon />
              <span>Active jobs</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Voice Profiles</span>
            </div>
            <div className="stat-card__value">
              {loading ? '—' : stats.speakersCount}
            </div>
            <div className="stat-card__footer">
              <MicIcon />
              <span>Speakers</span>
            </div>
          </div>
        </section>

        {/* Recent Jobs */}
        <section className="dashboard__recent">
          <div className="recent__header">
            <h3 className="recent__title">Recent Jobs</h3>
            <Link to="/jobs" className="recent__view-all">
              View All
              <ArrowRightIcon />
            </Link>
          </div>

          {loading ? (
            <div className="recent__loading">
              <div className="loading-shimmer" />
              <div className="loading-shimmer" />
              <div className="loading-shimmer" />
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="recent__empty">
              <p>No jobs yet. Start your first translation!</p>
              <Link to="/upload" className="btn btn--primary btn--sm">
                <PlusIcon />
                <span>New Translation</span>
              </Link>
            </div>
          ) : (
            <div className="recent__list">
              {recentJobs.map((job) => (
                <Link to={`/job/${job.id}`} key={job.id} className="job-card">
                  <div className="job-card__main">
                    <span className={`job-card__status ${getStatusClass(job.status)}`}>
                      {getStatusIcon(job.status)}
                    </span>
                    <div className="job-card__info">
                      <span className="job-card__name">
                        {job.input_file_name || 'Untitled Job'}
                      </span>
                      <span className="job-card__type">
                        {getJobTypeLabel(job.job_type)}
                      </span>
                    </div>
                  </div>
                  <div className="job-card__meta">
                    <span className="job-card__date">{formatDate(job.created_at)}</span>
                    <ArrowRightIcon />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="dashboard__quick-actions">
          <h3 className="quick-actions__title">Quick Actions</h3>
          <div className="quick-actions__grid">
            <Link to="/upload" className="action-card">
              <div className="action-card__icon action-card__icon--primary">
                <PlusIcon />
              </div>
              <div className="action-card__content">
                <span className="action-card__title">Upload Audio</span>
                <span className="action-card__desc">Start a new translation job</span>
              </div>
            </Link>
            <Link to="/speakers" className="action-card">
              <div className="action-card__icon action-card__icon--accent">
                <MicIcon />
              </div>
              <div className="action-card__content">
                <span className="action-card__title">Manage Speakers</span>
                <span className="action-card__desc">Add or edit voice profiles</span>
              </div>
            </Link>
            <Link to="/glossary" className="action-card">
              <div className="action-card__icon action-card__icon--info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div className="action-card__content">
                <span className="action-card__title">View Glossary</span>
                <span className="action-card__desc">Manage faith term translations</span>
              </div>
            </Link>
            <Link to="/jobs" className="action-card">
              <div className="action-card__icon action-card__icon--success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="action-card__content">
                <span className="action-card__title">All Jobs</span>
                <span className="action-card__desc">View job history and downloads</span>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
