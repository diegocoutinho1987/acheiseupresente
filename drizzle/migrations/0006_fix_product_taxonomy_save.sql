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
  IF EXISTS (SELECT 1 FROM unnest(coalesce(_category_ids, ARRAY[]::uuid[])) AS selected(id) LEFT JOIN public.categories c ON c.id = selected.id WHERE c.id IS NULL)
    OR EXISTS (SELECT 1 FROM unnest(coalesce(_occasion_ids, ARRAY[]::uuid[])) AS selected(id) LEFT JOIN public.occasions o ON o.id = selected.id WHERE o.id IS NULL)
    OR EXISTS (SELECT 1 FROM unnest(coalesce(_profile_ids, ARRAY[]::uuid[])) AS selected(id) LEFT JOIN public.profiles p ON p.id = selected.id WHERE p.id IS NULL) THEN
    RAISE EXCEPTION 'Invalid taxonomy association' USING ERRCODE = '23503';
  END IF;

  SELECT string_agg(c.name, ', ' ORDER BY c.name) INTO legacy_category FROM public.categories c WHERE c.id = ANY(_category_ids);
  SELECT coalesce(array_agg(o.name ORDER BY o.name), ARRAY[]::text[]) INTO legacy_occasions FROM public.occasions o WHERE o.id = ANY(coalesce(_occasion_ids, ARRAY[]::uuid[]));
  SELECT coalesce(array_agg(p.name ORDER BY p.name), ARRAY[]::text[]) INTO legacy_profiles FROM public.profiles p WHERE p.id = ANY(coalesce(_profile_ids, ARRAY[]::uuid[]));

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
    WHERE products.id = _product_id
    RETURNING products.id INTO saved_id;
    IF saved_id IS NULL THEN RAISE EXCEPTION 'Product not found' USING ERRCODE = 'P0002'; END IF;
  END IF;

  DELETE FROM public.product_categories pc WHERE pc.product_id = saved_id;
  DELETE FROM public.product_occasions po WHERE po.product_id = saved_id;
  DELETE FROM public.product_profiles pp WHERE pp.product_id = saved_id;
  INSERT INTO public.product_categories (product_id, category_id) SELECT saved_id, selected.id FROM unnest(_category_ids) AS selected(id) ON CONFLICT DO NOTHING;
  INSERT INTO public.product_occasions (product_id, occasion_id) SELECT saved_id, selected.id FROM unnest(coalesce(_occasion_ids, ARRAY[]::uuid[])) AS selected(id) ON CONFLICT DO NOTHING;
  INSERT INTO public.product_profiles (product_id, profile_id) SELECT saved_id, selected.id FROM unnest(coalesce(_profile_ids, ARRAY[]::uuid[])) AS selected(id) ON CONFLICT DO NOTHING;
  RETURN saved_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_save_product(uuid, jsonb, uuid[], uuid[], uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_save_product(uuid, jsonb, uuid[], uuid[], uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_product(uuid, jsonb, uuid[], uuid[], uuid[]) TO service_role;