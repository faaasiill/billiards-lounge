import { useState } from "react";
import BottomSheet from "./BottomSheet";
import type { CustomerDetails } from "../types";

type CustomerDetailsSheetProps = {
  open: boolean;
  initial: CustomerDetails | null;
  onClose: () => void;
  onSubmit: (details: CustomerDetails) => void;
};

const fieldBase =
  "w-full bg-ivory/5 px-5 py-3.5 text-base tracking-tight text-ivory placeholder:text-ivory/35 outline-none transition-colors duration-200 focus:bg-ivory/10 light:bg-felt-dark/5 light:text-felt-dark light:placeholder:text-felt-dark/35 light:focus:bg-felt-dark/10";

const labelClass = "mb-1.5 block text-xs tracking-tighter text-ivory/55 light:text-felt-dark/55";

const CustomerDetailsSheet = ({ open, initial, onClose, onSubmit }: CustomerDetailsSheetProps) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const canSubmit = name.trim().length > 1 && phone.trim().length >= 8;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), phone: phone.trim(), notes: notes.trim() || undefined });
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Your details"
      footer={
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex w-full items-center justify-center rounded-full border border-ivory/10 bg-ivory py-3.5 text-center text-sm font-medium tracking-tight text-felt-dark transition-all duration-300 hover:bg-brass active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 light:border-felt-dark/10 light:bg-felt-dark light:text-ivory light:hover:text-felt-dark"
        >
          Continue to review
        </button>
      }
    >
      <div className="flex flex-col gap-3 pb-4">
        <div>
          <label className={labelClass}>Full name</label>
          <input
            className={`${fieldBase} rounded-full`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Arjun Menon"
            autoComplete="name"
          />
        </div>

        <div>
          <label className={labelClass}>Mobile number</label>
          <input
            className={`${fieldBase} rounded-full`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 98765 43210"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className={labelClass}>
            Notes <span className="opacity-60">(optional)</span>
          </label>
          <textarea
            className={`${fieldBase} min-h-24 resize-none rounded-4xl`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special request"
          />
        </div>
      </div>
    </BottomSheet>
  );
};

export default CustomerDetailsSheet;