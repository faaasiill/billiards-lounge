import { useState } from "react";
import BottomSheet from "./BottomSheet";
import { isValidPhone } from "../hooks/useCustomerSession";

type LoginSheetProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: { name: string; phone: string }) => void;
};

const fieldBase =
  "w-full rounded-full bg-ivory/5 px-5 py-3.5 text-base tracking-tight text-ivory placeholder:text-ivory/35 outline-none transition-colors duration-200 focus:bg-ivory/10 light:bg-felt-dark/5 light:text-felt-dark light:placeholder:text-felt-dark/35 light:focus:bg-felt-dark/10";

const labelClass = "mb-1.5 block text-xs tracking-tighter text-ivory/55 light:text-felt-dark/55";

const LoginSheet = ({ open, onClose, onSubmit }: LoginSheetProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const canSubmit = name.trim().length > 1 && isValidPhone(phone);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Log in to book"
      footer={
        <button
          onClick={() => canSubmit && onSubmit({ name: name.trim(), phone })}
          disabled={!canSubmit}
          className="flex w-full items-center justify-center rounded-full border border-ivory/10 bg-ivory py-3.5 text-sm font-medium tracking-tight text-felt-dark transition-all duration-300 hover:bg-brass active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 light:border-felt-dark/10 light:bg-felt-dark light:text-ivory light:hover:text-felt-dark"
        >
          Continue
        </button>
      }
    >
      <div className="flex flex-col gap-3 pb-4">
        <p className="text-xs tracking-tight text-ivory/55 light:text-felt-dark/55">
          Your mobile number is how we find your bookings. No OTP needed.
        </p>

        <div>
          <label className={labelClass}>Full name</label>
          <input
            className={fieldBase}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Arjun Menon"
            autoComplete="name"
          />
        </div>

        <div>
          <label className={labelClass}>Mobile number</label>
          <input
            className={fieldBase}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
      </div>
    </BottomSheet>
  );
};

export default LoginSheet;