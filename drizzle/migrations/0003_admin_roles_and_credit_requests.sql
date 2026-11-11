-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

-- Owner admin: granted automatically once this email is confirmed
CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND lower(NEW.email) IN ('zennito@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_admin_check
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email_confirmed_at IS NOT NULL AND lower(email) IN ('zennito@gmail.com')
ON CONFLICT DO NOTHING;

-- Credit pack price list (server-side source of truth)
CREATE OR REPLACE FUNCTION public.credit_pack_info(_pack TEXT, OUT credits INTEGER, OUT price_cents INTEGER)
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT v.credits, v.price_cents FROM (VALUES
    ('starter', 50, 500),
    ('creator', 150, 1200),
    ('pro', 500, 3500)
  ) AS v(pack, credits, price_cents)
  WHERE v.pack = _pack
$$;

-- Credit purchase requests (manual payment, approved by an admin)
CREATE TABLE public.credit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pack TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  handled_at TIMESTAMPTZ,
  handled_by UUID
);
CREATE INDEX credit_requests_user_idx ON public.credit_requests (user_id, created_at DESC);
CREATE INDEX credit_requests_status_idx ON public.credit_requests (status, created_at DESC);
GRANT SELECT ON public.credit_requests TO authenticated;
GRANT ALL ON public.credit_requests TO service_role;
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own credit requests" ON public.credit_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all credit requests" ON public.credit_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User: request a pack (one pending request at a time)
CREATE OR REPLACE FUNCTION public.request_credit_pack(_pack TEXT, _note TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  info RECORD;
  new_id UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  SELECT * INTO info FROM public.credit_pack_info(_pack);
  IF info.credits IS NULL THEN RAISE EXCEPTION 'unknown_pack'; END IF;
  IF EXISTS (SELECT 1 FROM public.credit_requests WHERE user_id = uid AND status = 'pending') THEN
    RAISE EXCEPTION 'request_pending';
  END IF;
  INSERT INTO public.credit_requests (user_id, pack, credits, price_cents, note)
  VALUES (uid, _pack, info.credits, info.price_cents, NULLIF(left(trim(coalesce(_note, '')), 500), ''))
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
REVOKE ALL ON FUNCTION public.request_credit_pack(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_credit_pack(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_credit_request(_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.credit_requests SET status = 'cancelled', handled_at = now()
  WHERE id = _id AND user_id = auth.uid() AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_credit_request(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_credit_request(UUID) TO authenticated;

-- Admin: add or remove credits
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(_user_id UUID, _amount INTEGER, _reason TEXT DEFAULT NULL)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  remaining INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _amount = 0 OR _amount < -10000 OR _amount > 10000 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  INSERT INTO public.credit_balances (user_id, credits) VALUES (_user_id, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.credit_balances
     SET credits = GREATEST(0, credits + _amount), updated_at = now()
   WHERE user_id = _user_id
  RETURNING credits INTO remaining;

  INSERT INTO public.usage_records (user_id, credits_delta, reason)
  VALUES (_user_id, _amount, CASE WHEN _amount > 0 THEN 'admin_grant' ELSE 'admin_remove' END
          || COALESCE(': ' || NULLIF(left(trim(_reason), 200), ''), ''));
  RETURN remaining;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_adjust_credits(UUID, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_credits(UUID, INTEGER, TEXT) TO authenticated;

-- Admin: approve or decline a request (approve adds the credits)
CREATE OR REPLACE FUNCTION public.admin_resolve_credit_request(_id UUID, _approve BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  req public.credit_requests%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO req FROM public.credit_requests WHERE id = _id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;

  UPDATE public.credit_requests
     SET status = CASE WHEN _approve THEN 'approved' ELSE 'declined' END,
         handled_at = now(), handled_by = auth.uid()
   WHERE id = _id;

  IF _approve THEN
    INSERT INTO public.credit_balances (user_id, credits) VALUES (req.user_id, 0) ON CONFLICT (user_id) DO NOTHING;
    UPDATE public.credit_balances SET credits = credits + req.credits, updated_at = now() WHERE user_id = req.user_id;
    INSERT INTO public.usage_records (user_id, credits_delta, reason)
    VALUES (req.user_id, req.credits, 'purchase: ' || req.pack);
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_resolve_credit_request(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_credit_request(UUID, BOOLEAN) TO authenticated;

-- Admin: overview numbers
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN json_build_object(
    'users', (SELECT count(*) FROM auth.users),
    'new_users_7d', (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '7 days'),
    'edits_succeeded', (SELECT count(*) FROM public.generations WHERE status = 'succeeded'),
    'edits_failed', (SELECT count(*) FROM public.generations WHERE status = 'failed'),
    'edits_24h', (SELECT count(*) FROM public.generations WHERE created_at > now() - interval '24 hours'),
    'pending_requests', (SELECT count(*) FROM public.credit_requests WHERE status = 'pending')
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_overview() TO authenticated;

-- Admin: users list
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id UUID, email TEXT, display_name TEXT, credits INTEGER, is_admin BOOLEAN,
  created_at TIMESTAMPTZ, last_sign_in_at TIMESTAMPTZ, edits_succeeded BIGINT, edits_failed BIGINT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT u.id, u.email::TEXT, p.display_name, COALESCE(c.credits, 0),
         EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin'),
         u.created_at, u.last_sign_in_at,
         (SELECT count(*) FROM public.generations g WHERE g.user_id = u.id AND g.status = 'succeeded'),
         (SELECT count(*) FROM public.generations g WHERE g.user_id = u.id AND g.status = 'failed')
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.credit_balances c ON c.user_id = u.id
  ORDER BY u.created_at DESC
  LIMIT 500;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- Admin: recent edits (no images, only details)
CREATE OR REPLACE FUNCTION public.admin_recent_generations(_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID, email TEXT, category TEXT, style TEXT, status TEXT, error_message TEXT,
  credits_charged INTEGER, created_at TIMESTAMPTZ
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT g.id, u.email::TEXT, g.category, g.style, g.status, g.error_message, g.credits_charged, g.created_at
  FROM public.generations g
  LEFT JOIN auth.users u ON u.id = g.user_id
  ORDER BY g.created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 200);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_recent_generations(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_recent_generations(INTEGER) TO authenticated;

-- Admin: credit requests with requester email
CREATE OR REPLACE FUNCTION public.admin_list_credit_requests()
RETURNS TABLE (
  id UUID, user_id UUID, email TEXT, pack TEXT, credits INTEGER, price_cents INTEGER, currency TEXT,
  note TEXT, status TEXT, created_at TIMESTAMPTZ, handled_at TIMESTAMPTZ
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT r.id, r.user_id, u.email::TEXT, r.pack, r.credits, r.price_cents, r.currency, r.note, r.status, r.created_at, r.handled_at
  FROM public.credit_requests r
  LEFT JOIN auth.users u ON u.id = r.user_id
  ORDER BY (r.status = 'pending') DESC, r.created_at DESC
  LIMIT 200;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_credit_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_credit_requests() TO authenticated;