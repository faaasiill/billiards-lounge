import { useCallback, useEffect, useState } from "react";
import { getCustomerDetails, type CustomerDetails } from "../services/customersService";
import { cancelBooking, type AdminBooking } from "../services/bookingsService";
import { useAdminRoute } from "../hooks/useAdminRoute";
import { useNow } from "../hooks/useNow";
import { formatBookingDate, formatCurrency, formatHours } from "../lib/bookingTime";
import BookingCard from "../components/BookingCard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { CustomerDetailsSkeleton } from "../components/Skeleton";
import { ArrowLeftIcon, PhoneIcon } from "../components/icons";

type CustomerDetailsPageProps = { customerId: string };

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-4">
    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
    <p className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-900">{value}</p>
    {hint && <p className="mt-0.5 truncate text-xs text-neutral-500">{hint}</p>}
  </div>
);

const CustomerDetailsPage = ({ customerId }: CustomerDetailsPageProps) => {
  const { navigate } = useAdminRoute();
  const now = useNow(30_000);

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await getCustomerDetails(customerId);
    setCustomer(data);
    setLoadError(error);
    setLoading(false);
  }, [customerId]);

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

    // Reload so the stats (spent, counts) stay accurate after a cancellation.
    void load();
  };

  const backButton = (
    <button
      type="button"
      onClick={() => navigate("/admin/customers")}
      className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
    >
      <ArrowLeftIcon width={14} height={14} />
      All customers
    </button>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {backButton}
        <div role="status" aria-label="Loading customer">
          <CustomerDetailsSkeleton />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-4">
        {backButton}
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
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col gap-4">
        {backButton}
        <EmptyState
          title="Customer not found"
          description="We couldn't find any bookings for this customer."
          action={
            <button
              onClick={() => navigate("/admin/customers")}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Back to customers
            </button>
          }
        />
      </div>
    );
  }

  const averageSpend = customer.active_bookings > 0 ? customer.total_spent / customer.active_bookings : 0;

  return (
    <div className="flex flex-col gap-6">
      {backButton}

      {/* Profile */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-white">
              {customer.name.trim().slice(0, 1).toUpperCase() || "?"}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight text-neutral-900">{customer.name}</h2>
              <p className="truncate text-sm text-neutral-500">{customer.phone}</p>
              <p className="mt-0.5 text-xs text-neutral-400">
                Customer since {formatBookingDate(customer.first_booking_at)}
              </p>
            </div>
          </div>

          <a
            href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`}
            className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.98]"
          >
            <PhoneIcon width={16} height={16} />
            Call customer
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Total bookings"
          value={String(customer.total_bookings)}
          hint={customer.cancelled_bookings > 0 ? `${customer.cancelled_bookings} cancelled` : "None cancelled"}
        />
        <Stat label="Total spent" value={formatCurrency(customer.total_spent)} hint={`Avg ${formatCurrency(averageSpend)} per booking`} />
        <Stat label="Time played" value={formatHours(customer.total_minutes)} hint="Excludes cancelled" />
        <Stat
          label="Favourite"
          value={customer.favourite_activity ?? "—"}
          hint={customer.average_players > 0 ? `Avg ${customer.average_players.toFixed(1)} players` : undefined}
        />
      </section>

      {/* Notes */}
      {customer.notes.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
          <h3 className="text-sm font-medium text-neutral-900">Notes from bookings</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {customer.notes.map((note) => (
              <li key={note} className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                {note}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* History */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-neutral-900">Booking history</h3>

        {actionError && (
          <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {actionError}
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {customer.bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} now={now} onCancel={handleCancel} />
          ))}
        </ul>
      </section>
    </div>
  );
};

export default CustomerDetailsPage;