/**
 * Team Settings Page Component
 * 
 * Page to manage team members and view invite code for the organization.
 */

import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './TeamSettingsPage.css';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  users: {
    full_name: string | null;
    email: string;
  } | null;
}

export default function TeamSettingsPage() {
  const { organization, role } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization) {
      fetchMembers();
    }
  }, [organization]);

  const fetchMembers = async () => {
    if (!organization) return;

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, user_id, role, created_at, users(full_name, email)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const canManageTeam = role === 'owner' || role === 'admin';

  const copyInviteCode = () => {
    if (organization?.invite_code) {
      navigator.clipboard.writeText(organization.invite_code);
      alert('Invite code copied to clipboard!');
    }
  };

  return (
    <AppLayout 
      pageTitle="Team Members" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings', href: '/settings' },
        { label: 'Team Members' }
      ]}
    >
      <div className="team-settings-page">
        <div className="team-settings-page__header">
          <h2 className="team-settings-page__title">Team Members</h2>
          {canManageTeam && (
            <button
              onClick={() => setShowInvite(!showInvite)} className="btn btn--primary">
              {showInvite ? 'Hide' : 'Show'} Invite Code
            </button>
          )}
        </div>

        {showInvite && canManageTeam && (
          <div className="team-settings-page__invite-section">
            <h3 className="team-settings-page__invite-title">Invite Code</h3>
            <div className="team-settings-page__invite-code-container">
              <code className="team-settings-page__invite-code">
                {organization?.invite_code}
              </code>
              <button
                onClick={copyInviteCode}
                className="btn btn--secondary btn--sm"
              >
                Copy
              </button>
            </div>
            <p className="team-settings-page__invite-hint">
              Share this code with team members so they can join your church
            </p>
          </div>
        )}

        {loading ? (
          <div className="team-settings-page__loading">
            <p>Loading team members...</p>
          </div>
        ) : (
          <div className="team-settings-page__table-container">
            <table className="team-settings-page__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="team-settings-page__empty">
                      No team members found
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        {member.users?.full_name || 'N/A'}
                      </td>
                      <td className="team-settings-page__email">
                        {member.users?.email || 'N/A'}
                      </td>
                      <td>
                        <span className={`team-settings-page__role team-settings-page__role--${member.role}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="team-settings-page__date">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

