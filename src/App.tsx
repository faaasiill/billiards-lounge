import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import HomePage from "./modules/home";
import BookingPage from "./modules/booking";
import MyBookingsPage from "./modules/mybookings";
import AboutPage from "./modules/about";
import ContactPage from "./modules/contact";
import LocationPage from "./modules/location";
import { ThemeProvider } from "./context/ThemeContext";
import { isAdminPath } from "./modules/admin/hooks/useAdminRoute";
import { useCustomerSession } from "./modules/booking/hooks/useCustomerSession";
import { listBookingsByPhone } from "./modules/booking/services/userBookingsService";
import type { Booking } from "./modules/booking/types";
import type { InfoPage } from "./modules/info/types";

const AdminApp = lazy(() => import("./modules/admin"));

type View = "home" | "booking" | "myBookings" | InfoPage;

const App = () => {
  const [view, setView] = useState<View>("home");
  const [adminRoute, setAdminRoute] = useState(() => isAdminPath(window.location.hash));

  const { session } = useCustomerSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  useEffect(() => {
    const onHashChange = () => setAdminRoute(isAdminPath(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const phone = session?.phone ?? null;

  const refreshBookings = useCallback(async () => {
    if (!phone) {
      setBookings([]);
      setBookingsError(null);
      return;
    }

    setBookingsLoading(true);
    setBookingsError(null);
    const { data, error } = await listBookingsByPhone(phone);
    setBookings(data);
    setBookingsError(error);
    setBookingsLoading(false);
  }, [phone]);

  // Refetch whenever the user opens My Bookings, or logs in/out while on it.
  useEffect(() => {
    if (view === "myBookings") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void refreshBookings();
    }
  }, [view, refreshBookings]);

  const goHome = () => setView("home");
  const goBooking = () => setView("booking");
  const goMyBookings = () => setView("myBookings");
  const goInfo = (page: InfoPage) => setView(page);

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
      {view === "home" && (
        <HomePage onReserve={goBooking} onMyBookings={goMyBookings} onNavigate={goInfo} />
      )}

      {view === "booking" && (
        <BookingPage
          onExit={goHome}
          // The database is the source of truth now; My Bookings refetches when opened.
          onBookingConfirmed={() => {}}
          onViewBookings={goMyBookings}
          onNavigate={goInfo}
        />
      )}

      {view === "myBookings" && (
        <MyBookingsPage
          bookings={bookings}
          loading={bookingsLoading}
          error={bookingsError}
          loggedIn={Boolean(session)}
          onRetry={() => void refreshBookings()}
          onBack={goHome}
          onStartBooking={goBooking}
          onNavigate={goInfo}
        />
      )}

      {view === "about" && (
        <AboutPage
          onBack={goHome}
          onStartBooking={goBooking}
          onMyBookings={goMyBookings}
          onNavigate={goInfo}
        />
      )}

      {view === "contact" && (
        <ContactPage
          onBack={goHome}
          onStartBooking={goBooking}
          onMyBookings={goMyBookings}
          onNavigate={goInfo}
        />
      )}

      {view === "location" && (
        <LocationPage
          onBack={goHome}
          onStartBooking={goBooking}
          onMyBookings={goMyBookings}
          onNavigate={goInfo}
        />
      )}
    </ThemeProvider>
  );
};

export default App;