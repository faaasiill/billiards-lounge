import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  getClubSettings,
  updateClubSettings,
  listClosures,
  addClosure,
  removeClosure,
  type ClubSettingsRecord,
  type ClubClosure,
} from "../services/settingsService";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60";

const labelClass = "mb-1.5 block text-xs font-medium text-neutral-700";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const SettingsPage = () => {
  const [settings, setSettings] = useState<ClubSettingsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [offDays, setOffDays] = useState<number[]>([]);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [defaultDuration, setDefaultDuration] = useState(60);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [closures, setClosures] = useState<ClubClosure[]>([]);
  const [closuresLoading, setClosuresLoading] = useState(true);
  const [closureStart, setClosureStart] = useState("");
  const [closureEnd, setClosureEnd] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [closureKind, setClosureKind] = useState<"holiday" | "leave">("holiday");
  const [addingClosure, setAddingClosure] = useState(false);
  const [closureError, setClosureError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await getClubSettings();
    if (data) {
      setSettings(data);
      setOpenTime(data.open_time);
      setCloseTime(data.close_time);
      setOffDays(data.weekly_off_days);
      setBufferMinutes(data.cleanup_buffer_minutes);
      setDefaultDuration(data.default_duration_minutes);
    }
    setLoadError(error);
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

  const toggleOffDay = (day: number) => {
    setOffDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const { error } = await updateClubSettings({
      open_time: openTime,
      close_time: closeTime,
      weekly_off_days: offDays,
      cleanup_buffer_minutes: bufferMinutes,
      default_duration_minutes: defaultDuration,
    });

    setSaving(false);

    if (error) {
      setSaveError(error);
      return;
    }

    setSaveSuccess(true);
    void load();
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

  if (loadError || !settings) {
    return (
      <ErrorState
        description={loadError ?? "Couldn't load settings."}
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
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">Settings</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Club-wide working hours and buffer time. Changes apply immediately to future availability.
        </p>
      </section>

      {/* Working hours + buffer */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <h3 className="text-sm font-medium text-neutral-900">Working hours & buffer</h3>

        <form onSubmit={(e) => void handleSaveSettings(e)} noValidate className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="open-time" className={labelClass}>
                Opens at
              </label>
              <input
                id="open-time"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="close-time" className={labelClass}>
                Closes at
              </label>
              <input
                id="close-time"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <span className={labelClass}>Weekly off days</span>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const selected = offDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleOffDay(day.value)}
                    disabled={saving}
                    aria-pressed={selected}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                      selected
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="buffer-minutes" className={labelClass}>
                Cleanup buffer (minutes)
              </label>
              <input
                id="buffer-minutes"
                type="number"
                min={0}
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(Math.max(0, Number(e.target.value) || 0))}
                disabled={saving}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Applied after every booking, on every table, club-wide.
              </p>
            </div>
            <div>
              <label htmlFor="default-duration" className={labelClass}>
                Default duration (minutes)
              </label>
              <input
                id="default-duration"
                type="number"
                min={1}
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(Math.max(1, Number(e.target.value) || 1))}
                disabled={saving}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-neutral-500">Used when a customer hasn't chosen a duration yet.</p>
            </div>
          </div>

          {saveError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {saveError}
            </p>
          )}
          {saveSuccess && (
            <p
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
            >
              Settings saved.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 self-start rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Spinner />}
            {saving ? "Saving…" : "Save settings"}
          </button>
        </form>
      </section>

      {/* Closures */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <h3 className="text-sm font-medium text-neutral-900">Leave & holiday dates</h3>
        <p className="mt-1 text-xs text-neutral-500">
          Specific closed date ranges, on top of the weekly off days above.
        </p>

        <form
          onSubmit={(e) => void handleAddClosure(e)}
          noValidate
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap"
        >
          <div>
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
          <div>
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
          <div className="flex-1 min-w-40">
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
          <div>
            <label htmlFor="closure-kind" className={labelClass}>
              Type
            </label>
            <select
              id="closure-kind"
              value={closureKind}
              onChange={(e) => setClosureKind(e.target.value as "holiday" | "leave")}
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
            className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addingClosure && <Spinner />}
            {addingClosure ? "Adding…" : "Add"}
          </button>
        </form>

        {closureError && (
          <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {closureError}
          </p>
        )}

        <div className="mt-5">
          {closuresLoading ? (
            <div role="status" className="flex items-center gap-2 py-6 text-sm text-neutral-500">
              <Spinner className="h-4 w-4" />
              Loading closures…
            </div>
          ) : closures.length === 0 ? (
            <EmptyState title="No closures added" description="Add a holiday or leave date above." />
          ) : (
            <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200">
              {closures.map((closure) => (
                <li key={closure.id} className="flex items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {formatDate(closure.start_date)}
                      {closure.end_date !== closure.start_date ? ` – ${formatDate(closure.end_date)}` : ""}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {closure.reason || (closure.kind === "holiday" ? "Holiday" : "Leave")}
                      <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                        {closure.kind}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => void handleRemoveClosure(closure.id)}
                    disabled={removingId === closure.id}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    {removingId === closure.id && <Spinner className="h-3 w-3" />}
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;