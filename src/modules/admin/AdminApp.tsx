import type { ComponentType } from "react";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { matchRouteParam, useAdminRoute } from "./hooks/useAdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import AdminsPage from "./pages/AdminsPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import SettingsPage from "./pages/SettingsPage";
import BookingsPage from "./pages/BookingsPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailsPage from "./pages/CustomerDetailsPage";
import AnalyticsPage from "./pages/Analyticspage";
import { ALL_NAV_ITEMS } from "./config/navigation";

/**
 * Registry of live admin pages, keyed by nav item id. To ship a feature:
 * build the page, add it here, and remove `comingSoon` in navigation.ts.
 */
const PAGES: Record<string, ComponentType> = {
  dashboard: DashboardPage,
  admins: AdminsPage,
  bookings: BookingsPage,
  customers: CustomersPage,
  activities: ActivitiesPage,
  analytics: AnalyticsPage,
  settings: SettingsPage,
};

const AdminRoutes = () => {
  const { path, navigate } = useAdminRoute();

  if (path === "/admin-login") return <LoginPage />;

  // Detail route: /admin/customers/:id (not shown in the sidebar).
  const customerId = matchRouteParam(path, "/admin/customers");
  if (customerId) {
    return (
      <ProtectedRoute>
        <AdminLayout title="Customer" currentPath="/admin/customers" onNavigate={navigate}>
          {/* key forces a fresh load when moving between two customers */}
          <CustomerDetailsPage key={customerId} customerId={customerId} />
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  const item = ALL_NAV_ITEMS.find((n) => n.path === path);
  const Page = item && !item.comingSoon ? PAGES[item.id] : undefined;

  const title = item?.label ?? "Not found";
  const activePath = item?.path ?? path;

  return (
    <ProtectedRoute>
      <AdminLayout title={title} currentPath={activePath} onNavigate={navigate}>
        {Page ? (
          <Page />
        ) : item?.comingSoon ? (
          <ComingSoonPage feature={item.label} />
        ) : (
          <ComingSoonPage feature="This page" />
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
};

const AdminApp = () => (
  <AdminAuthProvider>
    <AdminRoutes />
  </AdminAuthProvider>
);

export default AdminApp;