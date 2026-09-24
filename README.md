# Admin Management: Activities & Tables + Application Settings

## What's included

```
sql/
  001_activities_settings_bookings.sql   -- schema, RLS
  002_availability.sql                   -- the dynamic availability algorithm (SQL functions)
src/modules/admin/
  AdminApp.tsx                           -- REPLACES your existing file (registers 2 new pages)
  config/navigation.ts                   -- REPLACES your existing file (un-comingSoons 2 nav items)
  pages/ActivitiesPage.tsx               -- NEW
  pages/SettingsPage.tsx                 -- NEW
  services/activitiesService.ts          -- NEW
  services/settingsService.ts            -- NEW
  components/ActivityForm.tsx            -- NEW
src/modules/booking/services/
  availabilityService.ts                 -- NEW (for the future customer flow)
```

## 1. Apply the SQL

Run both files against your Supabase project, in order, via the SQL editor or
`supabase db push` / a migration file. `001` assumes your existing `admins`
table + `is_admin()` function (used by the current Admins page) already
exist — everything here re-uses that same pattern for RLS.

`002` adds two `security invoker` Postgres functions:

- `get_activity_availability(activity_id, date, duration_minutes)` — returns
  every valid start time for that activity/date/duration.
- `find_available_table(activity_id, start_at, end_at)` — race-safe
  (`SKIP LOCKED`) first-fit table picker, used at booking-confirmation time.

Both are granted to `anon, authenticated` since the customer flow isn't
authenticated yet.

## 2. Drop in the TypeScript/React files

Copy `src/` into your project at the matching paths. `AdminApp.tsx` and
`navigation.ts` are full replacements of the files you pasted — the only
changes are registering `ActivitiesPage`/`SettingsPage` in the `PAGES` map
and removing `comingSoon: true` from those two nav items. Everything else
in those two files is untouched.

## 3. How the pieces fit together

**Activities** (`activities` + `activity_durations` + `activity_tables`):
- An activity's *durations* are its own price/length combinations (30 min,
  60 min, 90 min, ...), each independently priced.
- *Tables* are an interchangeable, auto-numbered pool (you chose the simple
  "just needs a count" model) — admin sets a table count, the app manages
  `Table 1..N` rows behind the scenes.
- **Nothing is ever hard-deleted.** Editing an activity reconciles the
  duration list and table count: removed durations/tables get
  `is_active = false` (retired), not deleted — so any booking that already
  references them stays valid, and the option just stops appearing for new
  bookings. Bookings also snapshot `activity_name` / `duration_label` /
  `duration_minutes` / `price` directly onto the row, so even if you rename
  the activity or change a duration's price next month, existing bookings
  still display exactly what the customer originally booked.

**Application Settings** (`club_settings` singleton + `club_closures`):
- One `club_settings` row holds working hours, weekly off days, and the
  club-wide cleanup buffer (applied uniformly across all activities/tables,
  per your spec — no per-activity override yet, but the schema wouldn't
  need to change to add one later, just an optional override column).
- `club_closures` holds specific date ranges (holidays/leave) on top of the
  weekly recurring days off.
- Both are read with `select using (true)` (public) so the future customer
  calendar can greg out closed dates, and written only by admins.

**The availability algorithm** (`get_activity_availability`):
- Walks each **active table independently**, starting from opening time and
  stepping forward by the **requested duration** (not a fixed grid) — so a
  30-minute request produces a `:00/:30` ladder and a 45-minute request
  produces its own separate ladder.
- When a candidate start time would overlap an existing booking on that
  table (respecting the buffer on both sides), the candidate jumps straight
  to `(that booking's end + buffer)` — this produces exactly the spec's
  example: a 10:00–10:30 booking with a 10-minute buffer makes that table's
  next candidate 10:40, not the next fixed `:30` boundary.
- A start time is returned to the caller if **any** active table is free for
  it. So with 5 tables and 1 occupied, the other 4 tables' normal ladder is
  completely untouched and unions straight in; only the busy table's own
  slice of time is recalculated. With 4 of 5 occupied, only the one free
  table's (correctly recalculated) times show up.
- `tables_available` is returned per start time too, in case the UI ever
  wants to show "3 tables free at 6pm" rather than a bare yes/no.

I hand-verified this stepping/jump logic against the spec's exact examples
(30-min-then-10-min-buffer case, "1 of 5 busy," and "4 of 5 busy") with a
standalone simulation before finalizing the SQL — all four matched the
expected behavior.

## 4. Wiring the future customer booking flow

`src/modules/booking/services/availabilityService.ts` gives you:

- `getActivityAvailability(activityId, date, durationMinutes)` → list of
  `{ startTime, startAt, tablesAvailable }` — drop-in replacement for
  `buildSlotsFor()` in `mockData.ts` once you're ready to switch
  `SlotGrid`/`BookingPage` over from mock data to Supabase. The current
  customer UI is untouched — this file is new and unused by any existing
  screen yet, exactly as requested.
- `createBooking(input)` → calls `find_available_table` then inserts the
  `bookings` row, returning a `bookingCode`. This is the real-data
  equivalent of the `Math.random()` booking-id logic currently inline in
  `BookingPage.tsx`'s `handleConfirm`.

Swapping `ACTIVITIES` (mock data) for real data: replace `mockData.ts`'s
`ACTIVITIES` export with a fetch from the `activities`/`activity_durations`
tables (the same shape `listActivities()` in `activitiesService.ts` already
returns, minus the admin-only `table_count` field) whenever you're ready to
move the customer flow off mock data — I left that swap for you since the
prompt asked to keep the customer UI unchanged for now.

## Notes / things worth knowing

- **Timezone**: `club_settings.open_time`/`close_time` are stored as plain
  `time` and combined with the date using `at time zone 'UTC'` in the SQL
  function. If your club isn't UTC, swap `'UTC'` for your actual IANA zone
  (e.g. `'Asia/Kolkata'`) in both `at time zone` casts inside
  `get_activity_availability`.
- **Peak-hour surcharge**: the current mock data has a flat `PEAK_SURCHARGE`
  based on fixed peak hours (6–8pm). That concept isn't in the new schema
  yet — `bookings.peak_surcharge` exists as a column so `createBooking()`
  can still record it, but nothing computes it server-side yet. Worth a
  small follow-up (e.g. a `peak_hours` range on `club_settings`) before
  wiring the real customer flow.
- **Admin bookings page**: not built here (out of scope for this pass), but
  the `bookings` table + RLS (`bookings_admin_all`) are ready for one.