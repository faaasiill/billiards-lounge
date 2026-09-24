import { useState } from "react";
import HomePage from "./modules/home";
import BookingPage from "./modules/booking";
import MyBookingsPage from "./modules/mybookings";
import { ThemeProvider } from "./context/ThemeContext";
import type { Booking } from "./modules/booking/types";

type View = "home" | "booking" | "myBookings";

const App = () => {
  const [view, setView] = useState<View>("home");

  // Lifted here (rather than local to BookingPage) so a booking survives
  // navigating away to My Bookings and back — the whole point of the
  // history page. In a real app this would be fetched from an API instead.
  const [bookings, setBookings] = useState<Booking[]>([]);

  const addBooking = (booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
  };

  return (
    <ThemeProvider>
      {view === "home" && <HomePage onReserve={() => setView("booking")} />}

      {view === "booking" && (
        <BookingPage
          onExit={() => setView("home")}
          onBookingConfirmed={addBooking}
          onViewBookings={() => setView("myBookings")}
        />
      )}

      {view === "myBookings" && (
        <MyBookingsPage
          bookings={bookings}
          onBack={() => setView("home")}
          onStartBooking={() => setView("booking")}
        />
      )}
    </ThemeProvider>
  );
};

export default App;