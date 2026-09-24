import { useMemo, useState, type ReactNode } from "react";
import Navbar from "../home/components/Navbar";
import ActivityList from "./components/ActivityList";
import DateCalendar from "./components/DateCalendar";
import SlotGrid from "./components/SlotGrid";
import DurationSelector from "./components/Durationselector";
import PlayersSelector from "./components/PlayersSelector";
import CustomerDetailsSheet from "./components/CustomerDetailsSheet";
import ReviewSheet from "./components/ReviewSheet";
import ConfirmationScreen from "./components/ConfirmationScreen";
import BookingBar from "./components/BookingBar";
import { ACTIVITIES, PEAK_SURCHARGE, buildSlotsFor, dateToOption } from "./mockData";
import type {
  Activity,
  Booking,
  BookingDraft,
  CustomerDetails,
  DateOption,
  DurationOption,
  TimeSlot,
} from "./types";

type Stage = "activities" | "schedule" | "confirmation";
type Sheet = "none" | "details" | "review";

type BookingPageProps = {
  /** Called when the user taps the logo pill to leave the booking flow. */
  onExit?: () => void;
  /** Called with the finalized booking once it's confirmed. */
  onBookingConfirmed?: (booking: Booking) => void;
  /** Navigates to the My Bookings page — surfaced as a button on the confirmation screen. */
  onViewBookings?: () => void;
};

/**
 * A section label with a live right-aligned summary of what's currently
 * selected — the "Select date" / "Select time" / "Duration" rows always
 * tell the user what they've chosen and what's still pending, so the
 * flow never feels like disconnected static blocks.
 */
const SectionHeader = ({ label, value }: { label: string; value?: ReactNode }) => (
  <div className="mb-5 flex items-baseline justify-between">
    <span className="text-sm font-medium tracking-tight text-ivory/85 light:text-felt-dark/85">
      {label}
    </span>
    {value && (
      <span className="animate-[fade-slide-up_260ms_ease-out] text-xs tracking-tighter text-brass">
        {value}
      </span>
    )}
  </div>
);

/**
 * Every schedule-stage section (date, time, duration, players) lives in
 * one of these — same rounded-4xl / border / translucent-fill card used
 * for the confirmation summary and the review sheet, so the booking flow
 * reads as one continuous product instead of a plain settings list.
 */
const SectionCard = ({ children, delayMs }: { children: ReactNode; delayMs: number }) => (
  <div
    className="mx-6 mb-5 animate-[fade-slide-up_380ms_ease-out] rounded-4xl border border-ivory/10 bg-ivory/5 p-5 light:border-felt-dark/10 light:bg-felt-dark/5"
    style={{ animationDelay: `${delayMs}ms`, animationFillMode: "backwards" }}
  >
    {children}
  </div>
);

const BookingPage = ({ onExit, onBookingConfirmed, onViewBookings }: BookingPageProps) => {
  const [stage, setStage] = useState<Stage>("activities");
  const [sheet, setSheet] = useState<Sheet>("none");
  const [activity, setActivity] = useState<Activity | null>(null);
  const [date, setDate] = useState<DateOption | null>(() => dateToOption(new Date()));
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [duration, setDuration] = useState<DurationOption | null>(null);
  const [players, setPlayers] = useState<number | null>(null);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [bookingId, setBookingId] = useState("");

  const slots = useMemo(
    () => (activity && date ? buildSlotsFor(activity, date) : []),
    [activity, date],
  );

  const draft: BookingDraft = { activity, date, slot, duration, players, customer };
  const total = duration ? duration.price + (slot?.isPeak ? PEAK_SURCHARGE : 0) : undefined;
  const canContinue = Boolean(slot && duration && players);

  const selectActivity = (chosen: Activity) => {
    setActivity(chosen);
    setSlot(null);
    setDuration(null);
    setPlayers(chosen.minPlayers);
    setStage("schedule");
  };

  const selectDate = (chosen: DateOption) => {
    setDate(chosen);
    setSlot(null);
  };

  const openDetails = () => {
    if (!canContinue) return;
    setSheet("details");
  };

  const handleDetailsSubmit = (details: CustomerDetails) => {
    setCustomer(details);
    setSheet("review");
  };

  const handleConfirm = () => {
    // TODO: replace with a real booking API call; keep the same draft shape.
    if (!activity || !date || !slot || !duration || !players || !customer) return;

    const id = Math.random().toString(36).slice(2, 8).toUpperCase();
    const finalTotal = duration.price + (slot.isPeak ? PEAK_SURCHARGE : 0);

    onBookingConfirmed?.({
      id,
      activity,
      date,
      slot,
      duration,
      players,
      customer,
      total: finalTotal,
      createdAt: new Date().toISOString(),
    });

    setBookingId(id);
    setSheet("none");
    setStage("confirmation");
  };

  const reset = () => {
    setStage("activities");
    setActivity(null);
    setSlot(null);
    setDuration(null);
    setPlayers(null);
    setCustomer(null);
    setSheet("none");
  };

  return (
    <div className="flex h-dvh w-full justify-center overflow-hidden bg-felt font-sans light:bg-cream">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden">
        {stage === "activities" && <Navbar onBrandClick={onExit} onMyBookings={onViewBookings} />}
        {stage === "schedule" && activity && (
          <Navbar onBack={() => setStage("activities")} title={activity.name} onMyBookings={onViewBookings} />
        )}

        {stage === "activities" && (
          <div key="activities" className="flex-1 animate-[fade-slide-up_320ms_ease-out] overflow-y-auto pt-5">
            <div className="mb-7 px-6 -mt-3">
              <h1 className="font-display text-4xl leading-8 tracking-[-0.09em] text-ivory light:text-felt-dark">
                What are you <span className="text-brass">playing</span> today?
              </h1>
            </div>
            <ActivityList activities={ACTIVITIES} onSelect={selectActivity} />
          </div>
        )}

        {stage === "schedule" && activity && (
          <>
            <div key="schedule" className="flex-1 animate-[fade-slide-up_320ms_ease-out] overflow-y-auto pt-4">
              {/* Hero — same photo-card + bottom scrim + name/tagline overlay
                  treatment as the homepage's table cards, so the flow ties
                  visually back to where the user came from. */}
              <div className="mx-6 mb-6 animate-[fade-scale-in_400ms_ease-out] overflow-hidden rounded-4xl border border-ivory/10 light:border-felt-dark/10">
                <div
                  className="relative h-90 bg-cover bg-center"
                  style={{ backgroundImage: `url(${activity.image})` }}
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(11,36,28,0.92), rgba(11,36,28,0))",
                    }}
                  />
                  <div className="relative flex h-full flex-col justify-end p-5">
                    <span className="font-display text-xl leading-none tracking-[-0.06em] text-ivory">
                      {activity.name}
                    </span>
                    <span className="mt-1 text-xs tracking-tight text-ivory/75">
                      {activity.tagline}
                    </span>
                  </div>
                </div>
              </div>

              <SectionCard delayMs={0}>
                <SectionHeader
                  label="Date"
                  value={date ? `${date.dayLabel}, ${date.dayNumber} ${date.monthLabel}` : undefined}
                />
                <DateCalendar selectedId={date?.id ?? null} onSelect={selectDate} />
              </SectionCard>

              <SectionCard delayMs={60}>
                <SectionHeader label="Time" value={slot ? slot.label : "Choose a slot"} />
                <SlotGrid slots={slots} selectedId={slot?.id ?? null} onSelect={setSlot} />
              </SectionCard>

              <SectionCard delayMs={120}>
                <SectionHeader
                  label="Duration"
                  value={duration ? `${duration.label} · ₹${duration.price}` : "Choose a length"}
                />
                <DurationSelector
                  durations={activity.durations}
                  selectedId={duration?.id ?? null}
                  onSelect={setDuration}
                />
              </SectionCard>

              <SectionCard delayMs={180}>
                <SectionHeader
                  label="Players"
                  value={players ? `${players} ${players === 1 ? "player" : "players"}` : undefined}
                />
                <PlayersSelector
                  value={players ?? activity.minPlayers}
                  min={activity.minPlayers}
                  max={activity.maxPlayers}
                  onChange={setPlayers}
                />
              </SectionCard>
            </div>

            <BookingBar
              label={
                !slot
                  ? "Select a time slot"
                  : !duration
                  ? "Select a duration"
                  : `Continue with ${activity.name}`
              }
              subLabel={total !== undefined ? `₹${total} total${slot?.isPeak ? " · peak hour" : ""}` : undefined}
              disabled={!canContinue}
              onPress={openDetails}
            />
          </>
        )}

        {stage === "confirmation" && (
          <ConfirmationScreen
            draft={draft}
            bookingId={bookingId}
            onDone={reset}
            onViewBookings={onViewBookings}
          />
        )}

        <CustomerDetailsSheet
          open={sheet === "details"}
          initial={customer}
          onClose={() => setSheet("none")}
          onSubmit={handleDetailsSubmit}
        />

        <ReviewSheet
          open={sheet === "review"}
          draft={draft}
          onClose={() => setSheet("none")}
          onEditSchedule={() => setSheet("none")}
          onEditDetails={() => setSheet("details")}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
};

export default BookingPage;