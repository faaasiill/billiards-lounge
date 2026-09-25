src/modules/admin/
  AdminApp.tsx                       — registers AnalyticsPage, drops Pricing route
  config/navigation.ts               — reordered nav, Pricing removed
  pages/DashboardPage.tsx            — new landing page
  pages/AnalyticsPage.tsx            — new Analytics page
  pages/AdminsPage.tsx               — adds "Create new admin" tab
  services/dashboardService.ts       — new
  services/analyticsService.ts       — new
  services/adminsService.ts          — adds createAdminAccount()
  components/DashboardSkeletons.tsx  — new (DashboardSkeleton, AnalyticsSkeleton)

supabase/
  functions/create-admin/index.ts    — Edge Function, creates auth user + grants admin
  migrations/add_admin_rpcs.sql      — is_admin/add_admin_by_email/remove_admin RPCs