CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND lower(NEW.email) IN ('zennito394@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email_confirmed_at IS NOT NULL AND lower(email) IN ('zennito394@gmail.com')
ON CONFLICT DO NOTHING;