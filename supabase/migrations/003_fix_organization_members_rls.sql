-- Fix infinite recursion in organization_members RLS policies
-- The INSERT and SELECT policies were checking organization_members table which caused recursion
-- Solution: 
-- 1. Allow users to insert themselves as members (for joining organizations)
-- 2. Use a SECURITY DEFINER function for SELECT to bypass RLS recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS members_insert_policy ON organization_members;
DROP POLICY IF EXISTS members_view_policy ON organization_members;

-- Create a SECURITY DEFINER function to check if user belongs to an organization
-- This bypasses RLS and avoids infinite recursion
CREATE OR REPLACE FUNCTION check_user_org_membership(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, so it bypasses RLS
  -- Check if the current user is a member of the given organization
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new INSERT policy that allows users to insert themselves
-- (for joining organizations they don't belong to yet)
CREATE POLICY members_insert_policy ON organization_members
  FOR INSERT 
  WITH CHECK (
    -- Allow users to insert themselves (for joining organizations)
    user_id = auth.uid()
  );

-- Create new SELECT policy using the function to avoid recursion
CREATE POLICY members_view_policy ON organization_members
  FOR SELECT USING (
    -- Allow users to see their own memberships
    user_id = auth.uid()
    OR
    -- Allow users to see other members of organizations they belong to
    -- Use the SECURITY DEFINER function to check membership without recursion
    check_user_org_membership(organization_id)
  );

