import { useAdminAuth } from "../context/AdminAuthContext";
import EmptyState from "../components/EmptyState";
import { ALL_NAV_ITEMS } from "../config/navigation";

const DashboardPage = () => {
  const { user } = useAdminAuth();

  const name =
    (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    user?.email?.split("@")[0] ||
    "there";

  const upcoming = ALL_NAV_ITEMS.filter((item) => item.comingSoon);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Welcome back, {name}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          You're signed in. More admin tools will appear here as they're released.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-neutral-900">On the roadmap</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 opacity-70"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                  <Icon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">{item.label}</p>
                  <p className="text-xs text-neutral-400">Coming soon</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-neutral-900">Recent activity</h3>
        <EmptyState
          title="Nothing to show yet"
          description="Activity from bookings and customers will appear here once those features are enabled."
        />
      </section>
    </div>
  );
};

export default DashboardPage;