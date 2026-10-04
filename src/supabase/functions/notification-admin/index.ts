// Admin-only API for the Notifications page. Verifies the caller is an admin in code
// (the gateway JWT check is off in config.toml).
import { createClient } from "npm:@supabase/supabase-js@2";
import { serviceClient, loadTimeZone } from "../_shared/db.ts";
import { corsHeaders, json } from "../_shared/http.ts";
import { getChannel } from "../_shared/channels/index.ts";
import { ntfyInfo } from "../_shared/channels/ntfy.ts";
import {
  telegramGetMe,
  telegramRecentChats,
} from "../_shared/channels/telegram.ts";
import { sendToChannel } from "../_shared/deliver.ts";
import { renderTestMessage } from "../_shared/messages.ts";

const isAdminCaller = async (req: Request): Promise<boolean> => {
  const auth = req.headers.get("Authorization");
  if (!auth) return false;
  const userDb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const { data, error } = await userDb.rpc("is_admin");
  return !error && data === true;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  if (!(await isAdminCaller(req)))
    return json({ error: "You don't have permission to do that." }, 403);

  let body: { action?: string; channel?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const db = serviceClient();

  try {
    switch (body.action) {
      case "status": {
        const tg = getChannel("telegram")!;
        const ntfy = ntfyInfo();
        const tgConfigured = tg.isConfigured();

        let tokenValid: boolean | null = null;
        let botUsername: string | null = null;
        if (tgConfigured) {
          const me = await telegramGetMe();
          tokenValid = me.ok;
          botUsername = me.ok ? me.username : null;
        }

        const { count } = await db
          .from("telegram_destinations")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true);

        return json({
          telegram: {
            configured: tgConfigured,
            token_valid: tokenValid,
            bot_username: botUsername,
            destinations: count ?? 0,
          },
          ntfy: { configured: ntfy.configured, server: ntfy.server },
        });
      }

      case "test": {
        const channel = getChannel(body.channel ?? "");
        if (!channel) return json({ error: "Unknown channel." }, 400);
        if (!channel.isConfigured()) {
          return json({
            ok: false,
            results: [
              {
                channel: channel.id,
                destination: "n/a",
                status: "failed",
                reason: "not_configured",
              },
            ],
          });
        }
        const tz = await loadTimeZone(db);
        const results = await sendToChannel(
          db,
          channel,
          {
            eventId: null,
            bookingId: null,
            bookingCode: null,
            eventType: "test",
          },
          renderTestMessage(tz),
        );
        return json({
          ok: results.length > 0 && results.every((r) => r.status === "sent"),
          results: results.map((r) => ({
            channel: r.channel,
            destination: r.destination,
            status: r.status,
            reason: r.reason,
          })),
        });
      }

      case "telegram_detect_chats": {
        const res = await telegramRecentChats();
        if (!res.ok) {
          const msg =
            res.reason === "webhook_active"
              ? "This bot has a webhook set, so chats can't be detected. Add the chat ID manually."
              : res.reason === "not_configured"
              ? "The Telegram bot token isn't set on the server."
              : "Couldn't reach Telegram. Please try again.";
          return json({ error: msg }, 400);
        }
        return json({ chats: res.chats });
      }

      case "ntfy_info": {
        const info = ntfyInfo();
        if (!info.configured)
          return json(
            { error: "ntfy isn't configured on the server yet." },
            400,
          );
        return json({ server: info.server, topic: info.topic });
      }

      default:
        return json({ error: "Unknown action." }, 400);
    }
  } catch (e) {
    console.error("notification-admin failed", (e as Error).message);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
