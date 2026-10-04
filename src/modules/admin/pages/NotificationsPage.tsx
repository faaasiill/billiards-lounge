import { useCallback, useEffect, useState } from "react";
import {
  fetchServiceStatus,
  getNotificationSettings,
  listDeliveries,
  listTelegramDestinations,
  sendTestNotification,
  updateNotificationSettings,
  type BookingEventType,
  type ChannelId,
  type DeliveryRecord,
  type NotificationSettings,
  type ServiceStatus,
  type SettingsPatch,
  type TelegramDestination,
} from "../services/notificationsService";
import ErrorState from "../components/ErrorState";
import Spinner from "../components/Spinner";
import ServicesCard from "../components/notifications/ServicesCard";
import EventMatrixCard from "../components/notifications/EventMatrixCard";
import TimingCard from "../components/notifications/TimingCard";
import TelegramDestinationsCard from "../components/notifications/TelegramDestinationsCard";
import NtfySetupCard from "../components/notifications/NtfySetupCard";
import HistoryCard from "../components/notifications/HistoryCard";

/** UI refresh of the history list only. Real scheduling happens on the server (pg_cron). */
const HISTORY_REFRESH_MS = 30_000;

const NotificationsPage = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [destinations, setDestinations] = useState<TelegramDestination[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [status, setStatus] = useState<ServiceStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);

  const loadStatus = useCallback(async () => {
    const { data } = await fetchServiceStatus();
    setStatus(data);
  }, []);

  const loadDestinations = useCallback(async () => {
    const { data } = await listTelegramDestinations();
    setDestinations(data);
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryRefreshing(true);
    const { data } = await listDeliveries();
    setDeliveries(data);
    setHistoryRefreshing(false);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const [settingsRes, destinationsRes, historyRes] = await Promise.all([
      getNotificationSettings(),
      listTelegramDestinations(),
      listDeliveries(),
    ]);

    if (settingsRes.error || !settingsRes.data) {
      setLoadError(settingsRes.error ?? "Couldn't load notification settings.");
      setLoading(false);
      return;
    }

    setSettings(settingsRes.data);
    setDestinations(destinationsRes.data);
    setDeliveries(historyRes.data);
    setLoading(false);
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const id = window.setInterval(() => void loadHistory(), HISTORY_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [loadHistory]);

  /** Optimistic save; rolls back and shows the error if the database refuses. */
  const patchSettings = async (patch: SettingsPatch): Promise<{ error: string | null }> => {
    if (!settings) return { error: "Settings aren't loaded yet." };

    const previous = settings;
    setSettings({ ...settings, ...patch });
    setSaveError(null);

    const { error } = await updateNotificationSettings(patch);
    if (error) {
      setSettings(previous);
      setSaveError(error);
    }
    return { error };
  };

  const handleChannelToggle = (channel: ChannelId, enabled: boolean) => {
    void patchSettings(channel === "telegram" ? { telegram_enabled: enabled } : { ntfy_enabled: enabled });
  };

  const handleRoutingChange = (event: BookingEventType, channel: ChannelId, value: boolean) => {
    if (!settings) return;
    void patchSettings({
      routing: {
        ...settings.routing,
        [event]: { ...settings.routing[event], [channel]: value },
      },
    });
  };

  const handleTest = async (channel: ChannelId) => {
    const result = await sendTestNotification(channel);
    void loadHistory();
    return result;
  };

  const handleDestinationsChanged = () => {
    void loadDestinations();
    void loadStatus();
  };

  if (loading) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-14 text-sm text-neutral-500"
      >
        <Spinner className="h-5 w-5" />
        Loading notifications…
      </div>
    );
  }

  if (loadError || !settings) {
    return (
      <ErrorState
        description={loadError ?? "Couldn't load notification settings."}
        action={
          <button
            onClick={() => void loadAll()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Try again
          </button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">Notifications</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Alerts for you and your staff only. Customers never receive anything from this system.
        </p>
      </section>

      {saveError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {saveError}
        </p>
      )}

      <ServicesCard settings={settings} status={status} onToggle={handleChannelToggle} onTest={handleTest} />

      <EventMatrixCard settings={settings} onChange={handleRoutingChange} />

      <TimingCard
        minutes={settings.arrival_lead_minutes}
        onSave={(minutes) => patchSettings({ arrival_lead_minutes: minutes })}
      />

      <TelegramDestinationsCard
        destinations={destinations}
        tokenConfigured={status?.telegram.configured ?? false}
        onChanged={handleDestinationsChanged}
      />

      <NtfySetupCard status={status} />

      <HistoryCard deliveries={deliveries} refreshing={historyRefreshing} onRefresh={() => void loadHistory()} />
    </div>
  );
};

export default NotificationsPage;