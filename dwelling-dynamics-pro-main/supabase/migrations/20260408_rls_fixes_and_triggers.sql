-- =====================================================
-- RLS FIXES & DATABASE TRIGGERS
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. PAYMENT INSERT policy — landlords can now record payments
CREATE POLICY "Property owners can insert payments" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenants t
      JOIN public.units u ON u.id = t.unit_id
      JOIN public.properties p ON p.id = u.property_id
      WHERE t.id = payments.tenant_id AND p.owner_id = auth.uid()
    )
  );

-- 2. Payment DELETE policy — landlords can delete payments they own
CREATE POLICY "Property owners can delete payments" ON public.payments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      JOIN public.units u ON u.id = t.unit_id
      JOIN public.properties p ON p.id = u.property_id
      WHERE t.id = payments.tenant_id AND p.owner_id = auth.uid()
    )
  );

-- 3. LEASE INSERT / UPDATE / DELETE policies
CREATE POLICY "Property owners can insert leases" ON public.leases
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.units u
      JOIN public.properties p ON p.id = u.property_id
      WHERE u.id = leases.unit_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can update leases" ON public.leases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.units u
      JOIN public.properties p ON p.id = u.property_id
      WHERE u.id = leases.unit_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can delete leases" ON public.leases
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.units u
      JOIN public.properties p ON p.id = u.property_id
      WHERE u.id = leases.unit_id AND p.owner_id = auth.uid()
    )
  );

-- 4. OVERDUE INVOICE AUTO-MARKING TRIGGER
-- Automatically flips pending invoices to overdue when their due_date has passed
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.invoices
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
$$;

-- 5. UNIT STATUS SYNC TRIGGER
-- When a tenant is assigned to a unit, mark the unit as occupied
-- When a tenant is removed from a unit, mark it vacant
CREATE OR REPLACE FUNCTION public.sync_unit_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.unit_id IS NOT NULL THEN
      UPDATE public.units SET status = 'occupied' WHERE id = NEW.unit_id;
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.unit_id IS NOT NULL AND OLD.unit_id <> COALESCE(NEW.unit_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
      -- Old unit is now potentially vacant — check no other tenant is assigned
      IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE unit_id = OLD.unit_id AND id <> NEW.id) THEN
        UPDATE public.units SET status = 'vacant' WHERE id = OLD.unit_id;
      END IF;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.unit_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE unit_id = OLD.unit_id AND id <> OLD.id) THEN
        UPDATE public.units SET status = 'vacant' WHERE id = OLD.unit_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tenant_unit_sync ON public.tenants;
CREATE TRIGGER tenant_unit_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.sync_unit_status();

-- 6. INVOICE PAYMENT STATUS SYNC
-- When a confirmed payment is recorded for an invoice, mark invoice as paid
CREATE OR REPLACE FUNCTION public.sync_invoice_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND NEW.invoice_id IS NOT NULL THEN
    UPDATE public.invoices SET status = 'paid' WHERE id = NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_invoice_sync ON public.payments;
CREATE TRIGGER payment_invoice_sync
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_payment_status();

-- Run mark_overdue_invoices immediately to catch any already-overdue invoices
SELECT public.mark_overdue_invoices();
