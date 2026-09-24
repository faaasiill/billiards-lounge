import { useCallback, useEffect, useState } from "react";

const KEY = "billiards.customer";
const EVENT = "customer-session-changed";

export type CustomerSession = { name: string; phone: string };

/** Digits only; drops a leading 91 / 0 for Indian numbers so the same person always matches. */
export const normalizePhone = (raw: string): string => {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
};

export const isValidPhone = (raw: string) => normalizePhone(raw).length === 10;

const read = (): CustomerSession | null => {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CustomerSession) : null;
  } catch {
    return null;
  }
};

export const useCustomerSession = () => {
  const [session, setSession] = useState<CustomerSession | null>(read);

  useEffect(() => {
    const sync = () => setSession(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const login = useCallback((next: CustomerSession) => {
    const clean = { name: next.name.trim(), phone: normalizePhone(next.phone) };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(clean));
    } catch {
      /* storage unavailable: session lasts for this page view only */
    }
    setSession(clean);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setSession(null);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { session, login, logout };
};