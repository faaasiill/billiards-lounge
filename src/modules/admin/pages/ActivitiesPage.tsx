import { useCallback, useEffect, useMemo, useState } from "react";
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
import ActivityForm, { type FormKind } from "../components/ActivityForm";

type ViewState =
  | { mode: "list" }
  | { mode: "create"; kind: FormKind; parent?: AdminActivity }
  | { mode: "edit"; activity: AdminActivity };

const kindOf = (a: AdminActivity): FormKind =>
  a.is_group ? "group" : a.parent_id ? "variant" : "activity";

const playersLabel = (a: AdminActivity) =>
  a.min_players === a.max_players
    ? `${a.min_players} players`
    : `${a.min_players}-${a.max_players} players`;

const StatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
      active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
    }`}
  >
    {active ? "Active" : "Hidden"}
  </span>
);

const DurationChips = ({ activity }: { activity: AdminActivity }) =>
  activity.durations.length > 0 ? (
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
  ) : null;

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

  const topLevel = useMemo(() => activities.filter((a) => !a.parent_id), [activities]);

  const childrenOf = useCallback(
    (groupId: string) => activities.filter((a) => a.parent_id === groupId),
    [activities],
  );

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

  const backToList = () => {
    setView({ mode: "list" });
    void load();
  };

  /* ------------------------------ create ------------------------------ */
  if (view.mode === "create") {
    const { kind, parent } = view;
    const title =
      kind === "group"
        ? "New group"
        : kind === "variant" && parent
          ? `New ${parent.name} game type`
          : "New activity";
    const description =
      kind === "group"
        ? "A group (e.g. Billiards) holds game types such as Snooker and 8-Ball. Add the game types after creating it."
        : kind === "variant"
          ? "Set up this game type's players, tables, durations and pricing."
          : "Set up its name, images, players, durations and table count.";

    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={title} description={description} />
        <ActivityForm
          kind={kind}
          onCancel={backToList}
          onSubmit={async (input) => {
            const { error } = await createActivity({
              ...input,
              is_group: kind === "group",
              parent_id: parent?.id ?? null,
            });
            return { error };
          }}
        />
      </div>
    );
  }

  /* ------------------------------- edit ------------------------------- */
  if (view.mode === "edit") {
    const { activity } = view;
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={`Edit ${activity.name}`} description="Changes apply immediately." />
        <ActivityForm
          kind={kindOf(activity)}
          initial={activity}
          onCancel={backToList}
          onSubmit={async (input) => {
            const { error } = await updateActivity(activity.id, input);
            return { error };
          }}
        />
      </div>
    );
  }

  /* ------------------------------- list ------------------------------- */
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Activities & Tables"
          description="Manage bookable activities, their tables/resources, and duration pricing."
        />
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => setView({ mode: "create", kind: "group" })}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            + New group
          </button>
          <button
            onClick={() => setView({ mode: "create", kind: "activity" })}
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            + New activity
          </button>
        </div>
      </div>

      {rowError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
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
      ) : topLevel.length === 0 ? (
        <EmptyState
          title="No activities yet"
          description="Create your first bookable activity to get started."
          action={
            <button
              onClick={() => setView({ mode: "create", kind: "activity" })}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              New activity
            </button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topLevel.map((activity) => {
            const image = activity.images[0];
            const toggling = togglingId === activity.id;

            /* ---------------- Group card (e.g. Billiards) ---------------- */
            if (activity.is_group) {
              const kids = childrenOf(activity.id);

              return (
                <li
                  key={activity.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white sm:col-span-2 lg:col-span-3"
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                    <div
                      className="h-24 w-full shrink-0 rounded-xl bg-neutral-100 bg-cover bg-center sm:w-40"
                      style={image ? { backgroundImage: `url(${image})` } : undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-neutral-900">{activity.name}</h3>
                          <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                            Group
                          </span>
                        </div>
                        <StatusBadge active={activity.is_active} />
                      </div>
                      {activity.short_description && (
                        <p className="mt-1 text-xs text-neutral-500">{activity.short_description}</p>
                      )}
                      <p className="mt-1 text-xs text-neutral-400">
                        {kids.length} game {kids.length === 1 ? "type" : "types"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => setView({ mode: "edit", activity })}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          Edit group
                        </button>
                        <button
                          onClick={() => void handleToggleActive(activity)}
                          disabled={toggling}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                        >
                          {toggling && <Spinner className="h-3 w-3" />}
                          {activity.is_active ? "Hide" : "Unhide"}
                        </button>
                        <button
                          onClick={() => setView({ mode: "create", kind: "variant", parent: activity })}
                          className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800"
                        >
                          + Add game type
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Game types */}
                  <div className="border-t border-neutral-100 bg-neutral-50/60 p-3 sm:p-4">
                    {kids.length === 0 ? (
                      <p className="px-1 py-3 text-center text-xs text-neutral-500">
                        No game types yet. Add Snooker, 8-Ball, etc. Customers won't see this group until it has
                        at least one bookable game type.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2.5">
                        {kids.map((kid) => (
                          <li
                            key={kid.id}
                            className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 flex-col gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-semibold text-neutral-900">{kid.name}</h4>
                                <StatusBadge active={kid.is_active} />
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                                <span>{playersLabel(kid)}</span>
                                <span>
                                  {kid.table_count} {kid.table_count === 1 ? "table" : "tables"}
                                </span>
                                <span>From ₹{kid.starting_price}</span>
                              </div>
                              <DurationChips activity={kid} />
                            </div>

                            <div className="flex shrink-0 gap-2">
                              <button
                                onClick={() => setView({ mode: "edit", activity: kid })}
                                className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => void handleToggleActive(kid)}
                                disabled={togglingId === kid.id}
                                className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                              >
                                {togglingId === kid.id && <Spinner className="h-3 w-3" />}
                                {kid.is_active ? "Hide" : "Unhide"}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            }

            /* ------------- Normal activity card (unchanged look) ------------- */
            return (
              <li
                key={activity.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white"
              >
                <div
                  className="h-32 bg-neutral-100 bg-cover bg-center"
                  style={image ? { backgroundImage: `url(${image})` } : undefined}
                />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-neutral-900">{activity.name}</h3>
                      <StatusBadge active={activity.is_active} />
                    </div>
                    {activity.short_description && (
                      <p className="mt-1 text-xs text-neutral-500">{activity.short_description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                    <span>{playersLabel(activity)}</span>
                    <span>
                      {activity.table_count} {activity.table_count === 1 ? "table" : "tables"}
                    </span>
                    <span>From ₹{activity.starting_price}</span>
                  </div>

                  <DurationChips activity={activity} />

                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setView({ mode: "edit", activity })}
                      className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void handleToggleActive(activity)}
                      disabled={toggling}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                    >
                      {toggling && <Spinner className="h-3 w-3" />}
                      {activity.is_active ? "Hide" : "Unhide"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const PageHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <section>
    <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
      {title}
    </h2>
    <p className="mt-1 text-sm text-neutral-500">{description}</p>
  </section>
);

export default ActivitiesPage;