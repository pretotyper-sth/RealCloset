-- Run once, then select this function in Authentication > Hooks > Before User Created.
-- Keep the Email provider enabled: existing password login and recovery still need it.
create or replace function public.hook_restrict_email_signup(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  -- app_metadata comes from Auth; user_metadata can be supplied by the client.
  if event->'user'->'app_metadata'->>'provider' = 'email' then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', '이메일 가입은 종료됐어요. 카카오나 구글로 시작해 주세요.'
    ));
  end if;
  return '{}'::jsonb;
end;
$$;
revoke execute on function public.hook_restrict_email_signup(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_restrict_email_signup(jsonb) to supabase_auth_admin;
