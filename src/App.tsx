import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import HomePage from "./modules/home";
import { ThemeProvider } from "./context/ThemeContext";
import { isAdminPath } from "./modules/admin/hooks/useAdminRoute";
import { useCustomerSession } from "./modules/booking/hooks/useCustomerSession";
import type { Booking } from "./modules/booking/types";
import type { InfoPage } from "./modules/info/types";

// Only the home page is in the initial bundle; everything else is split out.
const AdminApp = lazy(() => import("./modules/admin"));
const BookingPage = lazy(() => import("./modules/booking"));
const MyBookingsPage = lazy(() => import("./modules/mybookings"));
const AboutPage = lazy(() => import("./modules/about"));
const ContactPage = lazy(() => import("./modules/contact"));
const LocationPage = lazy(() => import("./modules/location"));

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

  // Warm the other views once the home page is idle so navigation stays instant.
  useEffect(() => {
    const warm = () => {
      void import("./modules/booking");
      void import("./modules/mybookings");
      void import("./modules/about");
      void import("./modules/contact");
      void import("./modules/location");
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warm);
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(warm, 2000);
    return () => window.clearTimeout(id);
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
    const { listBookingsByPhone } = await import("./modules/booking/services/userBookingsService");
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

      <Suspense fallback={null}>
        {view === "booking" && (
          <BookingPage
            onExit={goHome}
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
          <AboutPage onBack={goHome} onStartBooking={goBooking} onMyBookings={goMyBookings} onNavigate={goInfo} />
        )}

        {view === "contact" && (
          <ContactPage onBack={goHome} onStartBooking={goBooking} onMyBookings={goMyBookings} onNavigate={goInfo} />
        )}

        {view === "location" && (
          <LocationPage onBack={goHome} onStartBooking={goBooking} onMyBookings={goMyBookings} onNavigate={goInfo} />
        )}
      </Suspense>
    </ThemeProvider>
  );
};

export default App;