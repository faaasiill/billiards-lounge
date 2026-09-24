import { NAV_SECTIONS, type NavItem } from "../config/navigation";
import { CloseIcon } from "./icons";

type AdminSidebarProps = {
  currentPath: string;
  onNavigate: (path: string) => void;
  /** Mobile drawer state; ignored on lg+ where the sidebar is static. */
  open: boolean;
  onClose: () => void;
};

const itemBase =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";

const SidebarItem = ({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: (path: string) => void;
}) => {
  const Icon = item.icon;

  if (item.comingSoon) {
    return (
      <li>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Coming soon"
          className={`${itemBase} cursor-not-allowed text-neutral-400`}
        >
          <Icon className="shrink-0 opacity-60" />
          <span className="flex-1 truncate text-left">{item.label}</span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Soon
          </span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onNavigate(item.path)}
        aria-current={active ? "page" : undefined}
        className={`${itemBase} ${
          active
            ? "bg-neutral-900 font-medium text-white"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        }`}
      >
        <Icon className="shrink-0" />
        <span className="flex-1 truncate text-left">{item.label}</span>
      </button>
    </li>
  );
};

const AdminSidebar = ({ currentPath, onNavigate, open, onClose }: AdminSidebarProps) => {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-neutral-900/40 transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Admin navigation"
                className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out lg:static lg:w-64 lg:max-w-none lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5 pt-[env(safe-area-inset-top)] box-content">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-sm font-semibold text-white">
              B
            </span>
            <span className="text-sm font-semibold tracking-tight text-neutral-900">
              Billiards Admin
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.id} className="mb-6 last:mb-0">
              <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                {section.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    active={currentPath === item.path}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;