import { useState, type FormEvent } from "react";
import type {
  AdminActivity,
  ActivityInput,
  ActivityDurationInput,
} from "../services/activitiesService";
import Spinner from "./Spinner";

type ActivityFormProps = {
  initial?: AdminActivity | null;
  onCancel: () => void;
  onSubmit: (input: ActivityInput) => Promise<{ error: string | null }>;
};

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60";

const labelClass = "mb-1.5 block text-xs font-medium text-neutral-700";

let durationKeySeed = 0;
const nextDurationKey = () => `new-${++durationKeySeed}`;

type DurationRow = ActivityDurationInput & { key: string };

const toDurationRows = (activity?: AdminActivity | null): DurationRow[] => {
  if (!activity || activity.durations.length === 0) {
    // Sensible starting defaults for a brand-new activity.
    return [
      { key: nextDurationKey(), minutes: 30, label: "30 min", price: 0 },
      { key: nextDurationKey(), minutes: 60, label: "1 hour", price: 0 },
    ];
  }
  return activity.durations.map((d) => ({
    key: d.id,
    id: d.id,
    minutes: d.minutes,
    label: d.label,
    price: d.price,
  }));
};

const emptyImageField = "";

const ActivityForm = ({ initial, onCancel, onSubmit }: ActivityFormProps) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(
    initial?.short_description ?? "",
  );
  const [images, setImages] = useState<string[]>(
    initial?.images && initial.images.length > 0
      ? initial.images
      : [emptyImageField],
  );
  const [minPlayers, setMinPlayers] = useState(initial?.min_players ?? 1);
  const [maxPlayers, setMaxPlayers] = useState(initial?.max_players ?? 4);
  const [tableCount, setTableCount] = useState(initial?.table_count ?? 1);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [durations, setDurations] = useState<DurationRow[]>(
    toDurationRows(initial),
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateImage = (index: number, value: string) => {
    setImages((prev) => prev.map((img, i) => (i === index ? value : img)));
  };

  const addImageField = () => setImages((prev) => [...prev, emptyImageField]);
  const removeImageField = (index: number) =>
    setImages((prev) => prev.filter((_, i) => i !== index));

  const updateDuration = (key: string, patch: Partial<DurationRow>) => {
    setDurations((prev) =>
      prev.map((d) => (d.key === key ? { ...d, ...patch } : d)),
    );
  };

  const addDuration = () => {
    setDurations((prev) => [
      ...prev,
      { key: nextDurationKey(), minutes: 45, label: "45 min", price: 0 },
    ]);
  };

  const removeDuration = (key: string) => {
    setDurations((prev) => prev.filter((d) => d.key !== key));
  };

  const validate = (): string | null => {
    if (name.trim().length < 2) return "Enter an activity name.";
    if (minPlayers < 1) return "Minimum players must be at least 1.";
    if (maxPlayers < minPlayers)
      return "Maximum players can't be less than minimum players.";
    if (tableCount < 1) return "There must be at least 1 table.";
    if (durations.length === 0) return "Add at least one duration option.";
    for (const d of durations) {
      if (d.minutes <= 0)
        return "Every duration must be longer than 0 minutes.";
      if (d.label.trim().length === 0) return "Every duration needs a label.";
      if (d.price < 0) return "Prices can't be negative.";
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    const { error: submitError } = await onSubmit({
      name: name.trim(),
      short_description: description.trim(),
      images: images.map((i) => i.trim()).filter(Boolean),
      min_players: minPlayers,
      max_players: maxPlayers,
      is_active: isActive,
      table_count: tableCount,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      durations: durations.map(({ key: _key, ...rest }) => rest),
    });

    setSubmitting(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    onCancel(); // close/return to list on success
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      noValidate
      className="flex flex-col gap-6"
    >
      {/* Basics */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <h3 className="text-sm font-medium text-neutral-900">Basics</h3>

        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label htmlFor="activity-name" className={labelClass}>
              Name
            </label>
            <input
              id="activity-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder="e.g. Disc Pool"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="activity-description" className={labelClass}>
              Short description
            </label>
            <textarea
              id="activity-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              placeholder="e.g. Classic 8-ball, premium felt tables"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="min-players" className={labelClass}>
                Min players
              </label>
              <input
                id="min-players"
                type="number"
                min={1}
                value={minPlayers}
                onChange={(e) =>
                  setMinPlayers(Math.max(1, Number(e.target.value) || 1))
                }
                disabled={submitting}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="max-players" className={labelClass}>
                Max players
              </label>
              <input
                id="max-players"
                type="number"
                min={1}
                value={maxPlayers}
                onChange={(e) =>
                  setMaxPlayers(Math.max(1, Number(e.target.value) || 1))
                }
                disabled={submitting}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="table-count" className={labelClass}>
              Tables / resources
            </label>
            <input
              id="table-count"
              type="number"
              min={1}
              value={tableCount}
              onChange={(e) =>
                setTableCount(Math.max(1, Number(e.target.value) || 1))
              }
              disabled={submitting}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Lowering this retires the highest-numbered tables rather than
              deleting them, so past bookings stay valid.
            </p>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Visible to customers
          </label>
        </div>
      </section>

      {/* Images */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <h3 className="text-sm font-medium text-neutral-900">Images</h3>
        <p className="mt-1 text-xs text-neutral-500">
          Paste image URLs. The first one is used as the cover photo.
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
          {images.map((img, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={img}
                onChange={(e) => updateImage(i, e.target.value)}
                disabled={submitting}
                placeholder="https://…"
                className={inputClass}
              />
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageField(i)}
                  disabled={submitting}
                  className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addImageField}
            disabled={submitting}
            className="self-start rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
          >
            + Add image URL
          </button>
        </div>
      </section>

      {/* Durations & pricing */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <h3 className="text-sm font-medium text-neutral-900">
          Durations & pricing
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Removing a duration retires it instead of deleting it, so bookings
          that already used it stay historically accurate.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {durations.map((d) => (
            <div
              key={d.key}
              className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2"
            >
              <div>
                <label className={labelClass}>Minutes</label>
                <input
                  type="number"
                  min={1}
                  value={d.minutes}
                  onChange={(e) =>
                    updateDuration(d.key, {
                      minutes: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Label</label>
                <input
                  value={d.label}
                  onChange={(e) =>
                    updateDuration(d.key, { label: e.target.value })
                  }
                  disabled={submitting}
                  placeholder="e.g. 90 min"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={d.price}
                  onChange={(e) =>
                    updateDuration(d.key, {
                      price: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removeDuration(d.key)}
                disabled={submitting || durations.length <= 1}
                className="rounded-lg px-2.5 py-2.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addDuration}
            disabled={submitting}
            className="self-start rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
          >
            + Add duration option
          </button>
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Spinner />}
          {submitting
            ? "Saving…"
            : initial
            ? "Save changes"
            : "Create activity"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ActivityForm;