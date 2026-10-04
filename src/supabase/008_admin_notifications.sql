-- =====================================================================
-- 008_admin_notifications.sql  (ADMIN-ONLY notification system)
-- Run in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

-- ---------- settings (singleton) ----------
create table if not exists public.notification_settings (
  id smallint primary key default 1 check (id = 1),
  telegram_enabled boolean not null default false,
  ntfy_enabled boolean not null default false,
  arrival_lead_minutes integer not null default 30
    check (arrival_lead_minutes between 1 and 1440),
  routing jsonb not null default '{
    "new_booking":      {"telegram": true, "ntfy": true},
    "arrival_reminder": {"telegram": true, "ntfy": true},
    "booking_start":    {"telegram": true, "ntfy": true}
  }'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.notification_settings (id) values (1) on conflict (id) do nothing;

-- ---------- telegram destinations (multiple admins / groups) ----------
create table if not exists public.telegram_destinations (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null unique check (chat_id ~ '^-?[0-9]+$'),
  label text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);

-- ---------- event queue (one row per booking + event + start instant) ----------
create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  booking_code text not null,
  event_type text not null
    check (event_type in ('new_booking','arrival_reminder','booking_start')),
  basis_start_at timestamptz not null,   -- the booking start this event was scheduled for
  due_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','processing','done','failed','skipped','cancelled')),
  reason text,
  attempts integer not null default 0,
  locked_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- IDEMPOTENCY: the same booking can never get the same event twice for the same start time.
create unique index if not exists notification_events_idempotency
  on public.notification_events (booking_id, event_type, basis_start_at);
create index if not exists notification_events_due
  on public.notification_events (due_at) where status in ('pending','processing');

-- ---------- per-channel delivery log ----------
create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.notification_events(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  booking_code text,
  event_type text not null
    check (event_type in ('new_booking','arrival_reminder','booking_start','test')),
  channel text not null check (channel in ('telegram','ntfy')),
  destination_key text not null,
  destination_label text,
  status text not null default 'pending'
    check (status in ('pending','sent','failed','skipped')),
  attempts integer not null default 0,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- IDEMPOTENCY: event + channel + destination is delivered once (test rows have NULL event_id).
create unique index if not exists notification_deliveries_idempotency
  on public.notification_deliveries (event_id, channel, destination_key);
create index if not exists notification_deliveries_recent
  on public.notification_deliveries (created_at desc);

-- ---------- RLS: admins only ----------
alter table public.notification_settings   enable row level security;
alter table public.telegram_destinations   enable row level security;
alter table public.notification_events     enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists notification_settings_admin_select on public.notification_settings;
drop policy if exists notification_settings_admin_update on public.notification_settings;
create policy notification_settings_admin_select on public.notification_settings
  for select to authenticated using (public.is_admin());
create policy notification_settings_admin_update on public.notification_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists telegram_destinations_admin_all on public.telegram_destinations;
create policy telegram_destinations_admin_all on public.telegram_destinations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists notification_events_admin_select on public.notification_events;
create policy notification_events_admin_select on public.notification_events
  for select to authenticated using (public.is_admin());

drop policy if exists notification_deliveries_admin_select on public.notification_deliveries;
create policy notification_deliveries_admin_select on public.notification_deliveries
  for select to authenticated using (public.is_admin());
-- No insert/update/delete policies on events/deliveries: only the service role (Edge Functions) writes.

-- ---------- settings housekeeping ----------
create or replace function public.trg_notification_settings_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

drop trigger if exists notification_settings_touch on public.notification_settings;
create trigger notification_settings_touch
  before update on public.notification_settings
  for each row execute function public.trg_notification_settings_touch();

-- Changing the lead time re-times reminders that are still waiting.
create or replace function public.trg_notification_lead_changed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.notification_events
     set due_at = basis_start_at - make_interval(mins => new.arrival_lead_minutes)
   where event_type = 'arrival_reminder' and status = 'pending';
  return new;
end $$;

drop trigger if exists notification_lead_changed on public.notification_settings;
create trigger notification_lead_changed
  after update of arrival_lead_minutes on public.notification_settings
  for each row
  when (old.arrival_lead_minutes is distinct from new.arrival_lead_minutes)
  execute function public.trg_notification_lead_changed();

-- ---------- poke the dispatcher (async HTTP via pg_net; never blocks the booking) ----------
create or replace function public.poke_dispatcher()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'notify_dispatch_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'notify_dispatch_secret';
  if v_url is null or v_secret is null then
    return; -- not configured yet; cron/other pokes will catch up later
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-dispatch-secret', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
exception when others then
  raise warning 'poke_dispatcher failed: %', sqlerrm;
end $$;

revoke all on function public.poke_dispatcher() from public, anon, authenticated;

-- ---------- scheduling helper for the two time-based events ----------
create or replace function public._schedule_booking_events(b public.bookings)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_lead integer;
  v_reminder_at timestamptz;
begin
  select arrival_lead_minutes into v_lead from public.notification_settings where id = 1;
  v_lead := coalesce(v_lead, 30);
  v_reminder_at := b.start_at - make_interval(mins => v_lead);

  -- ARRIVAL REMINDER
  if v_reminder_at <= now() then
    -- Booking made inside the lead window: the reminder moment has already passed.
    -- Rule: no reminder at all (a "30 minutes" message would be false). The admin
    -- already got the NEW BOOKING alert, and the BOOKING START alert still fires.
    insert into public.notification_events
      (booking_id, booking_code, event_type, basis_start_at, due_at, status, reason, processed_at)
    values
      (b.id, b.booking_code, 'arrival_reminder', b.start_at, v_reminder_at, 'skipped', 'lead_window_missed', now())
    on conflict (booking_id, event_type, basis_start_at) do nothing;
  else
    insert into public.notification_events
      (booking_id, booking_code, event_type, basis_start_at, due_at)
    values
      (b.id, b.booking_code, 'arrival_reminder', b.start_at, v_reminder_at)
    on conflict (booking_id, event_type, basis_start_at) do update
      set status = 'pending', due_at = excluded.due_at, reason = null,
          attempts = 0, locked_at = null, processed_at = null
      where public.notification_events.status = 'cancelled';
  end if;

  -- BOOKING START
  insert into public.notification_events
    (booking_id, booking_code, event_type, basis_start_at, due_at)
  values
    (b.id, b.booking_code, 'booking_start', b.start_at, b.start_at)
  on conflict (booking_id, event_type, basis_start_at) do update
    set status = 'pending', due_at = excluded.due_at, reason = null,
        attempts = 0, locked_at = null, processed_at = null
    where public.notification_events.status = 'cancelled';
end $$;

-- ---------- booking triggers (failures here must NEVER break a booking) ----------
create or replace function public.trg_booking_insert_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    if new.status = 'confirmed' then
      insert into public.notification_events
        (booking_id, booking_code, event_type, basis_start_at, due_at)
      values (new.id, new.booking_code, 'new_booking', new.start_at, now())
      on conflict (booking_id, event_type, basis_start_at) do nothing;

      perform public._schedule_booking_events(new);
      perform public.poke_dispatcher();
    end if;
  exception when others then
    raise warning 'notification enqueue failed for booking %: %', new.id, sqlerrm;
  end;
  return new;
end $$;

create or replace function public.trg_booking_update_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    if new.status <> 'confirmed' then
      -- Cancelled (or any non-confirmed state): nothing may fire any more.
      update public.notification_events
         set status = 'cancelled', reason = 'booking_' || new.status,
             processed_at = now(), locked_at = null
       where booking_id = new.id and status in ('pending','processing');
    else
      -- Rescheduled: retire waiting reminders for the OLD time, then schedule for the NEW time.
      update public.notification_events
         set status = 'cancelled', reason = 'rescheduled', processed_at = now(), locked_at = null
       where booking_id = new.id
         and status in ('pending','processing')
         and event_type in ('arrival_reminder','booking_start')
         and basis_start_at <> new.start_at;

      perform public._schedule_booking_events(new);
      perform public.poke_dispatcher();
    end if;
  exception when others then
    raise warning 'notification re-sync failed for booking %: %', new.id, sqlerrm;
  end;
  return new;
end $$;

create or replace function public.trg_booking_delete_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    update public.notification_events
       set status = 'cancelled', reason = 'booking_deleted', processed_at = now(), locked_at = null
     where booking_id = old.id and status in ('pending','processing');
  exception when others then
    raise warning 'notification cancel-on-delete failed for booking %: %', old.id, sqlerrm;
  end;
  return old;
end $$;

drop trigger if exists bookings_notify_insert on public.bookings;
create trigger bookings_notify_insert
  after insert on public.bookings
  for each row execute function public.trg_booking_insert_notify();

drop trigger if exists bookings_notify_update on public.bookings;
create trigger bookings_notify_update
  after update of status, start_at on public.bookings
  for each row
  when (old.status is distinct from new.status or old.start_at is distinct from new.start_at)
  execute function public.trg_booking_update_notify();

drop trigger if exists bookings_notify_delete on public.bookings;
create trigger bookings_notify_delete
  before delete on public.bookings
  for each row execute function public.trg_booking_delete_notify();

-- ---------- queue claim (used only by the dispatcher Edge Function) ----------
create or replace function public.claim_due_notification_events(p_limit integer default 20)
returns setof public.notification_events
language plpgsql security definer set search_path = public as $$
begin
  return query
  with due as (
    select id
      from public.notification_events
     where (status = 'pending' and due_at <= now())
        or (status = 'processing' and locked_at < now() - interval '5 minutes')  -- crashed worker
     order by due_at
     limit greatest(1, least(p_limit, 100))
     for update skip locked                                                      -- parallel runs never share rows
  )
  update public.notification_events e
     set status = 'processing', locked_at = now(), attempts = e.attempts + 1
    from due
   where e.id = due.id
  returning e.*;
end $$;

revoke all on function public.claim_due_notification_events(integer) from public, anon, authenticated;
grant execute on function public.claim_due_notification_events(integer) to service_role;