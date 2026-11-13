-- Nightly top-up: anyone below the daily floor goes back up to it; balances above it (incl. bought credits) are untouched.
CREATE OR REPLACE FUNCTION public.daily_credit_topup(_floor INTEGER DEFAULT 5)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _count INTEGER;
BEGIN
  WITH topped AS (
    UPDATE public.credit_balances
       SET credits = _floor, updated_at = now()
     WHERE credits < _floor
    RETURNING user_id, _floor - credits AS old_gap
  )
  SELECT count(*) INTO _count FROM topped;
  RETURN _count;
END;
$$;
REVOKE ALL ON FUNCTION public.daily_credit_topup(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.daily_credit_topup(INTEGER) TO service_role;