import { useState, type FormEvent } from "react";
import Spinner from "../Spinner";
import Toggle from "./Toggle";
import {
  addTelegramDestination,
  detectTelegramChats,
  removeTelegramDestination,
  setTelegramDestinationActive,
  type DetectedChat,
  type TelegramDestination,
} from "../../services/notificationsService";

type TelegramDestinationsCardProps = {
  destinations: TelegramDestination[];
  tokenConfigured: boolean;
  onChanged: () => void;
};

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60";

const labelClass = "mb-1.5 block text-xs font-medium text-neutral-700";

const TelegramDestinationsCard = ({ destinations, tokenConfigured, onChanged }: TelegramDestinationsCardProps) => {
  const [chatId, setChatId] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<DetectedChat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const existing = new Set(destinations.map((d) => d.chat_id));

  const add = async (id: string, name: string) => {
    setError(null);
    const { error: addError } = await addTelegramDestination(id, name);
    if (addError) {
      setError(addError);
      return false;
    }
    onChanged();
    return true;
  };

  const handleManualAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (adding) return;
    setAdding(true);
    const ok = await add(chatId, label);
    setAdding(false);
    if (ok) {
      setChatId("");
      setLabel("");
    }
  };

  const handleDetect = async () => {
    if (detecting) return;
    setDetecting(true);
    setError(null);
    const { data, error: detectError } = await detectTelegramChats();
    setDetecting(false);
    if (detectError) {
      setError(detectError);
      return;
    }
    setDetected(data ?? []);
  };

  const handleToggle = async (destination: TelegramDestination, value: boolean) => {
    setBusyId(destination.id);
    setError(null);
    const { error: toggleError } = await setTelegramDestinationActive(destination.id, value);
    setBusyId(null);
    if (toggleError) setError(toggleError);
    else onChanged();
  };

  const handleRemove = async (destination: TelegramDestination) => {
    setBusyId(destination.id);
    setError(null);
    const { error: removeError } = await removeTelegramDestination(destination.id);
    setBusyId(null);
    setConfirmId(null);
    if (removeError) setError(removeError);
    else onChanged();
  };

  const newlyDetected = (detected ?? []).filter((c) => !existing.has(c.chat_id));

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
      <h3 className="text-sm font-medium text-neutral-900">Telegram chats</h3>
      <p className="mt-1 text-xs text-neutral-500">
        Every active chat below receives each enabled notification. Add one per admin, or a staff group.
      </p>

      {!tokenConfigured && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          The bot token isn't set on the server yet, so nothing can be sent. See the setup guide.
        </p>
      )}

      {destinations.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-neutral-300 px-3 py-6 text-center text-xs text-neutral-500">
          No chats yet. Open your bot in Telegram, press Start, then use "Detect chats" below.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200">
          {destinations.map((d) => (
            <li key={d.id} className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{d.label || "Unnamed chat"}</p>
                <p className="truncate font-mono text-xs text-neutral-500">{d.chat_id}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
                <Toggle
                  checked={d.is_active}
                  onChange={(value) => void handleToggle(d, value)}
                  disabled={busyId === d.id}
                  label={`${d.label || d.chat_id} active`}
                />
                {confirmId === d.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      disabled={busyId === d.id}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRemove(d)}
                      disabled={busyId === d.id}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {busyId === d.id && <Spinner className="h-3 w-3" />}
                      Confirm remove
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(d.id)}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {/* Detect */}
      <div className="mt-5 border-t border-neutral-100 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleDetect()}
            disabled={detecting || !tokenConfigured}
            className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {detecting && <Spinner className="h-3 w-3" />}
            {detecting ? "Looking…" : "Detect chats"}
          </button>
          <p className="text-xs text-neutral-500">Shows chats that recently messaged your bot.</p>
        </div>

        {detected && (
          <ul className="mt-3 flex flex-col gap-2">
            {newlyDetected.length === 0 ? (
              <li className="text-xs text-neutral-500">
                Nothing new found. Send your bot a message in Telegram, then try again.
              </li>
            ) : (
              newlyDetected.map((chat) => (
                <li
                  key={chat.chat_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">{chat.label}</p>
                    <p className="truncate font-mono text-xs text-neutral-500">
                      {chat.chat_id} · {chat.type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void add(chat.chat_id, chat.label)}
                    className="shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                  >
                    Add
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        {/* Manual */}
        <form onSubmit={(e) => void handleManualAdd(e)} noValidate className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="tg-chat-id" className={labelClass}>
              Chat ID
            </label>
            <input
              id="tg-chat-id"
              inputMode="numeric"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              disabled={adding}
              placeholder="e.g. 123456789"
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="tg-chat-label" className={labelClass}>
              Name <span className="text-neutral-400">(optional)</span>
            </label>
            <input
              id="tg-chat-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={adding}
              placeholder="e.g. Front desk"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={adding || chatId.trim() === ""}
            className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding && <Spinner />}
            {adding ? "Adding…" : "Add chat"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default TelegramDestinationsCard;