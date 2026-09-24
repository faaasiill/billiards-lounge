import { useCallback, useEffect, useMemo, useState } from "react";
import { listCustomers, type AdminCustomer } from "../services/customersService";
import { useAdminRoute } from "../hooks/useAdminRoute";
import { formatCurrency } from "../lib/bookingTime";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { CustomerRowSkeleton } from "../components/Skeleton";
import { ChevronRightIcon, SearchIcon } from "../components/icons";

const CustomersPage = () => {
  const { navigate } = useAdminRoute();

  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await listCustomers();
    setCustomers(data);
    setLoadError(error);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D+/g, "");
    if (!q) return customers;

    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || (qDigits.length >= 3 && c.phone.replace(/\D+/g, "").includes(qDigits)),
    );
  }, [customers, query]);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">Customers</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {loading
            ? "Fetching customers…"
            : `${customers.length} ${customers.length === 1 ? "customer" : "customers"}, grouped by phone number.`}
        </p>
      </section>

      <div className="relative">
        <SearchIcon
          width={16}
          height={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <input
          id="customer-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone"
          className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-3.5 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 sm:text-sm"
        />
      </div>

      {loading ? (
        <ul
          role="status"
          aria-label="Loading customers"
          className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white"
        >
          {Array.from({ length: 6 }, (_, i) => (
            <CustomerRowSkeleton key={i} />
          ))}
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
          title={query ? "No matching customers" : "No customers yet"}
          description={
            query
              ? "Try a different name or phone number."
              : "Customers appear here automatically after their first booking."
          }
        />
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {visible.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => navigate(`/admin/customers/${customer.id}`)}
                className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-neutral-50 active:bg-neutral-100"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                  {customer.name.trim().slice(0, 1).toUpperCase() || "?"}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{customer.name}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {customer.phone} · {customer.active_bookings}{" "}
                    {customer.active_bookings === 1 ? "booking" : "bookings"}
                  </p>
                </div>

                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-neutral-900">{formatCurrency(customer.total_spent)}</p>
                  <p className="text-xs text-neutral-500">spent</p>
                </div>

                <ChevronRightIcon width={16} height={16} className="shrink-0 text-neutral-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomersPage;