import type { ComponentType } from "react";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { useAdminRoute } from "./hooks/useAdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import AdminsPage from "./pages/AdminsPage";
import { ALL_NAV_ITEMS } from "./config/navigation";

/**
 * Registry of live admin pages, keyed by nav item id. To ship a feature:
 * build the page, add it here, and remove `comingSoon` in navigation.ts.
 */
const PAGES: Record<string, ComponentType> = {
  dashboard: DashboardPage,
  admins: AdminsPage,
};

const AdminRoutes = () => {
  const { path, navigate } = useAdminRoute();

  if (path === "/admin-login") return <LoginPage />;

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