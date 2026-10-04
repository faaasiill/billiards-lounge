import type { Destination, NotificationChannel, RenderedMessage, SendResult } from "../types.ts";

const TIMEOUT_MS = 8_000;

const config = () => ({
  base: (Deno.env.get("NTFY_BASE_URL") ?? "https://ntfy.sh").replace(/\/+$/, ""),
  topic: Deno.env.get("NTFY_TOPIC") ?? "",
  token: Deno.env.get("NTFY_TOKEN") ?? "",
  appUrl: (Deno.env.get("APP_URL") ?? "").replace(/\/+$/, ""),
});

export const ntfyInfo = () => {
  const { base, topic } = config();
  return { server: base, topic, configured: Boolean(topic) };
};

export const ntfyChannel: NotificationChannel = {
  id: "ntfy",
  label: "ntfy",

  isConfigured: () => Boolean(config().topic),

  // One shared topic; every admin device subscribes to it.
  // (Per-admin topics would just be more destinations here.)
  listDestinations(): Promise<Destination[]> {
    const { base } = config();
    return Promise.resolve([{ key: "default", label: `ntfy · ${new URL(base).host}` }]);
  },

  async send(_destination: Destination, message: RenderedMessage): Promise<SendResult> {
    const { base, topic, token, appUrl } = config();
    if (!topic) return { ok: false, reason: "not_configured", retryable: false };

    // JSON publishing keeps unicode safe (no header encoding issues).
    const payload: Record<string, unknown> = {
      topic,
      title: message.title,
      message: message.fields.map(([k, v]) => `${k}: ${v}`).join("\n"),
      priority: message.priority,
      tags: message.tags,
    };
    if (appUrl) payload.click = `${appUrl}/#/admin/bookings`;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${base}/`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) return { ok: true };

      if (res.status === 401 || res.status === 403) return { ok: false, reason: "ntfy_auth_failed", retryable: false };
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After"));
        return { ok: false, reason: "rate_limited", retryable: true, retryAfterSec: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60 };
      }
      if (res.status >= 500) return { ok: false, reason: `ntfy_server_error_${res.status}`, retryable: true };
      return { ok: false, reason: `ntfy_error_${res.status}`, retryable: false };
    } catch (e) {
      const err = e as Error;
      if (err?.name === "TimeoutError" || err?.name === "AbortError") return { ok: false, reason: "timeout", retryable: true };
      return { ok: false, reason: `network_error: ${err?.message ?? "unknown"}`.slice(0, 200), retryable: true };
    }
  },
};