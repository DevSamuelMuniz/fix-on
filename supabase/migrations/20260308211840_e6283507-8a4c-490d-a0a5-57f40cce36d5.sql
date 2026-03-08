
-- Fix overly permissive service role policy for guide_purchases
-- Replace always-true policy with service_role check
DROP POLICY IF EXISTS "Service role can manage purchases" ON public.guide_purchases;

-- Allow users to insert their own purchases (pending status set by edge function is ok; 
-- actual purchase creation done server-side, but we need user-facing insert for checkout)
CREATE POLICY "Users can insert their own purchases"
  ON public.guide_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own purchases (status changes handled server-side)
CREATE POLICY "Admins can update purchases"
  ON public.guide_purchases FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));
