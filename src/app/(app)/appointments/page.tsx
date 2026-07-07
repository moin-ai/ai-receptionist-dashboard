import Link from "next/link";
import { CalendarDays, CalendarClock, ChevronRight } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { listAppointments, type CalendarEvent } from "@/lib/ghl";
import { getStatuses, type LeadStatus } from "@/lib/leads";
import { StatusBadge } from "@/components/status-badge";
import { MonthCalendar, type CalItem } from "@/components/month-calendar";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string }>;
}) {
  const { month, view } = await searchParams;
  const upcoming = view === "upcoming";

  const monthStr = month ?? format(new Date(), "yyyy-MM");
  const monthDate = new Date(monthStr + "-01T00:00:00");
  const start = upcoming ? Date.now() : startOfMonth(monthDate).getTime();
  const end = upcoming ? Date.now() + 90 * 864e5 : endOfMonth(monthDate).getTime();

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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Appointments</h1>
          <p className="text-muted-foreground">Everything your AI receptionist booked.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/appointments" className={cn(buttonVariants({ variant: upcoming ? "outline" : "default", size: "sm" }))}>
            <CalendarDays className="h-4 w-4" /> Calendar
          </Link>
          <Link href="/appointments?view=upcoming" className={cn(buttonVariants({ variant: upcoming ? "default" : "outline", size: "sm" }))}>
            <CalendarClock className="h-4 w-4" /> Upcoming
          </Link>
        </div>
      </header>

      {error && <p className="text-sm text-destructive">Couldn&apos;t load appointments: {error}</p>}

      {upcoming ? (
        <Card className="py-0">
          <div className="divide-y divide-border/60">
            {events.length === 0 && !error && (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <CalendarClock className="h-8 w-8 opacity-50" />
                <p className="text-sm">No upcoming appointments in the next 90 days.</p>
              </div>
            )}
            {[...events]
              .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
              .map((e) => {
                const d = new Date(e.startTime);
                return (
                  <Link
                    key={e.id}
                    href={e.contactId ? `/clients/${e.contactId}?from=appointments` : "/appointments"}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <span className="text-[10px] font-semibold uppercase leading-none">{format(d, "MMM")}</span>
                      <span className="text-base font-bold leading-tight">{format(d, "d")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{e.title || "Appointment"}</p>
                      <p className="text-sm text-muted-foreground">{format(d, "EEEE · h:mm a")}</p>
                    </div>
                    {e.contactId && statuses[e.contactId] && <StatusBadge status={statuses[e.contactId]} />}
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
          </div>
        </Card>
      ) : (
        <MonthCalendar
          month={monthStr}
          items={events.map((e): CalItem => ({
            id: e.id,
            title: e.title || "Appointment",
            startTime: e.startTime,
            contactId: e.contactId,
            status: e.contactId ? statuses[e.contactId] : undefined,
          }))}
        />
      )}
    </div>
  );
}
