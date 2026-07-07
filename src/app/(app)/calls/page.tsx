import { PhoneCall } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickRow } from "@/components/click-row";
import { RecordingPlayer } from "@/components/recording-player";
import { listCallLogs, isBooked, type CallLog } from "@/lib/ghl";
import { getStatuses, type LeadStatus } from "@/lib/leads";
import { StatusBadge } from "@/components/status-badge";
import { initials, formatPhone } from "@/lib/utils";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

function fmtDuration(s?: number) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  return m ? `${m}m ${s % 60}s` : `${s}s`;
}

const th = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

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
        <Table className="[&_td]:px-4 [&_td]:py-3 [&_th]:px-4">
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className={th}>Caller</TableHead>
              <TableHead className={th}>When</TableHead>
              <TableHead className={th}>Duration</TableHead>
              <TableHead className={`hidden xl:table-cell ${th}`}>Summary</TableHead>
              <TableHead className={`hidden md:table-cell ${th}`}>Recording</TableHead>
              <TableHead className={th}>Outcome</TableHead>
              <TableHead className={th}>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <PhoneCall className="h-8 w-8 opacity-50" />
                    <p>No calls yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {calls.map((c) => {
              const name = c.extractedData?.name || formatPhone(c.fromNumber) || "Unknown caller";
              const st = c.contactId ? statuses[c.contactId] : undefined;
              const cells = (
                <>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {initials(name)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{name}</p>
                        {c.extractedData?.name && c.fromNumber && (
                          <p className="text-xs tabular-nums text-muted-foreground">{formatPhone(c.fromNumber)}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {c.createdAt ? format(new Date(c.createdAt), "MMM d, h:mm a") : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{fmtDuration(c.duration)}</TableCell>
                  <TableCell className="hidden max-w-72 truncate text-muted-foreground xl:table-cell">
                    {c.summary ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c.messageId ? (
                      <RecordingPlayer messageId={c.messageId} className="h-9 w-60" />
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
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
