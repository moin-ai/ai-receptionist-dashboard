import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, PhoneCall, Users, Trophy } from "lucide-react";
import { listCallLogs, listAppointments, isBooked, type CallLog, type CalendarEvent } from "@/lib/ghl";
import { isToday } from "date-fns";

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

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof PhoneCall }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default async function OverviewPage() {
  const { calls, appts, error } = await load();
  const callsToday = calls.filter((c) => c.createdAt && isToday(new Date(c.createdAt))).length;
  const booked = calls.filter(isBooked).length;

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
        <Stat label="Calls today" value={callsToday} icon={PhoneCall} />
        <Stat label="Upcoming appointments" value={appts.length} icon={CalendarDays} />
        <Stat label="Booked by AI" value={booked} icon={Trophy} />
        <Stat label="Recent calls" value={calls.length} icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appts.length === 0 && <p className="text-sm text-muted-foreground">No upcoming appointments.</p>}
            {appts.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{a.title ?? "Appointment"}</span>
                <span className="text-muted-foreground">{new Date(a.startTime).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent calls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {calls.length === 0 && <p className="text-sm text-muted-foreground">No calls yet.</p>}
            {calls.slice(0, 6).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.fromNumber ?? "Unknown caller"}</span>
                <span className="line-clamp-1 max-w-[60%] text-muted-foreground">{c.summary ?? "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
