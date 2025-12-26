/**
 * Organization Setup Page Component
 * 
 * Allows users to create a new church organization or join an existing one.
 * Shows existing organizations to prevent duplicates and includes contact fields.
 */

import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from '../components/ThemeToggle';
import { AddressAutocomplete, type AddressComponents } from '../components/AddressAutocomplete';
import type { Organization } from '../types';
import './OrganizationSetupPage.css';

export default function OrganizationSetupPage() {
  // Enable scrolling on mount
  useEffect(() => {
    const root = document.getElementById('root');
    const html = document.documentElement;
    const body = document.body;
    
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
    }
    if (html) {
      html.style.overflow = 'auto';
      html.style.height = 'auto';
    }
    if (body) {
      body.style.overflow = 'auto';
      body.style.height = 'auto';
    }
    
    return () => {
      // Restore original styles on unmount
      if (root) {
        root.style.overflow = '';
        root.style.height = '';
      }
      if (html) {
        html.style.overflow = '';
        html.style.height = '';
      }
      if (body) {
        body.style.overflow = '';
        body.style.height = '';
      }
    };
  }, []);
  const [mode, setMode] = useState<'create' | 'join' | 'select'>('create');
  const [churchName, setChurchName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [existingOrgs, setExistingOrgs] = useState<Organization[]>([]);
  const [searching, setSearching] = useState(false);

  const navigate = useNavigate();
  const { refreshOrganization, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Search for existing organizations as user types
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchOrganizations();
    } else {
      setExistingOrgs([]);
    }
  }, [searchQuery]);

  const searchOrganizations = async () => {
    setSearching(true);
    try {
      const query = `%${searchQuery}%`;
      console.log('Searching for organizations with query:', searchQuery);
      
      // Search by name using a single query with OR conditions
      // This is more efficient and avoids issues with null fields
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, address, city, state, zip_code, phone, website, email')
        .or(`name.ilike.${query},city.ilike.${query},state.ilike.${query}`)
        .limit(10);

      console.log('Search results:', { data, error });

      if (error) {
        console.error('Search error:', error);
        setExistingOrgs([]);
      } else {
        console.log('Found organizations:', data);
        setExistingOrgs(data || []);
      }
    } catch (err) {
      console.error('Error searching organizations:', err);
      setExistingOrgs([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateOrg = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check for duplicate organizations with same name and location
      // Use address or city for duplicate checking
      const locationField = city || address;
      if (churchName && locationField) {
        const { data: duplicates } = await supabase
          .from('organizations')
          .select('id, name, city, state, address')
          .ilike('name', churchName);

        // Filter results to match city or address
        const matchingDuplicates = duplicates?.filter(
          (org) => 
            (city && org.city && org.city.toLowerCase() === city.toLowerCase()) ||
            (address && org.address && org.address.toLowerCase().includes(address.toLowerCase()))
        );

        if (matchingDuplicates && matchingDuplicates.length > 0) {
          const locationName = city || address || 'this location';
          setError(`An organization named "${churchName}" already exists at ${locationName}. Please check the list above or use a different name/location.`);
          setLoading(false);
          return;
        }
      }

      // Create organization with all fields
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: churchName,
          address: address || null,
          city: city || null,
          state: state || null,
          zip_code: zipCode || null,
          phone: phone || null,
          website: website || null,
          email: email || null,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // Refresh organization data before navigating
      await refreshOrganization();
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find org by invite code
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (orgError || !org) throw new Error('Invalid invite code');

      // Add user as member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'member'
        });

      if (memberError) {
        // Check if already a member
        if (memberError.code === '23505') {
          throw new Error('You are already a member of this organization');
        }
        throw memberError;
      }

      // Refresh organization data before navigating
      await refreshOrganization();
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrg = async (orgId: string) => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Add user as member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          role: 'member'
        });

      if (memberError) {
        if (memberError.code === '23505') {
          throw new Error('You are already a member of this organization');
        }
        throw memberError;
      }

      // Refresh organization data before navigating
      await refreshOrganization();
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to join organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="org-setup-page">
      <div className="org-setup-logout">
        <button
          type="button"
          onClick={handleLogout}
          className="logout-button"
          disabled={loading}
        >
          Sign Out
        </button>
      </div>
      <div className="org-setup-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="org-setup-container">
        <div className="org-setup-header">
          <h1 className="org-setup-title">Set Up Your Church</h1>
          <p className="org-setup-subtitle">
            Create a new church, join with an invite code, or select an existing one
          </p>
        </div>

        <div className="org-setup-mode-toggle">
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setError('');
              setSearchQuery('');
            }}
            className={`mode-toggle-button ${mode === 'create' ? 'mode-toggle-button--active' : ''}`}
            disabled={loading}
          >
            Create New
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('select');
              setError('');
            }}
            className={`mode-toggle-button ${mode === 'select' ? 'mode-toggle-button--active' : ''}`}
            disabled={loading}
          >
            Select Existing
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('join');
              setError('');
              setSearchQuery('');
            }}
            className={`mode-toggle-button ${mode === 'join' ? 'mode-toggle-button--active' : ''}`}
            disabled={loading}
          >
            Join with Code
          </button>
        </div>

        {mode === 'create' && (
          <form onSubmit={handleCreateOrg} className="org-setup-form">
            {error && (
              <div className="org-setup-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="churchName" className="form-label">
                Church Name <span className="required">*</span>
              </label>
              <input
                id="churchName"
                type="text"
                value={churchName}
                onChange={(e) => {
                  setChurchName(e.target.value);
                  setSearchQuery(e.target.value);
                }}
                className="form-input"
                placeholder="e.g., Shekinah Worship Center"
                required
                disabled={loading}
              />
              {searchQuery.length >= 2 && existingOrgs.length > 0 && (
                <div className="org-search-results">
                  <p className="org-search-hint">Similar organizations found:</p>
                  {existingOrgs.map((org) => (
                    <div key={org.id} className="org-search-item">
                      <div className="org-search-item-info">
                        <strong>{org.name}</strong>
                        {org.city && org.state && (
                          <span className="org-search-location">
                            {org.city}, {org.state}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectOrg(org.id)}
                        className="btn-select-org"
                        disabled={loading}
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">
                Address <span className="required">*</span>
              </label>
              <AddressAutocomplete
                id="address"
                value={address}
                onChange={setAddress}
                onAddressSelect={(components: AddressComponents) => {
                  // Parse and store address components for database
                  // The address field will contain the full formatted address
                  if (components.city) setCity(components.city);
                  if (components.state) setState(components.state);
                  if (components.zipCode) setZipCode(components.zipCode);
                  // Note: The full formatted address is already set via onChange
                }}
                placeholder="Enter church address (e.g., 123 Main St, City, State)"
                disabled={loading}
                required
              />
              <p className="form-hint">
                Start typing your address and select from the suggestions. City, state, and ZIP code will be filled automatically.
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  placeholder="(555) 123-4567"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="church@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="website" className="form-label">
                Website
              </label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="form-input"
                placeholder="https://example.com"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="org-setup-button"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Church'}
            </button>
          </form>
        )}

        {mode === 'select' && (
          <div className="org-setup-form">
            {error && (
              <div className="org-setup-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="searchOrg" className="form-label">
                Search for Your Church
              </label>
              <input
                id="searchOrg"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                placeholder="Type church name, city, or state..."
                disabled={loading}
              />
              {searching && <p className="form-hint">Searching...</p>}
            </div>

            {searchQuery.length >= 2 && existingOrgs.length > 0 && (
              <div className="org-list">
                <h3 className="org-list-title">Select Your Church</h3>
                {existingOrgs.map((org) => (
                  <div key={org.id} className="org-card">
                    <div className="org-card-info">
                      <h4 className="org-card-name">{org.name}</h4>
                      {(org.address || org.city || org.state) && (
                        <p className="org-card-location">
                          {org.address && `${org.address}, `}
                          {org.city && org.state
                            ? `${org.city}, ${org.state}`
                            : org.city || org.state}
                          {org.zip_code && ` ${org.zip_code}`}
                        </p>
                      )}
                      {org.phone && (
                        <p className="org-card-contact">Phone: {org.phone}</p>
                      )}
                      {org.email && (
                        <p className="org-card-contact">Email: {org.email}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectOrg(org.id)}
                      className="org-card-button"
                      disabled={loading}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && existingOrgs.length === 0 && !searching && (
              <div className="org-no-results">
                <p>No organizations found. Try a different search or create a new one.</p>
              </div>
            )}
          </div>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinOrg} className="org-setup-form">
            {error && (
              <div className="org-setup-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="inviteCode" className="form-label">
                Invite Code
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="form-input form-input--uppercase"
                placeholder="ABC12345"
                maxLength={8}
                required
                disabled={loading}
              />
              <p className="form-hint">
                Ask your church admin for the invite code
              </p>
            </div>

            <button
              type="submit"
              className="org-setup-button"
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Church'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
