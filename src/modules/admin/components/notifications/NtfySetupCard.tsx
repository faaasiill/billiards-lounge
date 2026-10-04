import { useState } from "react";
import Spinner from "../Spinner";
import { fetchNtfyInfo, type NtfyInfo, type ServiceStatus } from "../../services/notificationsService";

type NtfySetupCardProps = { status: ServiceStatus | null };

const CopyField = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable: the value is still selectable */
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-neutral-700">{label}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 font-mono text-xs text-neutral-900 outline-none"
        />
        <button
          type="button"
          onClick={() => void copy()}
          className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
};

const NtfySetupCard = ({ status }: NtfySetupCardProps) => {
  const [info, setInfo] = useState<NtfyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = status?.ntfy.configured ?? false;

  const reveal = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    const { data, error: infoError } = await fetchNtfyInfo();
    setLoading(false);
    if (infoError || !data) {
      setError(infoError ?? "Couldn't load the subscription details.");
      return;
    }
    setInfo(data);
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
      <h3 className="text-sm font-medium text-neutral-900">ntfy devices</h3>
      <p className="mt-1 text-xs text-neutral-500">
        Subscribe each admin phone or computer to the private topic. The topic works like a password, so only reveal
        it to people who should receive booking alerts.
      </p>

      {!configured && status && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          ntfy isn't configured on the server yet. See the setup guide.
        </p>
      )}

      {info ? (
        <div className="mt-4 flex flex-col gap-3">
          <CopyField label="Server" value={info.server} />
          <CopyField label="Topic" value={info.topic} />
          <ol className="list-decimal space-y-1 pl-5 text-xs text-neutral-600">
            <li>Install the ntfy app (Android, iOS) or open the ntfy web app on desktop.</li>
            <li>If you use a self-hosted server, set it as the default server in the app settings.</li>
            <li>Choose "Subscribe to topic" and paste the topic above, then allow notifications.</li>
            <li>Use "Send test ntfy notification" above to confirm it arrives.</li>
          </ol>
        </div>
      ) : (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void reveal()}
            disabled={loading || !configured}
            className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {loading && <Spinner className="h-3 w-3" />}
            {loading ? "Loading…" : "Show subscription details"}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </section>
  );
};

export default NtfySetupCard;