/*
  # Fix Authentication and Profile Creation

  1. Changes
    - Add trigger to automatically create profile on user signup
    - Add trigger to automatically assign default role on user signup
    - Add RLS policies for profiles and user_roles tables
    - Ensure auth.users can be accessed properly

  2. Security
    - Enable RLS on profiles and user_roles (already enabled)
    - Add policies for users to read/update their own profile
    - Add policies for users to read their own roles
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role text;
BEGIN
  -- Extract role from raw_user_meta_data, default to 'landlord' if not specified
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'landlord');
  
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role);

  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

-- Policies for profiles table
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_roles table
CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop existing policies for other tables and add proper ones
DROP POLICY IF EXISTS "Users can view own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON properties;

-- Properties policies
CREATE POLICY "Users can view own properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Drop existing unit policies
DROP POLICY IF EXISTS "Users can view units of own properties" ON units;
DROP POLICY IF EXISTS "Users can insert units to own properties" ON units;
DROP POLICY IF EXISTS "Users can update units of own properties" ON units;
DROP POLICY IF EXISTS "Users can delete units of own properties" ON units;

-- Units policies
CREATE POLICY "Users can view units of own properties"
  ON units
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = units.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert units to own properties"
  ON units
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = units.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update units of own properties"
  ON units
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = units.property_id
      AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = units.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete units of own properties"
  ON units
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = units.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Drop existing tenant policies
DROP POLICY IF EXISTS "Users can view tenants of own properties" ON tenants;
DROP POLICY IF EXISTS "Users can insert tenants to own properties" ON tenants;
DROP POLICY IF EXISTS "Users can update tenants of own properties" ON tenants;
DROP POLICY IF EXISTS "Users can delete tenants of own properties" ON tenants;

-- Tenants policies
CREATE POLICY "Users can view tenants of own properties"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    unit_id IS NULL OR
    EXISTS (
      SELECT 1 FROM units
      JOIN properties ON properties.id = units.property_id
      WHERE units.id = tenants.unit_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tenants"
  ON tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update tenants of own properties"
  ON tenants
  FOR UPDATE
  TO authenticated
  USING (
    unit_id IS NULL OR
    EXISTS (
      SELECT 1 FROM units
      JOIN properties ON properties.id = units.property_id
      WHERE units.id = tenants.unit_id
      AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    unit_id IS NULL OR
    EXISTS (
      SELECT 1 FROM units
      JOIN properties ON properties.id = units.property_id
      WHERE units.id = tenants.unit_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tenants of own properties"
  ON tenants
  FOR DELETE
  TO authenticated
  USING (
    unit_id IS NULL OR
    EXISTS (
      SELECT 1 FROM units
      JOIN properties ON properties.id = units.property_id
      WHERE units.id = tenants.unit_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Drop existing payment policies
DROP POLICY IF EXISTS "Users can view payments of own tenants" ON payments;

-- Payments policies
CREATE POLICY "Users can view payments of own tenants"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      LEFT JOIN units ON units.id = tenants.unit_id
      LEFT JOIN properties ON properties.id = units.property_id
      WHERE tenants.id = payments.tenant_id
      AND (properties.owner_id = auth.uid() OR tenants.user_id = auth.uid())
    )
  );

-- Drop existing lease policies
DROP POLICY IF EXISTS "Users can view leases of own properties" ON leases;

-- Leases policies
CREATE POLICY "Users can view leases of own properties"
  ON leases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM units
      JOIN properties ON properties.id = units.property_id
      WHERE units.id = leases.unit_id
      AND properties.owner_id = auth.uid()
    )
  );
