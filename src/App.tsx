import { lazy, Suspense, useEffect, useState } from "react";
import HomePage from "./modules/home";
import BookingPage from "./modules/booking";
import MyBookingsPage from "./modules/mybookings";
import { ThemeProvider } from "./context/ThemeContext";
import { isAdminPath } from "./modules/admin/hooks/useAdminRoute";
import type { Booking } from "./modules/booking/types";

const AdminApp = lazy(() => import("./modules/admin"));

type View = "home" | "booking" | "myBookings";

const App = () => {
  const [view, setView] = useState<View>("home");
  const [adminRoute, setAdminRoute] = useState(() => isAdminPath(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setAdminRoute(isAdminPath(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Lifted here (rather than local to BookingPage) so a booking survives
  // navigating away to My Bookings and back — the whole point of the
  // history page. In a real app this would be fetched from an API instead.
  const [bookings, setBookings] = useState<Booking[]>([]);

  const addBooking = (booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
  };

  if (adminRoute) {
    return (
      <Suspense
        fallback={
          <div className="flex h-dvh w-full items-center justify-center bg-neutral-50 text-sm text-neutral-500">
            Loading…
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    );
  }

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