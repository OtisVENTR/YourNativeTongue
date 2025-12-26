/**
 * Speakers Page Component
 * 
 * Page to manage voice profiles/speakers for the organization.
 */

import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Speaker } from '../types';
import './PlaceholderPage.css';

export default function SpeakersPage() {
  const { organization, role } = useAuth();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization) {
      fetchSpeakers();
    }
  }, [organization]);

  const fetchSpeakers = async () => {
    if (!organization) return;

    try {
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
    } finally {
      setLoading(false);
    }
  };

  const canManageSpeakers = role === 'owner' || role === 'admin';

  return (
    <AppLayout 
      pageTitle="Speakers" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Speakers' }
      ]}
    >
      <div className="speakers-page">
        <div className="speakers-page__header">
          <h2 className="speakers-page__title">Voice Profiles</h2>
          {canManageSpeakers && (
            <button className="btn btn--primary" disabled>
              Add Speaker
            </button>
          )}
        </div>

        {loading ? (
          <div className="speakers-page__loading">
            <p>Loading speakers...</p>
          </div>
        ) : speakers.length === 0 ? (
          <div className="placeholder-page">
            <div className="placeholder-page__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <h2 className="placeholder-page__title">No Speakers Yet</h2>
            <p className="placeholder-page__desc">
              {canManageSpeakers 
                ? 'Add your first speaker profile to get started with voice cloning.'
                : 'No speakers have been added to your organization yet.'}
            </p>
            {canManageSpeakers && (
              <button className="btn btn--primary btn--disabled" disabled>
                Coming Soon
              </button>
            )}
          </div>
        ) : (
          <div className="speakers-page__list">
            {speakers.map((speaker) => (
              <div key={speaker.id} className="speaker-card">
                <div className="speaker-card__main">
                  <div className="speaker-card__info">
                    <h3 className="speaker-card__name">{speaker.name}</h3>
                    <span className="speaker-card__role">
                      {speaker.role?.replace('_', ' ') || 'pastor'}
                    </span>
                  </div>
                  <span className={`speaker-card__status speaker-card__status--${speaker.training_status}`}>
                    {speaker.training_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

