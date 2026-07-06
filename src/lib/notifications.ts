import "server-only";
import { listCallLogs, listAppointments, listContacts, contactName } from "@/lib/ghl";

export type NotificationItem = {
  id: string;
  type: "appointment" | "cancelled" | "call" | "client";
  title: string;
  subtitle?: string;
  time: string; // ISO
  href: string;
};

// Derive a unified activity feed from GHL (source of truth) — no separate store.
// "Unread" is decided client-side against a last-seen timestamp.
// ponytail: cancellation time uses the appointment's dateUpdated (GHL gives no
// status-change log); good enough for a feed. Upgrade to webhook events if exact
// change timestamps ever matter.
export async function getNotifications(): Promise<NotificationItem[]> {
  const now = Date.now();
  const [callsRes, appts, contactsRes] = await Promise.all([
    listCallLogs({ pageSize: 50 }).catch(() => ({ callLogs: [] })),
    listAppointments(now - 45 * 864e5, now + 60 * 864e5).catch(() => []),
    listContacts({ limit: 50 }).catch(() => ({ contacts: [] })),
  ]);

  const items: NotificationItem[] = [];

  for (const c of callsRes.callLogs) {
    if (c.trialCall) continue;
    const name = c.extractedData?.name || c.fromNumber || "Unknown caller";
    items.push({
      id: `call-${c.id}`,
      type: "call",
      title: `New call from ${name}`,
      subtitle: c.summary?.slice(0, 90),
      time: c.createdAt,
      href: c.contactId ? `/clients/${c.contactId}` : "/calls",
    });
  }

  for (const a of appts) {
    const cancelled = (a.appointmentStatus ?? "").toLowerCase() === "cancelled";
    items.push({
      id: `appt-${a.id}-${cancelled ? "x" : "n"}`,
      type: cancelled ? "cancelled" : "appointment",
      title: cancelled ? `Appointment cancelled: ${a.title ?? "Appointment"}` : `New appointment: ${a.title ?? "Appointment"}`,
      subtitle: new Date(a.startTime).toLocaleString(),
      time: (cancelled ? a.dateUpdated : a.dateAdded) || a.startTime,
      href: a.contactId ? `/clients/${a.contactId}` : "/appointments",
    });
  }

  for (const ct of contactsRes.contacts) {
    if (!ct.dateAdded) continue;
    items.push({
      id: `client-${ct.id}`,
      type: "client",
      title: `New client: ${contactName(ct)}`,
      subtitle: ct.phone || ct.email,
      time: ct.dateAdded,
      href: `/clients/${ct.id}`,
    });
  }

  return items
    .filter((i) => i.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 60);
}
