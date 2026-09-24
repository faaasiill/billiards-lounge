import BottomSheet from "./BottomSheet";
import { PEAK_SURCHARGE } from "../mockData";
import type { BookingDraft } from "../types";

type ReviewSheetProps = {
  open: boolean;
  draft: BookingDraft;
  submitting?: boolean;
  onClose: () => void;
  onEditSchedule: () => void;
  onEditDetails: () => void;
  onConfirm: () => void;
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2.5">
    <span className="text-xs tracking-tighter text-ivory/55 light:text-felt-dark/55">{label}</span>
    <span className="text-sm font-medium tracking-tight text-ivory light:text-felt-dark">
      {value}
    </span>
  </div>
);

const EditLink = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="text-xs font-medium tracking-tight text-brass transition-opacity duration-150 active:opacity-50"
  >
    Edit
  </button>
);

const ReviewSheet = ({
  open,
  draft,
  submitting = false,
  onClose,
  onEditSchedule,
  onEditDetails,
  onConfirm,
}: ReviewSheetProps) => {
  if (
    !draft.activity ||
    !draft.date ||
    !draft.slot ||
    !draft.duration ||
    !draft.players ||
    !draft.customer
  ) {
    return null;
  }

  const surcharge = draft.slot.isPeak ? PEAK_SURCHARGE : 0;
  const total = draft.duration.price + surcharge;

  return (
    <BottomSheet
      open={open}
      onClose={submitting ? () => {} : onClose}
      title="Review booking"
      footer={
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-full border border-ivory/10 bg-ivory py-3.5 text-center text-sm font-medium tracking-tight text-felt-dark transition-all duration-300 hover:bg-brass active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 light:border-felt-dark/10 light:bg-felt-dark light:text-ivory light:hover:text-felt-dark"
        >
          {submitting ? "Confirming…" : `Confirm booking · ₹${total}`}
        </button>
      }
    >
      <div className="pb-2">
        <div className="flex items-center justify-between border-b border-ivory/10 pb-2.5 light:border-felt-dark/10">
          <span className="font-display text-base tracking-[-0.04em] text-ivory light:text-felt-dark">
            {draft.activity.name}
          </span>
          <EditLink onClick={onEditSchedule} />
        </div>

        <Row label="Date" value={`${draft.date.dayLabel}, ${draft.date.dayNumber} ${draft.date.monthLabel}`} />
        <Row label="Time" value={draft.slot.label} />
        <Row label="Duration" value={draft.duration.label} />
        <Row label="Players" value={`${draft.players} ${draft.players === 1 ? "player" : "players"}`} />

        <div className="mt-1 flex items-center justify-between border-b border-t border-ivory/10 py-2.5 light:border-felt-dark/10">
          <span className="text-xs tracking-tighter text-ivory/55 light:text-felt-dark/55">
            Customer
          </span>
          <EditLink onClick={onEditDetails} />
        </div>
        <Row label="Name" value={draft.customer.name} />
        <Row label="Mobile" value={draft.customer.phone} />

        <div className="mt-1 border-t border-ivory/10 pt-2.5 light:border-felt-dark/10">
          <Row label={`${draft.duration.label} session`} value={`₹${draft.duration.price}`} />
          {surcharge > 0 && <Row label="Peak hour" value={`₹${surcharge}`} />}
        </div>

        <div className="mt-1 flex items-center justify-between border-t border-ivory/10 pt-3 light:border-felt-dark/10">
          <span className="text-sm tracking-tight text-ivory/70 light:text-felt-dark/70">Total</span>
          <span className="font-display text-lg tracking-[-0.04em] text-brass">₹{total}</span>
        </div>
      </div>
    </BottomSheet>
  );
};

export default ReviewSheet;