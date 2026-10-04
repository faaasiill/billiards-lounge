-- =====================================================================
-- 009_notification_cron.sql
-- Run AFTER deploying the Edge Functions and creating the two vault secrets.
-- =====================================================================
create extension if not exists pg_net;
create extension if not exists pg_cron;
create extension if not exists supabase_vault;

-- Run these two ONCE by hand with your real values (do not commit them):
--   select vault.create_secret('https://<PROJECT_REF>.supabase.co/functions/v1/notify-dispatch', 'notify_dispatch_url');
--   select vault.create_secret('<exactly the same value as the DISPATCH_SECRET function secret>', 'notify_dispatch_secret');

-- Sweep every minute: sends due reminders / start alerts and retries failures.
select cron.schedule('notify-dispatch', '* * * * *', $$select public.poke_dispatcher();$$);

-- Daily cleanup of history older than 90 days.
select cron.schedule('notify-cleanup', '15 3 * * *', $$
  delete from public.notification_deliveries where created_at < now() - interval '90 days';
  delete from public.notification_events
   where status in ('done','failed','skipped','cancelled') and created_at < now() - interval '90 days';
$$);

-- Tighter timing (optional): select cron.schedule('notify-dispatch', '30 seconds', $$select public.poke_dispatcher();$$);
-- Stop everything:           select cron.unschedule('notify-dispatch');