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

-- Drop existing policies that depend on user_id before modifying speakers table
DROP POLICY IF EXISTS speakers_policy ON speakers;
DROP POLICY IF EXISTS voice_samples_policy ON voice_samples;

-- Update speakers table - rename column first, then add new columns
ALTER TABLE speakers RENAME COLUMN speaker_name TO name;

-- Now add organization columns and constraints
ALTER TABLE speakers
  ADD COLUMN organization_id UUID REFERENCES organizations(id),
  ADD COLUMN role VARCHAR(50) DEFAULT 'pastor',
  DROP COLUMN IF EXISTS user_id CASCADE,
  DROP CONSTRAINT IF EXISTS speakers_user_id_speaker_name_key;

-- Add unique constraint on organization_id and name
ALTER TABLE speakers
  ADD CONSTRAINT speakers_org_name_unique UNIQUE(organization_id, name);

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

-- Recreate voice_samples policy (it was dropped with CASCADE)
CREATE POLICY voice_samples_policy ON voice_samples
  FOR SELECT USING (
    speaker_id IN (
      SELECT id FROM speakers
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
      )
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

