import type { ComponentType, SVGProps } from "react";
import {
  DashboardIcon,
  CalendarIcon,
  UsersIcon,
  TableIcon,
  ChartIcon,
  TagIcon,
  SettingsIcon,
  ShieldIcon,
} from "../components/icons";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type NavItem = {
  id: string;
  label: string;
  /** Hash path, e.g. "/admin". Ignored for disabled items. */
  path: string;
  icon: IconComponent;
  /** When true the item is rendered disabled and is not navigable. */
  comingSoon?: boolean;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

/**
 * Single source of truth for the sidebar. To ship a feature later:
 * remove `comingSoon: true`, add a page, and register it in AdminApp's
 * PAGES map. Nothing else needs to change.
 */
export const NAV_SECTIONS: NavSection[] = [
    {
    id: "main",
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", path: "/admin", icon: DashboardIcon },
      { id: "admins", label: "Admins", path: "/admin/admins", icon: ShieldIcon },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      { id: "bookings", label: "Bookings", path: "/admin/bookings", icon: CalendarIcon, comingSoon: true },
      { id: "customers", label: "Customers", path: "/admin/customers", icon: UsersIcon, comingSoon: true },
      { id: "activities", label: "Activities & Tables", path: "/admin/activities", icon: TableIcon, comingSoon: true },
      { id: "pricing", label: "Pricing", path: "/admin/pricing", icon: TagIcon, comingSoon: true },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      { id: "analytics", label: "Analytics", path: "/admin/analytics", icon: ChartIcon, comingSoon: true },
      { id: "settings", label: "Settings", path: "/admin/settings", icon: SettingsIcon, comingSoon: true },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/**
 * Optional UI-level allowlist. Leave empty to allow any authenticated
 * user. This is NOT a substitute for Row Level Security on your data.
 */
export const ALLOWED_ADMIN_EMAILS: string[] = [
  // "you@example.com",
];