CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_not_blank CHECK (btrim(name) <> '')
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active categories are public" ON public.categories FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "Admins read all categories" ON public.categories FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.occasions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT occasions_name_not_blank CHECK (btrim(name) <> '')
);
GRANT SELECT ON public.occasions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.occasions TO authenticated;
GRANT ALL ON public.occasions TO service_role;
ALTER TABLE public.occasions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active occasions are public" ON public.occasions FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "Admins read all occasions" ON public.occasions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins insert occasions" ON public.occasions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update occasions" ON public.occasions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete occasions" ON public.occasions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_name_not_blank CHECK (btrim(name) <> '')
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active profiles are public" ON public.profiles FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.product_categories (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, category_id)
);
GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active product categories" ON public.product_categories FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.active));
CREATE POLICY "Admins read all product categories" ON public.product_categories FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins insert product categories" ON public.product_categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete product categories" ON public.product_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.product_occasions (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  occasion_id uuid NOT NULL REFERENCES public.occasions(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, occasion_id)
);
GRANT SELECT ON public.product_occasions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_occasions TO authenticated;
GRANT ALL ON public.product_occasions TO service_role;
ALTER TABLE public.product_occasions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active product occasions" ON public.product_occasions FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.active));
CREATE POLICY "Admins read all product occasions" ON public.product_occasions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins insert product occasions" ON public.product_occasions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete product occasions" ON public.product_occasions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.product_profiles (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, profile_id)
);
GRANT SELECT ON public.product_profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_profiles TO authenticated;
GRANT ALL ON public.product_profiles TO service_role;
ALTER TABLE public.product_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active product profiles" ON public.product_profiles FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.active));
CREATE POLICY "Admins read all product profiles" ON public.product_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins insert product profiles" ON public.product_profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete product profiles" ON public.product_profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX product_categories_category_id_idx ON public.product_categories(category_id);
CREATE INDEX product_occasions_occasion_id_idx ON public.product_occasions(occasion_id);
CREATE INDEX product_profiles_profile_id_idx ON public.product_profiles(profile_id);

CREATE OR REPLACE FUNCTION public.set_taxonomy_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_taxonomy_updated_at();
CREATE TRIGGER set_occasions_updated_at BEFORE UPDATE ON public.occasions FOR EACH ROW EXECUTE FUNCTION public.set_taxonomy_updated_at();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_taxonomy_updated_at();

INSERT INTO public.categories (name)
SELECT DISTINCT btrim(value)
FROM public.products p
CROSS JOIN LATERAL regexp_split_to_table(p.category, ',') AS value
WHERE btrim(value) <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.occasions (name)
SELECT DISTINCT btrim(value) FROM (
  SELECT unnest(occasions) AS value FROM public.products
  UNION ALL SELECT unnest(ARRAY['Aniversário','Natal','Dia dos Namorados','Casamento','Formatura','Dia das Mães','Dia dos Pais','Outra ocasião','Sem ocasião específica'])
) current_values WHERE btrim(value) <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.profiles (name)
SELECT DISTINCT btrim(value) FROM (
  SELECT unnest(profiles) AS value FROM public.products
  UNION ALL SELECT unnest(ARRAY['Mãe','Pai','Esposo(a)','Namorado(a)','Filho(a)','Irmão(ã)','Amigo(a)','Colega'])
) current_values WHERE btrim(value) <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.product_categories (product_id, category_id)
SELECT DISTINCT p.id, c.id
FROM public.products p
CROSS JOIN LATERAL regexp_split_to_table(p.category, ',') AS value
JOIN public.categories c ON c.name = btrim(value)
WHERE btrim(value) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.product_occasions (product_id, occasion_id)
SELECT DISTINCT p.id, o.id
FROM public.products p
CROSS JOIN LATERAL unnest(p.occasions) AS value
JOIN public.occasions o ON o.name = btrim(value)
WHERE btrim(value) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.product_profiles (product_id, profile_id)
SELECT DISTINCT p.id, pr.id
FROM public.products p
CROSS JOIN LATERAL unnest(p.profiles) AS value
JOIN public.profiles pr ON pr.name = btrim(value)
WHERE btrim(value) <> ''
ON CONFLICT DO NOTHING;

COMMENT ON COLUMN public.products.category IS 'DEPRECATED: replaced by public.product_categories; retained for zero-downtime compatibility';
COMMENT ON COLUMN public.products.occasions IS 'DEPRECATED: replaced by public.product_occasions; retained for zero-downtime compatibility';
COMMENT ON COLUMN public.products.profiles IS 'DEPRECATED: replaced by public.product_profiles; retained for zero-downtime compatibility';

CREATE OR REPLACE FUNCTION public.admin_save_product(
  _product_id uuid,
  _product jsonb,
  _category_ids uuid[],
  _occasion_ids uuid[],
  _profile_ids uuid[]
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  saved_id uuid;
  legacy_category text;
  legacy_occasions text[];
  legacy_profiles text[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF coalesce(array_length(_category_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'At least one category is required' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(coalesce(_category_ids, ARRAY[]::uuid[])) id LEFT JOIN public.categories c ON c.id = id WHERE c.id IS NULL)
    OR EXISTS (SELECT 1 FROM unnest(coalesce(_occasion_ids, ARRAY[]::uuid[])) id LEFT JOIN public.occasions o ON o.id = id WHERE o.id IS NULL)
    OR EXISTS (SELECT 1 FROM unnest(coalesce(_profile_ids, ARRAY[]::uuid[])) id LEFT JOIN public.profiles p ON p.id = id WHERE p.id IS NULL) THEN
    RAISE EXCEPTION 'Invalid taxonomy association' USING ERRCODE = '23503';
  END IF;

  SELECT string_agg(name, ', ' ORDER BY name) INTO legacy_category FROM public.categories WHERE id = ANY(_category_ids);
  SELECT coalesce(array_agg(name ORDER BY name), ARRAY[]::text[]) INTO legacy_occasions FROM public.occasions WHERE id = ANY(coalesce(_occasion_ids, ARRAY[]::uuid[]));
  SELECT coalesce(array_agg(name ORDER BY name), ARRAY[]::text[]) INTO legacy_profiles FROM public.profiles WHERE id = ANY(coalesce(_profile_ids, ARRAY[]::uuid[]));

  IF _product_id IS NULL THEN
    INSERT INTO public.products (name, description, price, category, store, product_url, affiliate_url, image_url, tags, occasions, profiles, active)
    VALUES (
      btrim(_product->>'name'), coalesce(btrim(_product->>'description'), ''), (_product->>'price')::numeric,
      legacy_category, btrim(_product->>'store'), btrim(_product->>'product_url'), coalesce(btrim(_product->>'affiliate_url'), ''),
      nullif(btrim(_product->>'image_url'), ''), coalesce(ARRAY(SELECT jsonb_array_elements_text(_product->'tags')), ARRAY[]::text[]),
      legacy_occasions, legacy_profiles, coalesce((_product->>'active')::boolean, true)
    ) RETURNING id INTO saved_id;
  ELSE
    UPDATE public.products SET
      name = btrim(_product->>'name'), description = coalesce(btrim(_product->>'description'), ''), price = (_product->>'price')::numeric,
      category = legacy_category, store = btrim(_product->>'store'), product_url = btrim(_product->>'product_url'),
      affiliate_url = coalesce(btrim(_product->>'affiliate_url'), ''), image_url = nullif(btrim(_product->>'image_url'), ''),
      tags = coalesce(ARRAY(SELECT jsonb_array_elements_text(_product->'tags')), ARRAY[]::text[]), active = coalesce((_product->>'active')::boolean, true),
      occasions = legacy_occasions, profiles = legacy_profiles
    WHERE id = _product_id
    RETURNING id INTO saved_id;
    IF saved_id IS NULL THEN RAISE EXCEPTION 'Product not found' USING ERRCODE = 'P0002'; END IF;
  END IF;

  DELETE FROM public.product_categories WHERE product_id = saved_id;
  DELETE FROM public.product_occasions WHERE product_id = saved_id;
  DELETE FROM public.product_profiles WHERE product_id = saved_id;
  INSERT INTO public.product_categories (product_id, category_id) SELECT saved_id, id FROM unnest(_category_ids) id ON CONFLICT DO NOTHING;
  INSERT INTO public.product_occasions (product_id, occasion_id) SELECT saved_id, id FROM unnest(coalesce(_occasion_ids, ARRAY[]::uuid[])) id ON CONFLICT DO NOTHING;
  INSERT INTO public.product_profiles (product_id, profile_id) SELECT saved_id, id FROM unnest(coalesce(_profile_ids, ARRAY[]::uuid[])) id ON CONFLICT DO NOTHING;
  RETURN saved_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_save_product(uuid, jsonb, uuid[], uuid[], uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_save_product(uuid, jsonb, uuid[], uuid[], uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_product(uuid, jsonb, uuid[], uuid[], uuid[]) TO service_role;