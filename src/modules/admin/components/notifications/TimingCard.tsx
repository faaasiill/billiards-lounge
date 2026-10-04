import { useState, type FormEvent } from "react";
import Spinner from "../Spinner";

type TimingCardProps = {
  minutes: number;
  onSave: (minutes: number) => Promise<{ error: string | null }>;
};

const PRESETS = [15, 30, 45, 60];

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60";

const TimingCard = ({ minutes, onSave }: TimingCardProps) => {
  const [value, setValue] = useState(String(minutes));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const parsed = Number(value);
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 1440;
  const dirty = valid && parsed !== minutes;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!valid) {
      setError("Enter a whole number of minutes between 1 and 1440.");
      return;
    }
    setError(null);
    setSaved(false);
    setSaving(true);
    const { error: saveError } = await onSave(parsed);
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    setSaved(true);
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
      <h3 className="text-sm font-medium text-neutral-900">Reminder timing</h3>
      <p className="mt-1 text-xs text-neutral-500">
        Arrival reminder: <span className="font-medium text-neutral-700">{minutes} minutes</span> before the booking.
        A booking made inside this window gets no reminder, since the time has already passed.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-32">
            <label htmlFor="lead-minutes" className="mb-1.5 block text-xs font-medium text-neutral-700">
              Minutes before
            </label>
            <input
              id="lead-minutes"
              type="number"
              min={1}
              max={1440}
              value={value}
              onChange={(e) => {
                setSaved(false);
                setValue(e.target.value);
              }}
              disabled={saving}
              className={inputClass}
            />
          </div>

          <div className="flex gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSaved(false);
                  setValue(String(preset));
                }}
                disabled={saving}
                className="rounded-lg border border-neutral-200 px-2.5 py-2.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                {preset} min
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving || !dirty}
            className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Spinner />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
        {saved && (
          <p
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
          >
            Saved. Reminders already waiting were re-timed.
          </p>
        )}
      </form>
    </section>
  );
};

export default TimingCard;