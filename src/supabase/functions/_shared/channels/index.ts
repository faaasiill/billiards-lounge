import type { ChannelId, NotificationChannel } from "../types.ts";
import { telegramChannel } from "./telegram.ts";
import { ntfyChannel } from "./ntfy.ts";

/** The registry. Add future channels here. */
export const channels: NotificationChannel[] = [telegramChannel, ntfyChannel];

export const getChannel = (id: string): NotificationChannel | undefined =>
  channels.find((c) => c.id === (id as ChannelId));