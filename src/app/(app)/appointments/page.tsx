import { startOfMonth, endOfMonth, format } from "date-fns";
import { listAppointments, type CalendarEvent } from "@/lib/ghl";
import { getStatuses, type LeadStatus } from "@/lib/leads";
import { MonthCalendar, type CalItem } from "@/components/month-calendar";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const monthStr = month ?? format(new Date(), "yyyy-MM");
  const monthDate = new Date(monthStr + "-01T00:00:00");
  const start = startOfMonth(monthDate).getTime();
  const end = endOfMonth(monthDate).getTime();

  let events: CalendarEvent[] = [];
  let error: string | null = null;
  try {
    events = await listAppointments(start, end);
  } catch (e) {
    error = (e as Error).message;
  }

  const statuses = await getStatuses(
    events.map((e) => e.contactId).filter((x): x is string => !!x),
  ).catch(() => ({}) as Record<string, LeadStatus>);

  const items: CalItem[] = events.map((e) => ({
    id: e.id,
    title: e.title || "Appointment",
    startTime: e.startTime,
    contactId: e.contactId,
    status: e.contactId ? statuses[e.contactId] : undefined,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <p className="text-muted-foreground">Everything your AI receptionist booked.</p>
      </header>
      {error && <p className="text-sm text-destructive">Couldn&apos;t load appointments: {error}</p>}
      <MonthCalendar month={monthStr} items={items} />
    </div>
  );
}
