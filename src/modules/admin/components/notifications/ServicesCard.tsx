import { useState } from "react";
import Spinner from "../Spinner";
import Toggle from "./Toggle";
import Badge, { type BadgeTone } from "./Badge";
import {
  describeReason,
  type ChannelId,
  type NotificationSettings,
  type ServiceStatus,
  type TestResult,
} from "../../services/notificationsService";

type ServicesCardProps = {
  settings: NotificationSettings;
  status: ServiceStatus | null;
  onToggle: (channel: ChannelId, enabled: boolean) => void;
  onTest: (channel: ChannelId) => Promise<{ data: TestResult | null; error: string | null }>;
};

type Message = { tone: "ok" | "bad"; text: string };

type ServiceRowProps = {
  name: string;
  description: string;
  badge: { tone: BadgeTone; label: string };
  enabled: boolean;
  onToggle: (value: boolean) => void;
  onTest: () => Promise<{ data: TestResult | null; error: string | null }>;
};

const ServiceRow = ({ name, description, badge, enabled, onToggle, onTest }: ServiceRowProps) => {
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const handleTest = async () => {
    if (testing) return;
    setTesting(true);
    setMessage(null);
    const { data, error } = await onTest();
    setTesting(false);

    if (error || !data) {
      setMessage({ tone: "bad", text: error ?? "The test didn't go through." });
      return;
    }
    if (data.ok) {
      const n = data.results.length;
      setMessage({ tone: "ok", text: `Test sent to ${n} ${n === 1 ? "destination" : "destinations"}. Check your device.` });
      return;
    }
    const failed = data.results.find((r) => r.status !== "sent");
    setMessage({ tone: "bad", text: describeReason(failed?.reason ?? null) || "The test didn't go through." });
  };

  return (
    <li className="rounded-xl border border-neutral-200 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-neutral-900">{name}</p>
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
        </div>
        <Toggle checked={enabled} onChange={onToggle} label={`${name} notifications`} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleTest()}
          disabled={testing}
          className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
        >
          {testing && <Spinner className="h-3 w-3" />}
          {testing ? "Sending…" : `Send test ${name} notification`}
        </button>
        {message && (
          <p
            role={message.tone === "bad" ? "alert" : "status"}
            className={`text-xs ${message.tone === "bad" ? "text-red-600" : "text-emerald-700"}`}
          >
            {message.text}
          </p>
        )}
      </div>
    </li>
  );
};

const ServicesCard = ({ settings, status, onToggle, onTest }: ServicesCardProps) => {
  const telegramBadge = (): { tone: BadgeTone; label: string } => {
    if (!status) return { tone: "muted", label: "Checking…" };
    if (!status.telegram.configured) return { tone: "muted", label: "Not configured" };
    if (status.telegram.token_valid === false) return { tone: "bad", label: "Invalid token" };
    if (status.telegram.destinations === 0) return { tone: "warn", label: "No chat added" };
    return { tone: "ok", label: "Connected" };
  };

  const ntfyBadge = (): { tone: BadgeTone; label: string } => {
    if (!status) return { tone: "muted", label: "Checking…" };
    return status.ntfy.configured ? { tone: "ok", label: "Configured" } : { tone: "muted", label: "Not configured" };
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
      <h3 className="text-sm font-medium text-neutral-900">Services</h3>
      <p className="mt-1 text-xs text-neutral-500">
        Both can be on at the same time. If both are off, bookings still work normally and nothing is sent.
      </p>

      <ul className="mt-4 flex flex-col gap-2.5">
        <ServiceRow
          name="Telegram"
          description={
            status?.telegram.bot_username
              ? `Sends to your admin chats through @${status.telegram.bot_username}.`
              : "Sends to your admin Telegram chats."
          }
          badge={telegramBadge()}
          enabled={settings.telegram_enabled}
          onToggle={(value) => onToggle("telegram", value)}
          onTest={() => onTest("telegram")}
        />
        <ServiceRow
          name="ntfy"
          description="Pushes to every admin device subscribed to the private topic."
          badge={ntfyBadge()}
          enabled={settings.ntfy_enabled}
          onToggle={(value) => onToggle("ntfy", value)}
          onTest={() => onTest("ntfy")}
        />
      </ul>
    </section>
  );
};

export default ServicesCard;