import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cancelBooking,
  customerKeyOf,
  listBookings,
  type AdminBooking,
} from "../services/bookingsService";
import { useAdminRoute } from "../hooks/useAdminRoute";
import { useNow } from "../hooks/useNow";
import BookingCard from "../components/BookingCard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { BookingCardSkeleton } from "../components/Skeleton";
import { SearchIcon } from "../components/icons";

type Filter = "upcoming" | "today" | "past" | "cancelled" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "today", label: "Today" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

const isSameDay = (iso: string, now: number) =>
  new Date(iso).toDateString() === new Date(now).toDateString();

const BookingsPage = () => {
  const { navigate } = useAdminRoute();
  const now = useNow(30_000);

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await listBookings();
    setBookings(data);
    setLoadError(error);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const handleCancel = async (booking: AdminBooking) => {
    setActionError(null);
    const { error } = await cancelBooking(booking.id);

    if (error) {
      setActionError(error);
      return;
    }

    // Update locally so the card changes instantly without a full reload.
    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id ? { ...b, status: "cancelled" } : b,
      ),
    );
  };

  const handleViewCustomer = (booking: AdminBooking) => {
    navigate(`/admin/customers/${customerKeyOf(booking.customer_phone)}`);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D+/g, "");

    const filtered = bookings.filter((b) => {
      const ended = new Date(b.end_at).getTime() <= now;
      const cancelled = b.status === "cancelled";

      switch (filter) {
        case "upcoming":
          if (cancelled || ended) return false;
          break;
        case "today":
          if (!isSameDay(b.start_at, now)) return false;
          break;
        case "past":
          if (cancelled || !ended) return false;
          break;
        case "cancelled":
          if (!cancelled) return false;
          break;
        case "all":
          break;
      }

      if (!q) return true;

      return (
        b.customer_name.toLowerCase().includes(q) ||
        b.booking_code.toLowerCase().includes(q) ||
        (qDigits.length >= 3 &&
          b.customer_phone.replace(/\D+/g, "").includes(qDigits))
      );
    });

    // Upcoming/today read best soonest-first; history reads best newest-first.
    const soonestFirst = filter === "upcoming" || filter === "today";
    return filtered.sort((a, b) => {
      const diff =
        new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
      return soonestFirst ? diff : -diff;
    });
  }, [bookings, filter, query, now]);

  const counts = useMemo(() => {
    let upcoming = 0;
    for (const b of bookings) {
      if (b.status !== "cancelled" && new Date(b.end_at).getTime() > now)
        upcoming += 1;
    }
    return { upcoming };
  }, [bookings, now]);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          Bookings
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {loading
            ? "Fetching the latest bookings…"
            : `${counts.upcoming} upcoming ${
                counts.upcoming === 1 ? "booking" : "bookings"
              }.`}
        </p>
      </section>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon
            width={16}
            height={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <label htmlFor="booking-search" className="sr-only">
            Search bookings
          </label>
          <input
            id="booking-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone or booking ID"
            className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-3.5 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 sm:text-sm"
          />
        </div>

        <div
          className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0"
          role="tablist"
          aria-label="Filter bookings"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition active:scale-95 ${
                filter === f.id
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {actionError}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <ul
          className="flex flex-col gap-3"
          role="status"
          aria-label="Loading bookings"
        >
          <BookingCardSkeleton />
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </ul>
      ) : loadError ? (
        <ErrorState
          description={loadError}
          action={
            <button
              onClick={() => void load()}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Try again
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={query ? "No matching bookings" : "No bookings here"}
          description={
            query
              ? "Try a different name, phone number or booking ID."
              : filter === "upcoming"
              ? "There are no upcoming bookings right now."
              : "Nothing to show for this filter."
          }
          action={
            query || filter !== "all" ? (
              <button
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Show all bookings
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              now={now}
              onCancel={handleCancel}
              onViewCustomer={handleViewCustomer}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default BookingsPage;
