CREATE OR REPLACE FUNCTION public.daily_credit_topup(_floor INTEGER DEFAULT 5)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _count INTEGER;
BEGIN
  WITH low AS (
    SELECT user_id, credits FROM public.credit_balances WHERE credits < _floor FOR UPDATE
  ), upd AS (
    UPDATE public.credit_balances b
       SET credits = _floor, updated_at = now()
      FROM low
     WHERE b.user_id = low.user_id
    RETURNING b.user_id, _floor - low.credits AS delta
  )
  INSERT INTO public.usage_records (user_id, credits_delta, reason)
  SELECT user_id, delta, 'daily_topup' FROM upd;
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;
REVOKE ALL ON FUNCTION public.daily_credit_topup(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.daily_credit_topup(INTEGER) TO service_role;