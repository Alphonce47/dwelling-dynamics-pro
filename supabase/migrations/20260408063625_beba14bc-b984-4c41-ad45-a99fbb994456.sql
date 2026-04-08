
-- 1. Allow property owners to INSERT payments for their tenants
CREATE POLICY "Property owners can insert payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM tenants t
    JOIN units u ON u.id = t.unit_id
    JOIN properties p ON p.id = u.property_id
    WHERE t.id = payments.tenant_id
      AND p.owner_id = auth.uid()
  )
);

-- 2. Allow property owners to DELETE payments for their tenants
CREATE POLICY "Property owners can delete payments"
ON public.payments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tenants t
    JOIN units u ON u.id = t.unit_id
    JOIN properties p ON p.id = u.property_id
    WHERE t.id = payments.tenant_id
      AND p.owner_id = auth.uid()
  )
);

-- 3. Allow property owners to UPDATE payments for their tenants
CREATE POLICY "Property owners can update payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tenants t
    JOIN units u ON u.id = t.unit_id
    JOIN properties p ON p.id = u.property_id
    WHERE t.id = payments.tenant_id
      AND p.owner_id = auth.uid()
  )
);

-- 4. Allow landlords to insert tenants without a unit (unit_id IS NULL)
CREATE POLICY "Landlords can insert unlinked tenants"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'landlord')
  OR public.has_role(auth.uid(), 'admin')
);
