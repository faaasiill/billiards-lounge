import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Navbar from "../home/components/Navbar";
import ActivityList from "./components/ActivityList";
import DateCalendar from "./components/DateCalendar";
import SlotGrid from "./components/SlotGrid";
import DurationSelector from "./components/Durationselector";
import PlayersSelector from "./components/PlayersSelector";
import CustomerDetailsSheet from "./components/CustomerDetailsSheet";
import LoginSheet from "./components/LoginSheet";
import ReviewSheet from "./components/ReviewSheet";
import ConfirmationScreen from "./components/ConfirmationScreen";
import BookingBar from "./components/BookingBar";
import { ActivityListSkeleton, SlotGridSkeleton } from "./components/Skeleton";
import StateCard, { AlertIcon, ClockIcon, HourglassIcon, TableIcon } from "./components/StateCard";
import { PEAK_SURCHARGE, dateToOption, buildDateOptionsFrom } from "./mockData";
import { listPublicActivities } from "./services/activitiesPublicService";
import { getActivityAvailability, createBooking } from "./services/availabilityService";
import {
  getPublicSettings,
  listPublicClosures,
  isClosedOn,
  type PublicClubSettings,
  type PublicClosure,
} from "./services/settingsPublicService";
import { useCustomerSession } from "./hooks/useCustomerSession";
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
type Sheet = "none" | "login" | "details" | "review";

type BookingPageProps = {
  /** Called when the user taps the logo pill to leave the booking flow. */
  onExit?: () => void;
  /** Called with the finalized booking once it's confirmed. */
  onBookingConfirmed?: (booking: Booking) => void;
  /** Navigates to the My Bookings page — surfaced as a button on the confirmation screen. */
  onViewBookings?: () => void;
};

/** Club-local peak window (hard-coded for now; move into club_settings later). */
const PEAK_HOURS = new Set(["18:00", "19:00", "20:00"]);

/** How far ahead we search for the first open day when today is closed. */
const OPEN_DAY_SEARCH_WINDOW = 190;

const formatLabel = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

/**
 * A section label with a live right-aligned summary of what's currently
 * selected — the "Select date" / "Select time" / "Duration" rows always
 * tell the user what they've chosen and what's still pending.
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
 * Every schedule-stage section (date, duration, time, players) lives in
 * one of these — same rounded-4xl / border / translucent-fill card used
 * for the confirmation summary and the review sheet.
 */
const SectionCard = ({ children, delayMs }: { children: ReactNode; delayMs: number }) => (
  <div
    className="mx-6 mb-5 animate-[fade-slide-up_380ms_ease-out] rounded-4xl border border-ivory/10 bg-ivory/5 p-5 light:border-felt-dark/10 light:bg-felt-dark/5"
    style={{ animationDelay: `${delayMs}ms`, animationFillMode: "backwards" }}
  >
    {children}
  </div>
);

/** Full-width card wrapper used to present activity-level error/empty states. */
const StatePanel = ({ children }: { children: ReactNode }) => (
  <div className="px-6">
    <div className="rounded-4xl border border-ivory/10 bg-ivory/5 px-5 py-8 light:border-felt-dark/10 light:bg-felt-dark/5">
      {children}
    </div>
  </div>
);

const BookingPage = ({ onExit, onBookingConfirmed, onViewBookings }: BookingPageProps) => {
  const { session, login } = useCustomerSession();

  const [stage, setStage] = useState<Stage>("activities");
  const [sheet, setSheet] = useState<Sheet>("none");

  // Remote data
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PublicClubSettings | null>(null);
  const [closures, setClosures] = useState<PublicClosure[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Selection
  const [activity, setActivity] = useState<Activity | null>(null);
  const [date, setDate] = useState<DateOption | null>(() => dateToOption(new Date()));
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [duration, setDuration] = useState<DurationOption | null>(null);
  const [players, setPlayers] = useState<number | null>(null);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [bookingId, setBookingId] = useState("");

  // Availability
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotStartAt, setSlotStartAt] = useState<Record<string, string>>({});
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [availabilityNonce, setAvailabilityNonce] = useState(0);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    const { data, error } = await listPublicActivities();
    setActivities(data);
    setActivitiesError(error);
    setActivitiesLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadActivities();

    void Promise.all([getPublicSettings(), listPublicClosures()]).then(([s, c]) => {
      setSettings(s.data);
      setClosures(c.data);
      setSettingsLoading(false);
    });
  }, [loadActivities]);

  /** True when the club is closed on this date (weekly off day or a closure range). */
  const isDateClosed = useCallback(
    (d: DateOption) => isClosedOn(d.id, settings, closures),
    [settings, closures],
  );

  const closedToday = useMemo(() => (date ? isDateClosed(date) : false), [date, isDateClosed]);

  // Once club hours load, if the pre-selected date (today) is a closed day,
  // move the selection to the first open date so the user never lands on a
  // date they can't book. Runs once.
  const autoPickedRef = useRef(false);

  useEffect(() => {
    if (settingsLoading || autoPickedRef.current) return;
    autoPickedRef.current = true;

    if (date && !isDateClosed(date)) return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const firstOpen = buildDateOptionsFrom(start, OPEN_DAY_SEARCH_WINDOW).find((d) => !isDateClosed(d));

    if (firstOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(firstOpen);
      setSlot(null);
    }
  }, [settingsLoading, isDateClosed, date]);

  const retryAvailability = () => setAvailabilityNonce((n) => n + 1);

  // Fetch real availability whenever activity / date / duration changes.
  useEffect(() => {
    let cancelled = false;

    if (!activity || !date || !duration || closedToday || settingsLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlots([]);
      setSlotsError(null);
      setSlotsLoading(false);
      return;
    }

    setSlotsLoading(true);
    setSlotsError(null);

    void getActivityAvailability(activity.id, date.id, duration.minutes).then(({ data, error }) => {
      if (cancelled) return;

      const now = Date.now();
      const startAtById: Record<string, string> = {};

      const mapped: TimeSlot[] = data.map((s) => {
        const id = `${date.id}-${s.startTime}`;
        startAtById[id] = s.startAt;

        return {
          id,
          time: s.startTime,
          label: formatLabel(s.startTime),
          // Past start times on today's date aren't bookable.
          available: s.tablesAvailable > 0 && new Date(s.startAt).getTime() > now,
          isPeak: PEAK_HOURS.has(s.startTime),
        };
      });

      setSlots(mapped);
      setSlotStartAt(startAtById);
      setSlotsError(error);
      setSlotsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activity, date, duration, closedToday, settingsLoading, availabilityNonce]);

  const draft: BookingDraft = { activity, date, slot, duration, players, customer };
  const total = duration ? duration.price + (slot?.isPeak ? PEAK_SURCHARGE : 0) : undefined;
  const canContinue = Boolean(slot && duration && players);

  const selectActivity = (chosen: Activity) => {
    setActivity(chosen);
    setSlot(null);
    setDuration(null);
    setPlayers(chosen.minPlayers);
    setSubmitError(null);
    setStage("schedule");
  };

  const selectDate = (chosen: DateOption) => {
    if (isDateClosed(chosen)) return;
    setDate(chosen);
    setSlot(null);
  };

  const selectDuration = (chosen: DurationOption) => {
    setDuration(chosen);
    // Availability depends on duration, so any previously chosen time is stale.
    setSlot(null);
  };

  const openNextSheet = () => {
    if (!canContinue) return;
    setSubmitError(null);

    if (!session) {
      setSheet("login");
      return;
    }
    setSheet("details");
  };

  const handleLogin = (details: { name: string; phone: string }) => {
    login(details);
    setSheet("details");
  };

  const handleDetailsSubmit = (details: CustomerDetails) => {
    setCustomer(details);
    setSheet("review");
  };

  const handleConfirm = async () => {
    if (submitting) return;
    if (!activity || !date || !slot || !duration || !players || !customer) return;

    const startAt = slotStartAt[slot.id];
    if (!startAt) {
      setSubmitError("That slot is no longer valid. Please pick another time.");
      setSlot(null);
      setSheet("none");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const peakSurcharge = slot.isPeak ? PEAK_SURCHARGE : 0;

    const { bookingCode, error } = await createBooking({
      activityId: activity.id,
      activityName: activity.name,
      durationId: duration.id,
      durationMinutes: duration.minutes,
      durationLabel: duration.label,
      price: duration.price,
      peakSurcharge,
      startAt,
      players,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerNotes: customer.notes,
    });

    setSubmitting(false);

    if (error || !bookingCode) {
      setSubmitError(error ?? "Couldn't confirm the booking. Please try again.");
      // The slot may have just been taken; drop the selection so availability refreshes.
      setSlot(null);
      setSheet("none");
      retryAvailability();
      return;
    }

    onBookingConfirmed?.({
      id: bookingCode,
      activity,
      date,
      slot,
      duration,
      players,
      customer,
      total: duration.price + peakSurcharge,
      createdAt: new Date().toISOString(),
    });

    setBookingId(bookingCode);
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
    setSubmitError(null);
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

            {activitiesLoading ? (
              <ActivityListSkeleton count={2} />
            ) : activitiesError ? (
              <StatePanel>
                <StateCard
                  icon={<AlertIcon />}
                  title="Couldn't load activities"
                  description="Check your connection and try again."
                  action={{ label: "Try again", onClick: () => void loadActivities() }}
                />
              </StatePanel>
            ) : activities.length === 0 ? (
              <StatePanel>
                <StateCard
                  icon={<TableIcon />}
                  title="Nothing to book right now"
                  description="New activities will appear here soon."
                />
              </StatePanel>
            ) : (
              <ActivityList activities={activities} onSelect={selectActivity} />
            )}
          </div>
        )}

        {stage === "schedule" && activity && (
          <>
            <div key="schedule" className="flex-1 animate-[fade-slide-up_320ms_ease-out] overflow-y-auto pt-4">
              {/* Hero — same photo-card + bottom scrim + name/tagline overlay
                  treatment as the homepage's table cards. */}
              <div className="mx-6 mb-6 animate-[fade-scale-in_400ms_ease-out] overflow-hidden rounded-4xl border border-ivory/10 light:border-felt-dark/10">
                <div className="relative h-90 bg-cover bg-center" style={{ backgroundImage: `url(${activity.image})` }}>
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
                    style={{
                      background: "linear-gradient(to top, rgba(11,36,28,0.92), rgba(11,36,28,0))",
                    }}
                  />
                  <div className="relative flex h-full flex-col justify-end p-5">
                    <span className="font-display text-xl leading-none tracking-[-0.06em] text-ivory">
                      {activity.name}
                    </span>
                    {activity.tagline && (
                      <span className="mt-1 text-xs tracking-tight text-ivory/75">{activity.tagline}</span>
                    )}
                  </div>
                </div>
              </div>

              <SectionCard delayMs={0}>
                <SectionHeader
                  label="Date"
                  value={date ? `${date.dayLabel}, ${date.dayNumber} ${date.monthLabel}` : undefined}
                />
                <DateCalendar
                  selectedId={date?.id ?? null}
                  onSelect={selectDate}
                  isDateDisabled={isDateClosed}
                  loading={settingsLoading}
                />
              </SectionCard>

              {/* Duration comes before time: availability is computed per duration. */}
              <SectionCard delayMs={60}>
                <SectionHeader
                  label="Duration"
                  value={duration ? `${duration.label} · ₹${duration.price}` : "Choose a length"}
                />
                <DurationSelector
                  durations={activity.durations}
                  selectedId={duration?.id ?? null}
                  onSelect={selectDuration}
                />
              </SectionCard>

              <SectionCard delayMs={120}>
                <SectionHeader label="Time" value={slot ? slot.label : "Choose a slot"} />
                {!duration ? (
                  <StateCard
                    compact
                    icon={<HourglassIcon />}
                    title="Pick a duration first"
                    description="Available times depend on how long you'd like to play."
                  />
                ) : settingsLoading || slotsLoading ? (
                  <SlotGridSkeleton />
                ) : slotsError ? (
                  <StateCard
                    compact
                    icon={<AlertIcon />}
                    title="Couldn't check availability"
                    description="Please try again."
                    action={{ label: "Retry", onClick: retryAvailability }}
                  />
                ) : slots.length === 0 ? (
                  <StateCard
                    compact
                    icon={<ClockIcon />}
                    title="No times available"
                    description="Try another day or a shorter duration."
                  />
                ) : (
                  <SlotGrid slots={slots} selectedId={slot?.id ?? null} onSelect={setSlot} />
                )}
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

              {submitError && (
                <p
                  role="alert"
                  className="mx-6 mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-300 light:text-red-700"
                >
                  {submitError}
                </p>
              )}
            </div>

            <BookingBar
              label={
                !duration
                  ? "Select a duration"
                  : !slot
                    ? "Select a time slot"
                    : session
                      ? `Continue with ${activity.name}`
                      : "Log in to continue"
              }
              subLabel={total !== undefined ? `₹${total} total${slot?.isPeak ? " · peak hour" : ""}` : undefined}
              disabled={!canContinue}
              onPress={openNextSheet}
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

        <LoginSheet open={sheet === "login"} onClose={() => setSheet("none")} onSubmit={handleLogin} />

        <CustomerDetailsSheet
          open={sheet === "details"}
          initial={session ? { name: session.name, phone: session.phone, notes: customer?.notes } : customer}
          onClose={() => setSheet("none")}
          onSubmit={handleDetailsSubmit}
        />

        <ReviewSheet
          open={sheet === "review"}
          draft={draft}
          submitting={submitting}
          onClose={() => setSheet("none")}
          onEditSchedule={() => setSheet("none")}
          onEditDetails={() => setSheet("details")}
          onConfirm={() => void handleConfirm()}
        />
      </div>
    </div>
  );
};

export default BookingPage;