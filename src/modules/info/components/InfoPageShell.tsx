import type { ReactNode } from "react";
import Navbar from "../../home/components/Navbar";
import type { InfoPage } from "../types";

type InfoPageShellProps = {
  title: string;
  onBack: () => void;
  onBookNow: () => void;
  onMyBookings?: () => void;
  onNavigate?: (page: InfoPage) => void;
  children: ReactNode;
};

/**
 * Same page frame as BookingPage / MyBookingsPage: full-height felt/cream
 * background, max-w-md column, back-mode Navbar, scrolling body.
 */
const InfoPageShell = ({
  title,
  onBack,
  onBookNow,
  onMyBookings,
  onNavigate,
  children,
}: InfoPageShellProps) => (
  <div className="flex h-dvh w-full justify-center overflow-hidden bg-felt font-sans light:bg-cream">
    <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden">
      <Navbar
        onBack={onBack}
        title={title}
        onBookNow={onBookNow}
        onMyBookings={onMyBookings}
        onNavigate={onNavigate}
      />

      <div className="flex-1 animate-[fade-slide-up_320ms_ease-out] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        {children}
      </div>
    </div>
  </div>
);

/** Page headline, same treatment as "What are you playing today?". */
export const PageHeading = ({ children }: { children: ReactNode }) => (
  <div className="mb-7 px-6 -mt-1">
    <h1 className="font-display text-4xl leading-8 tracking-[-0.09em] text-ivory light:text-felt-dark">
      {children}
    </h1>
  </div>
);

/** Same card as the booking schedule sections. */
export const InfoCard = ({
  children,
  delayMs = 0,
}: {
  children: ReactNode;
  delayMs?: number;
}) => (
  <div
    className="mx-6 mb-5 animate-[fade-slide-up_380ms_ease-out] rounded-4xl border border-ivory/10 bg-ivory/5 p-5 light:border-felt-dark/10 light:bg-felt-dark/5"
    style={{ animationDelay: `${delayMs}ms`, animationFillMode: "backwards" }}
  >
    {children}
  </div>
);

/** Small card label, same as the booking SectionHeader. */
export const CardLabel = ({ children }: { children: ReactNode }) => (
  <span className="mb-4 block text-sm font-medium tracking-tight text-ivory/85 light:text-felt-dark/85">
    {children}
  </span>
);

export default InfoPageShell;