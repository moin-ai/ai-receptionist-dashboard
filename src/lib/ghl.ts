import "server-only";

// Thin GoHighLevel API client. Server-only: uses the secret Private Integration
// Token. GHL is our source of truth — we fetch live, we don't mirror it.

const BASE = process.env.GHL_BASE_URL ?? "https://services.leadconnectorhq.com";
const TOKEN = process.env.GHL_API_TOKEN!;
const VERSION = process.env.GHL_API_VERSION ?? "2021-07-28";
export const LOCATION_ID = process.env.GHL_LOCATION_ID!;

async function ghl<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, Version: VERSION, Accept: "application/json" },
    // GHL data changes slowly enough that a short cache keeps us well under rate limits.
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GHL ${res.status} ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ---- Types (only the fields we use, matched to real API responses) ----
export type CallAction = {
  actionType?: string; // e.g. "APPOINTMENT_BOOKING"
  actionName?: string;
  executedAt?: string;
};

export type CallLog = {
  id: string;
  contactId?: string;
  agentId?: string;
  fromNumber?: string;
  createdAt: string;
  duration?: number; // seconds
  summary?: string;
  transcript?: string; // lines prefixed "bot:" / "human:"
  extractedData?: { name?: string; email?: string; address?: string } & Record<string, unknown>;
  executedCallActions?: CallAction[];
  messageId?: string;
  trialCall?: boolean;
};

export type CalendarEvent = {
  id: string;
  title?: string;
  calendarId?: string;
  contactId?: string;
  startTime: string; // ISO w/ tz offset
  endTime?: string;
  appointmentStatus?: string; // confirmed | showed | noshow | cancelled | ...
  address?: string;
  notes?: string;
  assignedUserId?: string;
  createdBy?: { source?: string; userId?: string | null };
  dateAdded?: string;
  dateUpdated?: string;
};

export type Contact = {
  id: string;
  firstName?: string;
  lastName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  address1?: string;
  tags?: string[];
  dateAdded?: string;
};

// ---- Derived helpers ----
export function contactName(c: Pick<Contact, "firstName" | "lastName" | "contactName" | "email" | "phone">): string {
  const full = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  return c.contactName || full || c.email || c.phone || "Unknown";
}

export function isBooked(c: CallLog): boolean {
  return !!c.executedCallActions?.some((a) => a.actionType === "APPOINTMENT_BOOKING");
}

export type TranscriptLine = { role: "bot" | "human"; text: string };
export function parseTranscript(t?: string): TranscriptLine[] {
  if (!t) return [];
  return t
    .split("\n")
    .map((line) => {
      const i = line.indexOf(":");
      if (i === -1) return null;
      const role = line.slice(0, i).trim().toLowerCase();
      const text = line.slice(i + 1).trim();
      if (!text) return null;
      return { role: role === "human" ? "human" : "bot", text } as TranscriptLine;
    })
    .filter((x): x is TranscriptLine => x !== null);
}

// ---- Calls ---- (AI receptionist handles inbound calls; callType filters LIVE vs TRIAL)
export function listCallLogs(opts: {
  callType?: "LIVE" | "TRIAL";
  contactId?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  return ghl<{ total: number; page: number; pageSize: number; callLogs: CallLog[] }>(
    "/voice-ai/dashboard/call-logs",
    { locationId: LOCATION_ID, page: 1, pageSize: 50, ...opts },
  );
}

export function getCallLog(callId: string) {
  return ghl<CallLog>(`/voice-ai/dashboard/call-logs/${callId}`, { locationId: LOCATION_ID });
}

// ---- Calendars & appointments ----
export function listCalendars() {
  return ghl<{ calendars: { id: string; name?: string }[] }>("/calendars/", { locationId: LOCATION_ID });
}

// Events require a calendarId, so fetch all calendars and merge. startTime/endTime in millis.
export async function listAppointments(startMs: number, endMs: number): Promise<CalendarEvent[]> {
  const { calendars } = await listCalendars();
  const results = await Promise.all(
    calendars.map((c) =>
      ghl<{ events: CalendarEvent[] }>("/calendars/events", {
        locationId: LOCATION_ID,
        calendarId: c.id,
        startTime: startMs,
        endTime: endMs,
      }).then((r) => r.events ?? []).catch(() => [] as CalendarEvent[]),
    ),
  );
  return results.flat();
}

// ---- Contacts ----
export function listContacts(opts: { query?: string; limit?: number; startAfterId?: string } = {}) {
  return ghl<{ contacts: Contact[]; meta?: unknown }>("/contacts/", {
    locationId: LOCATION_ID,
    limit: 50,
    ...opts,
  });
}

export function getContact(contactId: string) {
  return ghl<{ contact: Contact }>(`/contacts/${contactId}`, {});
}

export function getContactAppointments(contactId: string) {
  return ghl<{ events: CalendarEvent[] }>(`/contacts/${contactId}/appointments`, {});
}
