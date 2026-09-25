import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  addAdminByEmail,
  createAdminAccount,
  listAdmins,
  removeAdmin,
  type AdminRecord,
} from "../services/adminsService";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Spinner from "../components/Spinner";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60";

const labelClass = "mb-1.5 block text-xs font-medium text-neutral-700";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

/** Generates a strong random password so the admin doesn't have to invent one. */
const generatePassword = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

type Tab = "create" | "grant";

const AdminsPage = () => {
  const { user } = useAdminAuth();

  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("create");

  // --- Create new admin account ---
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // --- Grant access to an existing account ---
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await listAdmins();
    setAdmins(data);
    setLoadError(error);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (creating) return;

    const clean = newEmail.trim().toLowerCase();
    setCreateSuccess(null);

    if (!EMAIL_PATTERN.test(clean)) {
      setCreateError("Enter a valid email address.");
      return;
    }
    if (newPassword.length < 8) {
      setCreateError("Password must be at least 8 characters.");
      return;
    }

    setCreateError(null);
    setCreating(true);
    const { error } = await createAdminAccount(clean, newPassword, newName.trim() || undefined);
    setCreating(false);

    if (error) {
      setCreateError(error);
      return;
    }

    setCreateSuccess(`${clean} was created with admin access.`);
    setNewName("");
    setNewEmail("");
    setNewPassword(generatePassword());
    setShowPassword(false);
    void load();
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (adding) return;

    const clean = email.trim().toLowerCase();
    setFormSuccess(null);

    if (!EMAIL_PATTERN.test(clean)) {
      setFormError("Enter a valid email address.");
      return;
    }

    setFormError(null);
    setAdding(true);
    const { error } = await addAdminByEmail(clean);
    setAdding(false);

    if (error) {
      setFormError(error);
      return;
    }

    setEmail("");
    setFormSuccess(`${clean} is now an admin.`);
    void load();
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    setRowError(null);
    const { error } = await removeAdmin(id);
    setRemovingId(null);
    setConfirmId(null);

    if (error) {
      setRowError(error);
      return;
    }
    void load();
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
    } catch {
      // Clipboard API unavailable — the field is still selectable/visible.
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">Admins</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Admins can access this panel and manage other admins.
        </p>
      </section>

      {/* Add admin */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <div className="flex gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
          <button
            type="button"
            onClick={() => setTab("create")}
            aria-pressed={tab === "create"}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === "create" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Create new admin
          </button>
          <button
            type="button"
            onClick={() => setTab("grant")}
            aria-pressed={tab === "grant"}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === "grant" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Grant to existing account
          </button>
        </div>

        {tab === "create" ? (
          <div className="mt-5">
            <h3 className="text-sm font-medium text-neutral-900">Create a new admin account</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Creates a brand-new sign-in and grants it admin access — no need to touch Supabase. Only existing
              admins can do this.
            </p>

            <form onSubmit={(e) => void handleCreate(e)} noValidate className="mt-4 flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="new-admin-name" className={labelClass}>
                    Full name <span className="text-neutral-400">(optional)</span>
                  </label>
                  <input
                    id="new-admin-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    disabled={creating}
                    placeholder="e.g. Priya Nair"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="create-admin-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="create-admin-email"
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={creating}
                    placeholder="new-admin@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="create-admin-password" className={labelClass}>
                  Temporary password
                </label>
                <div className="flex gap-2">
                  <input
                    id="create-admin-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={creating}
                    autoComplete="new-password"
                    className={`${inputClass} font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={creating}
                    className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyPassword()}
                    disabled={creating}
                    className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generatePassword())}
                    disabled={creating}
                    className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Share this with them securely. They can change it after signing in.
                </p>
              </div>

              {createError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {createError}
                </p>
              )}
              {createSuccess && (
                <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {createSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={creating || newEmail.trim() === ""}
                className="flex items-center justify-center gap-2 self-start rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating && <Spinner />}
                {creating ? "Creating…" : "Create admin"}
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-5">
            <h3 className="text-sm font-medium text-neutral-900">Grant access to an existing account</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Use this if the person already has an account (e.g. they signed up on the customer site) and you just
              want to make them an admin.
            </p>

            <form onSubmit={(e) => void handleAdd(e)} noValidate className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label htmlFor="new-admin-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="new-admin-email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={adding}
                  placeholder="existing-user@example.com"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={adding || email.trim() === ""}
                className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {adding && <Spinner />}
                {adding ? "Adding…" : "Grant access"}
              </button>
            </form>

            {formError && (
              <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {formSuccess}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Admin list */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-neutral-900">Current admins</h3>

        {rowError && (
          <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {rowError}
          </p>
        )}

        {loading ? (
          <ul role="status" aria-label="Loading admins" className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 p-4">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-neutral-200/80" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 animate-pulse rounded-md bg-neutral-200/80" />
                  <div className="h-3 w-24 animate-pulse rounded-md bg-neutral-200/80" />
                </div>
              </li>
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
        ) : admins.length === 0 ? (
          <EmptyState title="No admins found" description="Add an admin above to get started." />
        ) : (
          <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {admins.map((admin) => {
              const isSelf = admin.user_id === user?.id;
              const confirming = confirmId === admin.user_id;
              const removing = removingId === admin.user_id;

              return (
                <li key={admin.user_id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                      {admin.email.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {admin.email}
                        {isSelf && (
                          <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-500">Added {formatDate(admin.created_at)}</p>
                    </div>
                  </div>

                  {!isSelf && (
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                      {confirming ? (
                        <>
                          <button
                            onClick={() => setConfirmId(null)}
                            disabled={removing}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => void handleRemove(admin.user_id)}
                            disabled={removing}
                            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {removing && <Spinner className="h-3 w-3" />}
                            {removing ? "Removing…" : "Confirm remove"}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setRowError(null);
                            setConfirmId(admin.user_id);
                          }}
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminsPage;