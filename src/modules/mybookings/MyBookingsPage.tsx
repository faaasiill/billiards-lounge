import Navbar from "../home/components/Navbar";
import BookingCard from "./components/BookingCard";
import EmptyBookings from "./components/EmptyBookings";
import type { Booking } from "../booking/types";

type MyBookingsPageProps = {
  bookings: Booking[];
  /** Back to the home page. */
  onBack: () => void;
  /** Jump straight into the booking flow — used by the empty state. */
  onStartBooking: () => void;
};

/**
 * Read-only booking history. Deliberately has no status labels or
 * sections (upcoming/past, confirmed/cancelled, etc.) per spec — it's a
 * flat, newest-first list of everything the user has booked, each card
 * expandable in place for the full detail set.
 */
const MyBookingsPage = ({ bookings, onBack, onStartBooking }: MyBookingsPageProps) => {
  const hasBookings = bookings.length > 0;

  return (
    <div className="flex h-dvh w-full justify-center overflow-hidden bg-felt font-sans light:bg-cream">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden">
        <Navbar onBack={onBack} title="My Bookings" onBookNow={onStartBooking} />

        {hasBookings ? (
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