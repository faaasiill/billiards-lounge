import { useCallback, useEffect, useState } from "react";
import {
  listActivities,
  createActivity,
  updateActivity,
  setActivityActive,
  type AdminActivity,
} from "../services/activitiesService";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Spinner from "../components/Spinner";
import ActivityForm from "../components/ActivityForm";

type ViewState = { mode: "list" } | { mode: "create" } | { mode: "edit"; activity: AdminActivity };

const ActivitiesPage = () => {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>({ mode: "list" });
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await listActivities();
    setActivities(data);
    setLoadError(error);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const handleToggleActive = async (activity: AdminActivity) => {
    setTogglingId(activity.id);
    setRowError(null);
    const { error } = await setActivityActive(activity.id, !activity.is_active);
    setTogglingId(null);

    if (error) {
      setRowError(error);
      return;
    }
    void load();
  };

  if (view.mode === "create") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="New activity"
          description="Set up its name, images, players, durations and table count."
        />
        <ActivityForm
          onCancel={() => {
            setView({ mode: "list" });
            void load();
          }}
          onSubmit={async (input) => {
            const { error } = await createActivity(input);
            return { error };
          }}
        />
      </div>
    );
  }

  if (view.mode === "edit") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={`Edit ${view.activity.name}`} description="Changes apply immediately." />
        <ActivityForm
          initial={view.activity}
          onCancel={() => {
            setView({ mode: "list" });
            void load();
          }}
          onSubmit={async (input) => {
            const { error } = await updateActivity(view.activity.id, input);
            return { error };
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Activities & Tables"
          description="Manage bookable activities, their tables/resources, and duration pricing."
        />
        <button
          onClick={() => setView({ mode: "create" })}
          className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          + New activity
        </button>
      </div>

      {rowError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {rowError}
        </p>
      )}

      {loading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-14 text-sm text-neutral-500"
        >
          <Spinner className="h-5 w-5" />
          Loading activities…
        </div>
      ) : loadError ? (
        <ErrorState
          description={loadError}
          action={
            <button
              onClick={() => void load()}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Try again
            </button>
          }
        />
      ) : activities.length === 0 ? (
        <EmptyState
          title="No activities yet"
          description="Create your first bookable activity to get started."
          action={
            <button
              onClick={() => setView({ mode: "create" })}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              New activity
            </button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white"
            >
              <div
                className="h-32 bg-neutral-100 bg-cover bg-center"
                style={activity.images[0] ? { backgroundImage: `url(${activity.images[0]})` } : undefined}
              />
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900">{activity.name}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                        activity.is_active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {activity.is_active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  {activity.short_description && (
                    <p className="mt-1 text-xs text-neutral-500">{activity.short_description}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                  <span>
                    {activity.min_players === activity.max_players
                      ? `${activity.min_players} players`
                      : `${activity.min_players}-${activity.max_players} players`}
                  </span>
                  <span>
                    {activity.table_count} {activity.table_count === 1 ? "table" : "tables"}
                  </span>
                  <span>From ₹{activity.starting_price}</span>
                </div>

                {activity.durations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {activity.durations.map((d) => (
                      <span
                        key={d.id}
                        className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600"
                      >
                        {d.label} · ₹{d.price}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setView({ mode: "edit", activity })}
                    className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleToggleActive(activity)}
                    disabled={togglingId === activity.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    {togglingId === activity.id && <Spinner className="h-3 w-3" />}
                    {activity.is_active ? "Hide" : "Unhide"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const PageHeader = ({ title, description }: { title: string; description: string }) => (
  <section>
    <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">{title}</h2>
    <p className="mt-1 text-sm text-neutral-500">{description}</p>
  </section>
);

export default ActivitiesPage;