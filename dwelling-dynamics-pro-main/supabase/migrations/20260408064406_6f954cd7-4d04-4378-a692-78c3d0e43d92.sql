
-- Create expenses table for landlord expense tracking
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property owners can manage expenses"
ON public.expenses FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties p WHERE p.id = expenses.property_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all expenses"
ON public.expenses FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
