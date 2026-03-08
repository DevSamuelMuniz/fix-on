
-- Create digital guides table
CREATE TABLE public.digital_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  stripe_price_id TEXT NOT NULL,
  stripe_product_id TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  cover_image_url TEXT,
  file_path TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published guides are publicly viewable"
  ON public.digital_guides FOR SELECT
  USING (is_published = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage guides"
  ON public.digital_guides FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create guide purchases table
CREATE TABLE public.guide_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  guide_id UUID NOT NULL REFERENCES public.digital_guides(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, guide_id)
);

ALTER TABLE public.guide_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases"
  ON public.guide_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage purchases"
  ON public.guide_purchases FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all purchases"
  ON public.guide_purchases FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_digital_guides_updated_at
  BEFORE UPDATE ON public.digital_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guide_purchases_updated_at
  BEFORE UPDATE ON public.guide_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for guides (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('digital-guides', 'digital-guides', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload guides"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'digital-guides' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow authenticated read of guides"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'digital-guides' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can manage guide files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'digital-guides' AND has_role(auth.uid(), 'admin'));
