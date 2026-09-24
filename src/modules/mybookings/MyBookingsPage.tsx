import Navbar from "../home/components/Navbar";
import BookingCard from "./components/BookingCard";
import EmptyBookings from "./components/EmptyBookings";
import { BookingCardSkeleton } from "../booking/components/Skeleton";
import StateCard, { AlertIcon } from "../booking/components/StateCard";
import type { Booking } from "../booking/types";

type MyBookingsPageProps = {
  bookings: Booking[];
  loading?: boolean;
  error?: string | null;
  /** False when no customer session exists (nothing to look up). */
  loggedIn: boolean;
  onRetry?: () => void;
  /** Back to the home page. */
  onBack: () => void;
  /** Jump straight into the booking flow — used by the empty state. */
  onStartBooking: () => void;
};

/**
 * Read-only booking history, fetched from the database by the logged-in
 * customer's phone number. Flat, newest-first list; each card expands in
 * place for the full detail set.
 */
const MyBookingsPage = ({
  bookings,
  loading,
  error,
  loggedIn,
  onRetry,
  onBack,
  onStartBooking,
}: MyBookingsPageProps) => {
  return (
    <div className="flex h-dvh w-full justify-center overflow-hidden bg-felt font-sans light:bg-cream">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden">
        <Navbar onBack={onBack} title="My Bookings" onBookNow={onStartBooking} />

        {!loggedIn ? (
          <EmptyBookings
            title="Log in to see your bookings"
            description="Make a booking and log in with your mobile number, and it'll show up here."
            onStartBooking={onStartBooking}
          />
        ) : loading && bookings.length === 0 ? (
          <div role="status" aria-label="Loading your bookings" className="flex-1 overflow-y-auto px-6 pt-1">
            {[0, 1, 2].map((i) => (
              <BookingCardSkeleton key={i} delayMs={i * 60} />
            ))}
          </div>
        ) : error ? (
          <div className="px-6 pt-4">
            <div className="rounded-4xl border border-ivory/10 bg-ivory/5 px-5 py-8 light:border-felt-dark/10 light:bg-felt-dark/5">
              <StateCard
                icon={<AlertIcon />}
                title="Couldn't load your bookings"
                description="Check your connection and try again."
                action={onRetry ? { label: "Try again", onClick: onRetry } : undefined}
              />
            </div>
          </div>
        ) : bookings.length > 0 ? (
          <div className="flex-1 animate-[fade-slide-up_320ms_ease-out] overflow-y-auto px-6 pb-6 pt-1">
            {bookings.map((booking, i) => (
              <BookingCard key={booking.id} booking={booking} delayMs={i * 60} />
            ))}
          </div>
        ) : (
          <EmptyBookings onStartBooking={onStartBooking} />
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;