import type { TableStatus } from "../services/availabilityService";

type TablePickerProps = {
  tables: TableStatus[];
  selectedId: string | null; // null = "Any"
  onSelect: (id: string | null) => void;
};

const base =
  "relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-full py-3 text-sm tracking-tight transition-all duration-200";

const TablePicker = ({ tables, selectedId, onSelect }: TablePickerProps) => {
  const anyFree = tables.some((t) => !t.booked);

  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        type="button"
        disabled={!anyFree}
        onClick={() => onSelect(null)}
        className={`${base} ${
          selectedId === null
            ? "bg-brass font-medium text-felt-dark active:scale-95"
            : "text-ivory/80 active:scale-95 active:bg-ivory/10 light:text-felt-dark/75 light:active:bg-felt-dark/10"
        } disabled:cursor-not-allowed disabled:opacity-30`}
      >
        Any
      </button>

      {tables.map((t) => {
        const selected = t.id === selectedId;
        return (
          <button
            key={t.id}
            type="button"
            disabled={t.booked}
            aria-pressed={selected}
            onClick={() => onSelect(t.id)}
            className={`${base} ${
              t.booked
                ? "cursor-not-allowed text-ivory/25 light:text-felt-dark/25"
                : selected
                  ? "bg-brass font-medium text-felt-dark active:scale-95"
                  : "text-ivory/80 active:scale-95 active:bg-ivory/10 light:text-felt-dark/75 light:active:bg-felt-dark/10"
            }`}
          >
            <span className={t.booked ? "line-through" : ""}>{t.label}</span>
            {t.booked && <span className="text-[10px] tracking-tighter">Booked</span>}
          </button>
        );
      })}
    </div>
  );
};

export default TablePicker;