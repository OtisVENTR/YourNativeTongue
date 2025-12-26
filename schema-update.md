# Cursor Implementation Prompt: Multi-Tenant Organization Support

## Context

We're adding multi-tenant organization support to Your Native Tongue. Churches work as teams, so we need:
- Organizations (churches) with shared minute pools
- Team members with roles (owner/admin/member)
- Invite code system for adding team members
- Speakers and jobs belong to organizations, not individual users

## Phase 1: Database Migration

### Step 1: Create Migration File

Create `supabase/migrations/002_add_organizations.sql` with the following:

```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  minutes_included INTEGER DEFAULT 30,
  minutes_used DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organization members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) CHECK (role IN ('owner', 'admin', 'member')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Update users table (remove individual minute tracking)
ALTER TABLE users
  DROP COLUMN IF EXISTS minutes_used_current_period,
  DROP COLUMN IF EXISTS minutes_included,
  DROP COLUMN IF EXISTS billing_period_start,
  DROP COLUMN IF EXISTS billing_period_end,
  DROP COLUMN IF EXISTS plan_type,
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS organization;

-- Update speakers table
ALTER TABLE speakers
  ADD COLUMN organization_id UUID REFERENCES organizations(id),
  ADD COLUMN role VARCHAR(50) DEFAULT 'pastor',
  DROP COLUMN IF EXISTS user_id,
  DROP CONSTRAINT IF EXISTS speakers_user_id_speaker_name_key,
  ADD CONSTRAINT speakers_org_name_unique UNIQUE(organization_id, name);

-- Rename speaker_name to name in speakers table
ALTER TABLE speakers RENAME COLUMN speaker_name TO name;

-- Update jobs table
ALTER TABLE jobs
  ADD COLUMN organization_id UUID REFERENCES organizations(id),
  DROP COLUMN IF EXISTS target_languages,
  DROP COLUMN IF EXISTS output_files,
  DROP COLUMN IF EXISTS translations,
  DROP COLUMN IF EXISTS retry_count,
  ADD COLUMN target_language VARCHAR(10) DEFAULT 'es',
  ADD COLUMN output_audio_path TEXT,
  ADD COLUMN output_caption_path TEXT,
  ADD COLUMN translated_text TEXT;

-- Add indexes
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_speakers_org ON speakers(organization_id);
CREATE INDEX idx_jobs_org ON jobs(organization_id);
CREATE INDEX idx_organizations_invite ON organizations(invite_code);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY org_view_policy ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY org_insert_policy ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY org_update_policy ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policies for organization_members
CREATE POLICY members_view_policy ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY members_insert_policy ON organization_members
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY members_delete_policy ON organization_members
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Update RLS for speakers
DROP POLICY IF EXISTS speakers_policy ON speakers;

CREATE POLICY speakers_view_policy ON speakers
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY speakers_manage_policy ON speakers
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY speakers_update_policy ON speakers
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY speakers_delete_policy ON speakers
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Update RLS for jobs
DROP POLICY IF EXISTS jobs_policy ON jobs;

CREATE POLICY jobs_view_policy ON jobs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY jobs_create_policy ON jobs
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invite codes
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_invite_code_trigger
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();
```

### Step 2: Run Migration

```bash
supabase db push
```

### Step 3: Regenerate TypeScript Types

```bash
supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.types.ts
```

---

## Phase 2: Update Frontend Types

### Step 4: Add Organization Types

Create `src/types/index.ts`:

```typescript
export type UserRole = 'owner' | 'admin' | 'member'

export interface Organization {
  id: string
  name: string
  invite_code: string
  minutes_included: number
  minutes_used: number
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: UserRole
  created_at: string
}

export interface UserWithOrg {
  user: any // Supabase user
  organization: Organization | null
  role: UserRole | null
}

export interface Speaker {
  id: string
  organization_id: string
  name: string
  role: 'pastor' | 'worship_leader' | 'guest_speaker'
  voice_clone_id: string | null
  training_status: 'pending' | 'ready' | 'failed'
  sample_duration_seconds: number | null
  created_at: string
}

export interface Job {
  id: string
  organization_id: string
  user_id: string
  speaker_id: string
  status: string
  source_language: string
  target_language: string
  input_file_path: string
  input_duration_seconds: number | null
  output_audio_path: string | null
  output_caption_path: string | null
  transcript_text: string | null
  translated_text: string | null
  cost_usd: number | null
  created_at: string
  error_message: string | null
}
```

---

## Phase 3: Update Authentication Flow

### Step 5: Create Organization Setup Page

Create `src/pages/OrganizationSetupPage.tsx`:

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function OrganizationSetupPage() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [churchName, setChurchName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: churchName })
        .select()
        .single()

      if (orgError) throw orgError

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) throw memberError

      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Find org by invite code
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (orgError || !org) throw new Error('Invalid invite code')

      // Add user as member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'member'
        })

      if (memberError) throw memberError

      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid invite code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Set Up Your Church</h2>
          <p className="mt-2 text-gray-600">
            Create a new church or join an existing one
          </p>
        </div>

        <div className="flex gap-2 bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 rounded-md transition ${
              mode === 'create'
                ? 'bg-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create New Church
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2 rounded-md transition ${
              mode === 'join'
                ? 'bg-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Join Existing
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Church Name
              </label>
              <input
                type="text"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Shekinah Worship Center"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Church'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinOrg} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="ABC12345"
                maxLength={8}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Ask your church admin for the invite code
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Church'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

### Step 6: Update useAuth Hook

Update `src/hooks/useAuth.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { UserWithOrg } from '../types'

export function useAuth() {
  const [userWithOrg, setUserWithOrg] = useState<UserWithOrg | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchUserOrg(session.user.id)
      } else {
        setUserWithOrg(null)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserOrg(session.user.id)
      } else {
        setUserWithOrg(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserOrg = async (userId: string) => {
    // Get user's organization membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations(*)')
      .eq('user_id', userId)
      .single()

    const { data: { user } } = await supabase.auth.getUser()

    setUserWithOrg({
      user,
      organization: membership?.organizations || null,
      role: membership?.role || null
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUserWithOrg(null)
  }

  return {
    user: userWithOrg?.user,
    organization: userWithOrg?.organization,
    role: userWithOrg?.role,
    loading,
    signOut
  }
}
```

### Step 7: Update Router to Check for Organization

Update `src/App.tsx` to redirect to org setup if no org:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import OrganizationSetupPage from './pages/OrganizationSetupPage'
import DashboardPage from './pages/DashboardPage'
// ... other imports

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, organization, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  if (!user) return <Navigate to="/login" />
  
  // If logged in but no organization, redirect to setup
  if (!organization) return <Navigate to="/org-setup" />

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/org-setup" element={<OrganizationSetupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        {/* ... other protected routes */}
      </Routes>
    </BrowserRouter>
  )
}
```

---

## Phase 4: Update Dashboard Components

### Step 8: Update Usage Stats Component

Update `src/components/UsageStats.tsx` to show org minutes:

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function UsageStats() {
  const { organization } = useAuth()
  const [stats, setStats] = useState({
    used: 0,
    included: 30,
    remaining: 30
  })

  useEffect(() => {
    if (organization) {
      setStats({
        used: Number(organization.minutes_used),
        included: organization.minutes_included,
        remaining: organization.minutes_included - Number(organization.minutes_used)
      })
    }
  }, [organization])

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">
        {organization?.name} - Minutes
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Used:</span>
          <span className="font-semibold">{stats.used.toFixed(1)} min</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Remaining:</span>
          <span className="font-semibold">{stats.remaining.toFixed(1)} min</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(stats.used / stats.included) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
```

### Step 9: Update Speakers Page to Show Org Speakers

Update `src/pages/SpeakersPage.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Speaker } from '../types'

export default function SpeakersPage() {
  const { organization, role } = useAuth()
  const [speakers, setSpeakers] = useState<Speaker[]>([])

  useEffect(() => {
    if (organization) {
      fetchSpeakers()
    }
  }, [organization])

  const fetchSpeakers = async () => {
    const { data } = await supabase
      .from('speakers')
      .select('*')
      .eq('organization_id', organization!.id)
      .order('created_at', { ascending: false })

    setSpeakers(data || [])
  }

  const canManageSpeakers = role === 'owner' || role === 'admin'

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Speakers</h1>
        {canManageSpeakers && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Add Speaker
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {speakers.map((speaker) => (
          <div key={speaker.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{speaker.name}</h3>
                <span className="text-sm text-gray-500 capitalize">
                  {speaker.role.replace('_', ' ')}
                </span>
              </div>
              <span className={`text-sm px-2 py-1 rounded ${
                speaker.training_status === 'ready' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {speaker.training_status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Phase 5: Add Team Management

### Step 10: Create Team Settings Page

Create `src/pages/TeamSettingsPage.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface TeamMember {
  id: string
  user_id: string
  role: string
  created_at: string
  users: {
    full_name: string
    email: string
  }
}

export default function TeamSettingsPage() {
  const { organization, role } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    if (organization) {
      fetchMembers()
    }
  }, [organization])

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('organization_members')
      .select('*, users(full_name, email)')
      .eq('organization_id', organization!.id)
      .order('created_at', { ascending: true })

    setMembers(data || [])
  }

  const canManageTeam = role === 'owner' || role === 'admin'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Members</h1>
        {canManageTeam && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Invite Member
          </button>
        )}
      </div>

      {showInvite && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Invite Code</h3>
          <div className="flex items-center gap-4">
            <code className="bg-white px-4 py-2 rounded text-2xl font-mono">
              {organization?.invite_code}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(organization?.invite_code || '')
                alert('Invite code copied!')
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              Copy
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Share this code with team members so they can join your church
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {member.users.full_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {member.users.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(member.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## Summary

This implements:
✅ Multi-tenant organization structure
✅ Role-based permissions (owner/admin/member)
✅ Invite code system
✅ Shared minute pools at org level
✅ Speakers belong to organizations
✅ Jobs track both org and creator
✅ Team management UI
✅ Organization setup flow after signup

## Next Steps

1. Run the database migration
2. Update all components to use organization context
3. Test the full signup → org setup → dashboard flow
4. Update Edge Functions to use organization_id
5. Test with multiple users in same org

All code follows the existing patterns in your app. Let me know if you need any clarification!