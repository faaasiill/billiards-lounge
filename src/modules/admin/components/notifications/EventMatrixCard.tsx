import Toggle from "./Toggle";
import {
  CHANNELS,
  EVENTS,
  type BookingEventType,
  type ChannelId,
  type NotificationSettings,
} from "../../services/notificationsService";

type EventMatrixCardProps = {
  settings: NotificationSettings;
  onChange: (event: BookingEventType, channel: ChannelId, value: boolean) => void;
};

const EventMatrixCard = ({ settings, onChange }: EventMatrixCardProps) => {
  const channelOn = (channel: ChannelId) =>
    channel === "telegram" ? settings.telegram_enabled : settings.ntfy_enabled;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
      <h3 className="text-sm font-medium text-neutral-900">Events</h3>
      <p className="mt-1 text-xs text-neutral-500">
        Pick the channels each event uses. A service that is switched off above stays off for every event.
      </p>

      <ul className="mt-4 flex flex-col gap-2.5">
        {EVENTS.map((event) => (
          <li
            key={event.id}
            className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900">{event.label}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{event.description}</p>
            </div>

            <div className="flex shrink-0 items-center gap-5">
              {CHANNELS.map((channel) => (
                <div key={channel.id} className="flex items-center gap-2">
                  <Toggle
                    checked={settings.routing[event.id][channel.id]}
                    onChange={(value) => onChange(event.id, channel.id, value)}
                    disabled={!channelOn(channel.id)}
                    label={`${event.label} via ${channel.label}`}
                  />
                  <span className="text-xs text-neutral-600">{channel.label}</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default EventMatrixCard;