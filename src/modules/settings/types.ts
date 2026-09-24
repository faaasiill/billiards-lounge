export type ClosureKind = "holiday" | "leave";

export interface ClubSettings {
  /** "HH:mm" (24h) */
  openTime: string;
  /** "HH:mm" (24h) */
  closeTime: string;
  slotIntervalMinutes: number;
  /** 0 = Sunday … 6 = Saturday, matching Date.getDay(). */
  weeklyOffDays: number[];
}

export interface ClubClosure {
  id: string;
  /** yyyy-mm-dd (inclusive) */
  startDate: string;
  /** yyyy-mm-dd (inclusive) */
  endDate: string;
  reason: string;
  kind: ClosureKind;
}

export const DEFAULT_SETTINGS: ClubSettings = {
  openTime: "10:00",
  closeTime: "22:00",
  slotIntervalMinutes: 60,
  weeklyOffDays: [],
};

export const SLOT_INTERVAL_OPTIONS = [15, 30, 45, 60, 90, 120] as const;