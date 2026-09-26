ALTER TABLE public.products
  ADD COLUMN product_url text NOT NULL DEFAULT '';

UPDATE public.products
SET product_url = affiliate_url
WHERE product_url = '';

ALTER TABLE public.products
  ALTER COLUMN affiliate_url SET DEFAULT '';

CREATE TABLE public.product_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'recommendation',
  session_id uuid NULL REFERENCES public.sessions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_clicks_source_check CHECK (source IN ('recommendation', 'refinement'))
);

GRANT INSERT ON public.product_clicks TO anon, authenticated;
GRANT SELECT ON public.product_clicks TO authenticated;
GRANT ALL ON public.product_clicks TO service_role;

ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register product clicks"
ON public.product_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins read product clicks"
ON public.product_clicks
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX product_clicks_product_id_idx ON public.product_clicks(product_id);
CREATE INDEX product_clicks_created_at_idx ON public.product_clicks(created_at DESC);