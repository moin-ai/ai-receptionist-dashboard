import Link from "next/link";
import { ArrowUpRight, CalendarDays, PhoneCall, Trophy, Users } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCallLogs, listAppointments, isBooked, type CallLog, type CalendarEvent } from "@/lib/ghl";
import { format, isToday } from "date-fns";

export const dynamic = "force-dynamic";

// Fetch live from GHL; on error (e.g. scopes not enabled yet) show an empty state
// instead of crashing the page.
async function load() {
  try {
    const now = Date.now();
    const [calls, appts] = await Promise.all([
      listCallLogs({ pageSize: 50 }),
      listAppointments(now, now + 30 * 864e5),
    ]);
    return { calls: calls.callLogs, appts, error: null as string | null };
  } catch (e) {
    return { calls: [] as CallLog[], appts: [] as CalendarEvent[], error: (e as Error).message };
  }
}

function Stat({ label, value, icon: Icon, href }: { label: string; value: number; icon: typeof PhoneCall; href: string }) {
  return (
    <Link href={href} className="group focus-visible:outline-none">
      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </CardHeader>
        <CardContent className="flex items-end justify-between">
          <div className="text-3xl font-semibold">{value}</div>
          <ArrowUpRight className="h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
        </CardContent>
      </Card>
    </Link>
  );
}

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
      View all <ArrowUpRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export default async function OverviewPage() {
  const { calls, appts, error } = await load();
  const callsToday = calls.filter((c) => c.createdAt && isToday(new Date(c.createdAt))).length;
  const booked = calls.filter(isBooked).length;
  const upcoming = [...appts].sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-muted-foreground">Everything your AI receptionist handled, at a glance.</p>
      </header>

      {error && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4 text-sm text-amber-800 dark:text-amber-200">
            Couldn&apos;t load live data yet. Make sure the GoHighLevel Private Integration has the required
            read scopes enabled. <span className="opacity-60">({error})</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Calls today" value={callsToday} icon={PhoneCall} href="/calls" />
        <Stat label="Upcoming appointments" value={appts.length} icon={CalendarDays} href="/appointments?view=upcoming" />
        <Stat label="Booked by AI" value={booked} icon={Trophy} href="/calls" />
        <Stat label="Recent calls" value={calls.length} icon={Users} href="/calls" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming appointments</CardTitle>
            <CardAction>
              <ViewAll href="/appointments?view=upcoming" />
            </CardAction>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming appointments.</p>}
            <div className="-mx-2">
              {upcoming.slice(0, 6).map((a) => (
                <Link
                  key={a.id}
                  href={a.contactId ? `/clients/${a.contactId}` : "/appointments?view=upcoming"}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <span className="truncate font-medium">{a.title ?? "Appointment"}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {format(new Date(a.startTime), "EEE, MMM d · h:mm a")}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent calls</CardTitle>
            <CardAction>
              <ViewAll href="/calls" />
            </CardAction>
          </CardHeader>
          <CardContent>
            {calls.length === 0 && <p className="text-sm text-muted-foreground">No calls yet.</p>}
            <div className="-mx-2">
              {calls.slice(0, 6).map((c) => {
                const row = (
                  <>
                    <span className="shrink-0 font-medium tabular-nums">{c.extractedData?.name || c.fromNumber || "Unknown caller"}</span>
                    <span className="truncate text-muted-foreground">{c.summary ?? "—"}</span>
                  </>
                );
                return c.contactId ? (
                  <Link key={c.id} href={`/clients/${c.contactId}`} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent">
                    {row}
                  </Link>
                ) : (
                  <div key={c.id} className="flex items-center gap-3 px-2 py-2 text-sm">{row}</div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
