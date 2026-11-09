REVOKE UPDATE ON public.generations FROM authenticated;
GRANT UPDATE (saved) ON public.generations TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.credit_balances FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.usage_records FROM authenticated;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url) ON public.profiles TO authenticated;