import { useEffect, useState } from "react";
import { clearData, type ClearResult, type ClearScope } from "../services/dataResetService";
import Spinner from "./Spinner";

type DangerZoneProps = {
  /** Called after a successful clear so the page can refresh what it shows. */
  onCleared?: (scope: ClearScope) => void;
};

type Option = {
  scope: ClearScope;
  title: string;
  description: string;
  deletes: string;
  keeps: string;
  button: string;
  severe?: boolean;
};

const CONFIRM_WORD = "DELETE";

const OPTIONS: Option[] = [
  {
    scope: "bookings",
    title: "Clear bookings",
    description: "Removes every booking, past and upcoming. Customer records disappear too, because they are built from bookings.",
    deletes: "All bookings and customer history",
    keeps: "Activities, tables, pricing, hours, admins",
    button: "Clear bookings",
  },
  {
    scope: "activities",
    title: "Clear activities",
    description: "Removes all activities, including Billiards groups and game types, with their durations, tables and pricing.",
    deletes: "All activities, durations, tables, and all bookings (they depend on activities)",
    keeps: "Hours, holidays, settings, admins",
    button: "Clear activities",
    severe: true,
  },
  {
    scope: "closures",
    title: "Clear holidays and leave",
    description: "Removes every holiday and leave date, so the club is open on all of them again.",
    deletes: "All holiday and leave dates",
    keeps: "Everything else",
    button: "Clear closures",
  },
  {
    scope: "settings",
    title: "Reset hours and settings",
    description: "Puts opening hours (10:00 AM to 10:00 PM, every day), cleanup buffer (10 min) and default duration (60 min) back to defaults.",
    deletes: "Nothing is deleted, your current values are overwritten",
    keeps: "All bookings, activities and closures",
    button: "Reset to defaults",
  },
  {
    scope: "all",
    title: "Clear all data",
    description: "Removes bookings, activities and holiday dates in one step. Admin accounts and login users are never touched.",
    deletes: "All bookings, activities (with durations and tables) and closures",
    keeps: "Admins, login users, opening hours and settings",
    button: "Clear all data",
    severe: true,
  },
];

const summarize = (result: ClearResult): string => {
  const parts: string[] = [];
  if (result.bookings > 0) parts.push(`${result.bookings} ${result.bookings === 1 ? "booking" : "bookings"}`);
  if (result.activities > 0) parts.push(`${result.activities} ${result.activities === 1 ? "activity" : "activities"}`);
  if (result.closures > 0) parts.push(`${result.closures} ${result.closures === 1 ? "closure" : "closures"}`);

  if (result.scope === "settings") return "Hours and settings were reset to defaults.";
  return parts.length > 0 ? `Deleted ${parts.join(", ")}.` : "Done. There was nothing to delete.";
};

const DangerZone = ({ onCleared }: DangerZoneProps) => {
  const [target, setTarget] = useState<Option | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const closeDialog = () => {
    if (busy) return;
    setTarget(null);
    setTyped("");
    setError(null);
  };

  const openDialog = (option: Option) => {
    setSuccess(null);
    setError(null);
    setTyped("");
    setTarget(option);
  };

  useEffect(() => {
    if (!target || busy) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTarget(null);
        setTyped("");
        setError(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [target, busy]);

  const handleConfirm = async () => {
    if (!target || busy || typed !== CONFIRM_WORD) return;

    setBusy(true);
    setError(null);
    const { data, error: clearError } = await clearData(target.scope);
    setBusy(false);

    if (clearError || !data) {
      setError(clearError ?? "Something went wrong. Please try again.");
      return;
    }

    const scope = target.scope;
    setTarget(null);
    setTyped("");
    setSuccess(summarize(data));
    onCleared?.(scope);
  };

  const canConfirm = typed === CONFIRM_WORD && !busy;

  return (
    <section className="rounded-2xl border border-red-200 bg-white p-4 sm:p-6">
      <h3 className="text-sm font-medium text-red-700">Danger zone</h3>
      <p className="mt-1 text-xs text-neutral-500">
        These actions permanently delete data and cannot be undone. Admin accounts and login users are never
        affected.
      </p>

      {success && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
        >
          {success}
        </p>
      )}

      <ul className="mt-4 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200">
        {OPTIONS.map((option) => (
          <li
            key={option.scope}
            className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900">{option.title}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{option.description}</p>
            </div>
            <button
              type="button"
              onClick={() => openDialog(option)}
              className={`shrink-0 rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
                option.severe
                  ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                  : "border-red-200 text-red-600 hover:bg-red-50"
              }`}
            >
              {option.button}
            </button>
          </li>
        ))}
      </ul>

      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close dialog"
            onClick={closeDialog}
            className="absolute inset-0 bg-neutral-900/50"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="danger-dialog-title"
            className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl sm:p-6"
          >
            <h4 id="danger-dialog-title" className="text-base font-semibold text-neutral-900">
              {target.title}?
            </h4>

            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800">
              <p className="font-medium">This cannot be undone.</p>
              <p className="mt-1">
                <span className="font-medium">Affects:</span> {target.deletes}
              </p>
              <p className="mt-0.5">
                <span className="font-medium">Kept:</span> {target.keeps}
              </p>
            </div>

            <label htmlFor="danger-confirm" className="mt-4 block text-xs font-medium text-neutral-700">
              Type <span className="font-mono font-semibold">{CONFIRM_WORD}</span> to confirm
            </label>
            <input
              id="danger-confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={busy}
              autoComplete="off"
              autoFocus
              placeholder={CONFIRM_WORD}
              className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 font-mono text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/10 disabled:opacity-60"
            />

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDialog}
                disabled={busy}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={!canConfirm}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy && <Spinner />}
                {busy ? "Working…" : target.button}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DangerZone;