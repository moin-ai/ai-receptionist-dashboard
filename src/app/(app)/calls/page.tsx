import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickRow } from "@/components/click-row";
import { listCallLogs, isBooked, type CallLog } from "@/lib/ghl";
import { getStatuses, type LeadStatus } from "@/lib/leads";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

function fmtDuration(s?: number) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  return m ? `${m}m ${s % 60}s` : `${s}s`;
}

export default async function CallsPage() {
  let calls: CallLog[] = [];
  let error: string | null = null;
  try {
    const res = await listCallLogs({ pageSize: 50 });
    calls = res.callLogs.filter((c) => !c.trialCall);
  } catch (e) {
    error = (e as Error).message;
  }
  const statuses = await getStatuses(
    calls.map((c) => c.contactId).filter((x): x is string => !!x),
  ).catch(() => ({}) as Record<string, LeadStatus>);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Calls</h1>
        <p className="text-muted-foreground">Every call your AI receptionist handled.</p>
      </header>

      {error && <p className="text-sm text-destructive">Couldn&apos;t load calls: {error}</p>}

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Caller</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="hidden md:table-cell">Summary</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No calls yet.
                </TableCell>
              </TableRow>
            )}
            {calls.map((c) => {
              const name = c.extractedData?.name || c.fromNumber || "Unknown caller";
              const st = c.contactId ? statuses[c.contactId] : undefined;
              const cells = (
                <>
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {c.createdAt ? format(new Date(c.createdAt), "MMM d, h:mm a") : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{fmtDuration(c.duration)}</TableCell>
                  <TableCell className="hidden max-w-[340px] truncate text-muted-foreground md:table-cell">
                    {c.summary ?? "—"}
                  </TableCell>
                  <TableCell>{isBooked(c) && <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Booked</Badge>}</TableCell>
                  <TableCell>{st && <StatusBadge status={st} />}</TableCell>
                </>
              );
              return c.contactId ? (
                <ClickRow key={c.id} href={`/clients/${c.contactId}`}>{cells}</ClickRow>
              ) : (
                <TableRow key={c.id}>{cells}</TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
