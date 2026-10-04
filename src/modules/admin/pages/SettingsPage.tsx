import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  getClubSettings,
  updateClubSettings,
  getClubHours,
  updateClubHours,
  listClosures,
  addClosure,
  removeClosure,
  type ClubClosure,
} from "../services/settingsService";
import DangerZone from "../components/DangerZone";
import Toggle from "../components/notifications/Toggle";
import {
  DEFAULT_HOURS,
  WEEKDAY_NAMES,
  WEEK_ORDER,
  closesAfterMidnight,
  describeHours,
  toMinutes,
  type DayHours,
} from "../../../lib/clubHours";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

/* text-base on small screens stops iOS from zooming into the field on focus. */
const inputClass =
  "block w-full min-w-0 rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-base text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 disabled:opacity-70 sm:text-sm";

const labelClass = "mb-1.5 block text-xs font-medium text-neutral-700";

const primaryButton =
  "flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto";

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ---- weekly schedule ---- */
  const [hours, setHours] = useState<DayHours[]>(DEFAULT_HOURS);
  const [savedHours, setSavedHours] = useState<DayHours[]>(DEFAULT_HOURS);
  const [savingHours, setSavingHours] = useState(false);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [hoursSuccess, setHoursSuccess] = useState(false);

  /* ---- general settings ---- */
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState(false);

  /* ---- closures ---- */
  const [closures, setClosures] = useState<ClubClosure[]>([]);
  const [closuresLoading, setClosuresLoading] = useState(true);
  const [closureStart, setClosureStart] = useState("");
  const [closureEnd, setClosureEnd] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [closureKind, setClosureKind] = useState<"holiday" | "leave">(
    "holiday",
  );
  const [addingClosure, setAddingClosure] = useState(false);
  const [closureError, setClosureError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const [settingsRes, hoursRes] = await Promise.all([
      getClubSettings(),
      getClubHours(),
    ]);

    if (settingsRes.data) {
      setBufferMinutes(settingsRes.data.cleanup_buffer_minutes);
      setDefaultDuration(settingsRes.data.default_duration_minutes);
    }
    setHours(hoursRes.data);
    setSavedHours(hoursRes.data);

    setLoadError(settingsRes.error ?? hoursRes.error);
    setLoading(false);
  }, []);

  const loadClosures = useCallback(async () => {
    setClosuresLoading(true);
    const { data } = await listClosures();
    setClosures(data);
    setClosuresLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    void loadClosures();
  }, [load, loadClosures]);

  const hoursDirty = useMemo(
    () => JSON.stringify(hours) !== JSON.stringify(savedHours),
    [hours, savedHours],
  );

  const updateDay = (weekday: number, patch: Partial<DayHours>) => {
    setHoursSuccess(false);
    setHours((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)),
    );
  };

  const copyDayTo = (sourceWeekday: number, targets: number[]) => {
    const source = hours.find((d) => d.weekday === sourceWeekday);
    if (!source) return;
    setHoursSuccess(false);
    setHours((prev) =>
      prev.map((d) =>
        targets.includes(d.weekday)
          ? {
              ...d,
              is_open: source.is_open,
              open_time: source.open_time,
              close_time: source.close_time,
            }
          : d,
      ),
    );
  };

  const dayError = (day: DayHours): string | null => {
    if (!day.is_open) return null;
    if (!day.open_time || !day.close_time)
      return "Set both an opening and a closing time.";
    if (toMinutes(day.open_time) === toMinutes(day.close_time))
      return "Opening and closing time can't be the same.";
    return null;
  };

  const hasHoursErrors = hours.some((d) => dayError(d) !== null);

  const handleSaveHours = async () => {
    if (savingHours || hasHoursErrors) return;
    setSavingHours(true);
    setHoursError(null);
    setHoursSuccess(false);

    const { error } = await updateClubHours(hours);
    setSavingHours(false);

    if (error) {
      setHoursError(error);
      return;
    }
    setSavedHours(hours);
    setHoursSuccess(true);
  };

  const handleSaveGeneral = async (e: FormEvent) => {
    e.preventDefault();
    if (savingGeneral) return;
    setSavingGeneral(true);
    setGeneralError(null);
    setGeneralSuccess(false);

    const { error } = await updateClubSettings({
      cleanup_buffer_minutes: bufferMinutes,
      default_duration_minutes: defaultDuration,
    });

    setSavingGeneral(false);
    if (error) {
      setGeneralError(error);
      return;
    }
    setGeneralSuccess(true);
  };

  const handleAddClosure = async (e: FormEvent) => {
    e.preventDefault();
    if (addingClosure) return;

    if (!closureStart || !closureEnd) {
      setClosureError("Pick both a start and end date.");
      return;
    }

    setClosureError(null);
    setAddingClosure(true);

    const { error } = await addClosure({
      start_date: closureStart,
      end_date: closureEnd,
      reason: closureReason,
      kind: closureKind,
    });

    setAddingClosure(false);
    if (error) {
      setClosureError(error);
      return;
    }

    setClosureStart("");
    setClosureEnd("");
    setClosureReason("");
    void loadClosures();
  };

  const handleRemoveClosure = async (id: string) => {
    setRemovingId(id);
    await removeClosure(id);
    setRemovingId(null);
    void loadClosures();
  };

  if (loading) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-14 text-sm text-neutral-500"
      >
        <Spinner className="h-5 w-5" />
        Loading settings…
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        description={`${loadError} If you haven't yet, run supabase/001_club_hours.sql in the Supabase SQL Editor.`}
        action={
          <button
            onClick={() => void load()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Try again
          </button>
        }
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          Settings
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Opening hours for each day of the week, buffer time, and holidays.
          Changes apply immediately to future availability.
        </p>
      </section>

      {/* ---------------- Weekly schedule ---------------- */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-neutral-900">
              Weekly schedule
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Each day has its own hours. Turn a day off to close it completely,
              with no bookings possible.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => copyDayTo(1, [2, 3, 4, 5])}
              disabled={savingHours}
              className="rounded-lg border border-neutral-200 px-2.5 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            >
              Copy Mon → Tue–Fri
            </button>
            <button
              type="button"
              onClick={() => copyDayTo(1, [0, 2, 3, 4, 5, 6])}
              disabled={savingHours}
              className="rounded-lg border border-neutral-200 px-2.5 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            >
              Copy Mon → all
            </button>
          </div>
        </div>

        <ul className="mt-4 flex flex-col gap-2.5">
          {WEEK_ORDER.map((weekday) => {
            const day =
              hours.find((d) => d.weekday === weekday) ??
              DEFAULT_HOURS[weekday];
            const name = WEEKDAY_NAMES[weekday];
            const error = dayError(day);

            return (
              <li
                key={weekday}
                className={`rounded-xl border p-3.5 transition-colors ${
                  day.is_open
                    ? "border-neutral-200 bg-white"
                    : "border-neutral-200 bg-neutral-50"
                }`}
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[13rem_minmax(0,1fr)_11rem] lg:items-center lg:gap-6">
                  {/* Day + switch */}
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={day.is_open}
                      onChange={(value) =>
                        updateDay(weekday, { is_open: value })
                      }
                      disabled={savingHours}
                      label={`${name} open`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900">
                        {name}
                      </p>
                      <p
                        className={`text-xs ${
                          day.is_open ? "text-emerald-700" : "text-neutral-400"
                        }`}
                      >
                        {day.is_open ? "Open" : "Closed"}
                      </p>
                    </div>
                  </div>

                  {/* Times */}
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    <div className="min-w-0">
                      <label htmlFor={`open-${weekday}`} className={labelClass}>
                        Opening time
                      </label>
                      <input
                        id={`open-${weekday}`}
                        type="time"
                        value={day.open_time}
                        onChange={(e) =>
                          updateDay(weekday, { open_time: e.target.value })
                        }
                        disabled={savingHours || !day.is_open}
                        className={inputClass}
                      />
                    </div>
                    <div className="min-w-0">
                      <label
                        htmlFor={`close-${weekday}`}
                        className={labelClass}
                      >
                        Closing time
                      </label>
                      <input
                        id={`close-${weekday}`}
                        type="time"
                        value={day.close_time}
                        onChange={(e) =>
                          updateDay(weekday, { close_time: e.target.value })
                        }
                        disabled={savingHours || !day.is_open}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="min-w-0 border-t border-neutral-100 pt-2.5 lg:border-0 lg:pt-0 lg:text-right">
                    <p className="text-sm font-medium text-neutral-900">
                      {describeHours(day)}
                    </p>
                    {closesAfterMidnight(day) && (
                      <p className="text-[11px] text-neutral-500">
                        Closes after midnight
                      </p>
                    )}
                  </div>
                </div>

                {error && (
                  <p role="alert" className="mt-2 text-xs text-red-600">
                    {error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-xs text-neutral-500">
          For midnight, set the closing time to 12:00 AM. A closing time earlier
          than the opening time means the shop stays open past midnight.
        </p>

        {hoursError && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {hoursError}
          </p>
        )}
        {hoursSuccess && (
          <p
            role="status"
            className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
          >
            Weekly schedule saved.
          </p>
        )}

        {/* On phones the save bar sticks to the bottom while there are unsaved
            changes, so it is always reachable after editing a day far up the list. */}
        <div
          className={`mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 ${
            hoursDirty
              ? "sticky bottom-0 z-10 -mx-4 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0"
              : ""
          }`}
        >
          <button
            type="button"
            onClick={() => void handleSaveHours()}
            disabled={savingHours || !hoursDirty || hasHoursErrors}
            className={primaryButton}
          >
            {savingHours && <Spinner />}
            {savingHours ? "Saving…" : "Save schedule"}
          </button>

          {hoursDirty && !savingHours && (
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <span className="text-xs text-amber-600">Unsaved changes</span>
              <button
                type="button"
                onClick={() => setHours(savedHours)}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              >
                Discard
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ---------------- General settings ---------------- */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <h3 className="text-sm font-medium text-neutral-900">
          Buffer & defaults
        </h3>

        <form
          onSubmit={(e) => void handleSaveGeneral(e)}
          noValidate
          className="mt-4 flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label htmlFor="buffer-minutes" className={labelClass}>
                Cleanup buffer (minutes)
              </label>
              <input
                id="buffer-minutes"
                type="number"
                inputMode="numeric"
                min={0}
                value={bufferMinutes}
                onChange={(e) => {
                  setGeneralSuccess(false);
                  setBufferMinutes(Math.max(0, Number(e.target.value) || 0));
                }}
                disabled={savingGeneral}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Applied after every booking, on every table, club-wide.
              </p>
            </div>
            <div className="min-w-0">
              <label htmlFor="default-duration" className={labelClass}>
                Default duration (minutes)
              </label>
              <input
                id="default-duration"
                type="number"
                inputMode="numeric"
                min={1}
                value={defaultDuration}
                onChange={(e) => {
                  setGeneralSuccess(false);
                  setDefaultDuration(Math.max(1, Number(e.target.value) || 1));
                }}
                disabled={savingGeneral}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Used when a customer hasn't chosen a duration yet.
              </p>
            </div>
          </div>

          {generalError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              {generalError}
            </p>
          )}
          {generalSuccess && (
            <p
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
            >
              Settings saved.
            </p>
          )}

          <button
            type="submit"
            disabled={savingGeneral}
            className={`${primaryButton} sm:self-start`}
          >
            {savingGeneral && <Spinner />}
            {savingGeneral ? "Saving…" : "Save settings"}
          </button>
        </form>
      </section>

      {/* ---------------- Closures ---------------- */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <h3 className="text-sm font-medium text-neutral-900">
          Leave & holiday dates
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Specific closed date ranges, on top of the days switched off in the
          weekly schedule.
        </p>

        <form
          onSubmit={(e) => void handleAddClosure(e)}
          noValidate
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_8rem_auto] lg:items-end"
        >
          <div className="min-w-0">
            <label htmlFor="closure-start" className={labelClass}>
              Start date
            </label>
            <input
              id="closure-start"
              type="date"
              value={closureStart}
              onChange={(e) => setClosureStart(e.target.value)}
              disabled={addingClosure}
              className={inputClass}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="closure-end" className={labelClass}>
              End date
            </label>
            <input
              id="closure-end"
              type="date"
              value={closureEnd}
              onChange={(e) => setClosureEnd(e.target.value)}
              disabled={addingClosure}
              className={inputClass}
            />
          </div>
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <label htmlFor="closure-reason" className={labelClass}>
              Reason
            </label>
            <input
              id="closure-reason"
              value={closureReason}
              onChange={(e) => setClosureReason(e.target.value)}
              disabled={addingClosure}
              placeholder="e.g. Diwali"
              className={inputClass}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="closure-kind" className={labelClass}>
              Type
            </label>
            <select
              id="closure-kind"
              value={closureKind}
              onChange={(e) =>
                setClosureKind(e.target.value as "holiday" | "leave")
              }
              disabled={addingClosure}
              className={inputClass}
            >
              <option value="holiday">Holiday</option>
              <option value="leave">Leave</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={addingClosure}
            className={`${primaryButton} sm:self-end`}
          >
            {addingClosure && <Spinner />}
            {addingClosure ? "Adding…" : "Add closure"}
          </button>
        </form>

        {closureError && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {closureError}
          </p>
        )}

        <div className="mt-5">
          {closuresLoading ? (
            <div
              role="status"
              className="flex items-center gap-2 py-6 text-sm text-neutral-500"
            >
              <Spinner className="h-4 w-4" />
              Loading closures…
            </div>
          ) : closures.length === 0 ? (
            <EmptyState
              title="No closures added"
              description="Add a holiday or leave date above."
            />
          ) : (
            <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200">
              {closures.map((closure) => (
                <li
                  key={closure.id}
                  className="flex flex-col gap-2.5 p-3.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between min-[420px]:gap-3"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-neutral-900">
                      {formatDate(closure.start_date)}
                      {closure.end_date !== closure.start_date
                        ? ` – ${formatDate(closure.end_date)}`
                        : ""}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                      <span className="break-words">
                        {closure.reason ||
                          (closure.kind === "holiday" ? "Holiday" : "Leave")}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                        {closure.kind}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => void handleRemoveClosure(closure.id)}
                    disabled={removingId === closure.id}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    {removingId === closure.id && (
                      <Spinner className="h-3 w-3" />
                    )}
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <DangerZone
        onCleared={(scope) => {
          void loadClosures();
          if (scope === "settings") void load();
        }}
      />
    </div>
  );
};

export default SettingsPage;