import type { Destination, NotificationChannel, RenderedMessage, SendResult } from "../types.ts";

const API = "https://api.telegram.org";
const TIMEOUT_MS = 8_000;

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Never let the bot token leak into logs or the admin-visible failure reason. */
const redact = (s: string, token: string) => (token ? s.split(token).join("***") : s);

type ApiOutcome =
  | { kind: "response"; status: number; json: Record<string, unknown> | null }
  | { kind: "error"; reason: string; retryable: boolean };

const call = async (method: string, payload: Record<string, unknown> = {}): Promise<ApiOutcome> => {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) return { kind: "error", reason: "not_configured", retryable: false };

  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    return { kind: "response", status: res.status, json };
  } catch (e) {
    const err = e as Error;
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      return { kind: "error", reason: "timeout", retryable: true };
    }
    return {
      kind: "error",
      reason: `network_error: ${redact(err?.message ?? "unknown", token)}`.slice(0, 200),
      retryable: true,
    };
  }
};

const describeFailure = (status: number, json: Record<string, unknown> | null): Extract<SendResult, { ok: false }> => {
  const description = String(json?.description ?? "").toLowerCase();
  const retryAfter = Number((json?.parameters as { retry_after?: number } | undefined)?.retry_after);

  if (status === 429) {
    return { ok: false, reason: "rate_limited", retryable: true, retryAfterSec: Number.isFinite(retryAfter) ? retryAfter : 30 };
  }
  if (status === 401 || status === 404) return { ok: false, reason: "invalid_bot_token", retryable: false };
  if (status === 403) return { ok: false, reason: "bot_blocked_or_removed", retryable: false };
  if (status === 400 && description.includes("chat not found")) return { ok: false, reason: "invalid_chat_id", retryable: false };
  if (status >= 500) return { ok: false, reason: `telegram_server_error_${status}`, retryable: true };
  return { ok: false, reason: `telegram_error_${status}: ${description}`.slice(0, 200), retryable: false };
};

export const telegramChannel: NotificationChannel = {
  id: "telegram",
  label: "Telegram",

  isConfigured: () => Boolean(Deno.env.get("TELEGRAM_BOT_TOKEN")),

  async listDestinations(db): Promise<Destination[]> {
    const { data, error } = await db.from("telegram_destinations").select("chat_id, label").eq("is_active", true);
    if (error) throw new Error(error.message);
    return (data ?? []).map((d) => ({ key: d.chat_id as string, label: (d.label as string) || `chat ${d.chat_id}` }));
  },

  async send(destination: Destination, message: RenderedMessage): Promise<SendResult> {
    const body = message.fields.map(([k, v]) => `<b>${escapeHtml(k)}:</b> ${escapeHtml(v)}`).join("\n");
    const text = `${message.emoji} <b>${escapeHtml(message.title)}</b>\n\n${body}`;

    const out = await call("sendMessage", {
      chat_id: destination.key,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });

    if (out.kind === "error") return { ok: false, reason: out.reason, retryable: out.retryable };
    if (out.status === 200 && out.json?.ok === true) return { ok: true };
    return describeFailure(out.status, out.json);
  },
};

/* ----- helpers for the admin setup flow ----- */

export const telegramGetMe = async (): Promise<
  { ok: true; username: string | null } | { ok: false; reason: string }
> => {
  const out = await call("getMe");
  if (out.kind === "error") return { ok: false, reason: out.reason };
  if (out.status === 200 && out.json?.ok === true) {
    return { ok: true, username: ((out.json.result as { username?: string })?.username as string) ?? null };
  }
  return { ok: false, reason: describeFailure(out.status, out.json).reason };
};

export type DetectedChat = { chat_id: string; label: string; type: string };

export const telegramRecentChats = async (): Promise<
  { ok: true; chats: DetectedChat[] } | { ok: false; reason: string }
> => {
  const out = await call("getUpdates", { limit: 100, timeout: 0 });
  if (out.kind === "error") return { ok: false, reason: out.reason };
  if (out.status === 409) return { ok: false, reason: "webhook_active" };
  if (!(out.status === 200 && out.json?.ok === true)) return { ok: false, reason: describeFailure(out.status, out.json).reason };

  type Chat = { id: number; type: string; title?: string; first_name?: string; last_name?: string; username?: string };
  const updates = (out.json.result as Array<Record<string, { chat?: Chat }>>) ?? [];
  const seen = new Map<string, DetectedChat>();

  for (const u of updates) {
    const chat = (u.message ?? u.edited_message ?? u.channel_post ?? u.my_chat_member)?.chat;
    if (!chat) continue;
    const label =
      chat.title ||
      [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
      (chat.username ? `@${chat.username}` : `chat ${chat.id}`);
    seen.set(String(chat.id), { chat_id: String(chat.id), label, type: chat.type });
  }
  return { ok: true, chats: [...seen.values()] };
};