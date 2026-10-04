supabase/008_admin_notifications.sql        tables, RLS, triggers, queue-claim function
supabase/009_notification_cron.sql          pg_cron schedule (+ vault instructions)
supabase/config.toml.snippet                verify_jwt = false for the two functions
supabase/functions/_shared/*                types, channels (telegram, ntfy), messages, time, deliver, db
supabase/functions/notify-dispatch/         queue worker (cron + instant poke)
supabase/functions/notification-admin/      status, test sends, chat detection, ntfy details (admin only)
src/modules/admin/services/notificationsService.ts
src/modules/admin/pages/NotificationsPage.tsx
src/modules/admin/components/notifications/*   Toggle, Badge, ServicesCard, EventMatrixCard, TimingCard,
                                                TelegramDestinationsCard, NtfySetupCard, HistoryCard
+ 3 small edits: see EDITS_TO_EXISTING_FILES.md