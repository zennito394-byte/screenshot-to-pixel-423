-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Credit balances (read-only for users; changed only by server-side functions)
CREATE TABLE public.credit_balances (
  user_id UUID PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  plan TEXT NOT NULL DEFAULT 'free',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_balances TO authenticated;
GRANT ALL ON public.credit_balances TO service_role;
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own credits" ON public.credit_balances FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Generations (history; saved=true means it appears in My Creations)
CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_id TEXT NOT NULL,
  category TEXT NOT NULL,
  style TEXT NOT NULL,
  custom_prompt TEXT,
  avoid_prompt TEXT,
  aspect_ratio TEXT NOT NULL,
  output_size TEXT,
  model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','succeeded','failed')),
  error_message TEXT,
  original_path TEXT,
  result_path TEXT,
  saved BOOLEAN NOT NULL DEFAULT false,
  credits_charged INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, request_id)
);
CREATE INDEX generations_user_created_idx ON public.generations (user_id, created_at DESC);
GRANT SELECT, DELETE ON public.generations TO authenticated;
GRANT UPDATE (saved) ON public.generations TO authenticated;
GRANT ALL ON public.generations TO service_role;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own generations" ON public.generations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own generations" ON public.generations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own generations" ON public.generations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Usage ledger
CREATE TABLE public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  generation_id UUID,
  credits_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX usage_records_user_idx ON public.usage_records (user_id, created_at DESC);
GRANT SELECT ON public.usage_records TO authenticated;
GRANT ALL ON public.usage_records TO service_role;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own usage" ON public.usage_records FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- New user: profile + free credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credit_balances (user_id, credits, plan)
  VALUES (NEW.id, 10, 'free')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.usage_records (user_id, credits_delta, reason)
  VALUES (NEW.id, 10, 'signup_free_credits');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atomic credit deduction, server-only (service_role)
CREATE OR REPLACE FUNCTION public.consume_generation_credit(_user_id UUID, _generation_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  remaining INTEGER;
BEGIN
  UPDATE public.credit_balances
     SET credits = credits - 1, updated_at = now()
   WHERE user_id = _user_id AND credits >= 1
  RETURNING credits INTO remaining;

  IF remaining IS NULL THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  UPDATE public.generations
     SET credits_charged = 1
   WHERE id = _generation_id AND user_id = _user_id;

  INSERT INTO public.usage_records (user_id, generation_id, credits_delta, reason)
  VALUES (_user_id, _generation_id, -1, 'generation');

  RETURN remaining;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_generation_credit(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_generation_credit(UUID, UUID) TO service_role;