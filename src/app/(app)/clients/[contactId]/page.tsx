import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Mail, MapPin, MessageSquareText, Phone, StickyNote } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LeadEditor } from "@/components/lead-editor";
import { RecordingPlayer } from "@/components/recording-player";
import {
  getContact,
  listCallLogs,
  getContactAppointments,
  contactName,
  parseTranscript,
  isBooked,
  type CallLog,
  type CalendarEvent,
} from "@/lib/ghl";
import { getLead } from "@/lib/leads";
import { initials, formatPhone } from "@/lib/utils";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  );
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ contactId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ contactId }, { from }] = await Promise.all([params, searchParams]);
  const back =
    from === "appointments"
      ? { href: "/appointments", label: "Back to appointments" }
      : { href: "/clients", label: "Back to clients" };

  let contact;
  try {
    contact = (await getContact(contactId)).contact;
  } catch {
    notFound();
  }

  const [callsRes, apptsRes, lead] = await Promise.all([
    listCallLogs({ contactId, pageSize: 20 }).catch(() => ({ callLogs: [] as CallLog[] })),
    getContactAppointments(contactId).catch(() => ({ events: [] as CalendarEvent[] })),
    getLead(contactId),
  ]);
  // GHL's contactId filter is unreliable — enforce it here so we never show another client's calls.
  const calls = callsRes.callLogs.filter((c) => c.contactId === contactId);
  const latest = calls[0];
  const pastAppts = apptsRes.events
    .filter((a) => +new Date(a.startTime) < Date.now())
    .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));
  const name = contactName(contact);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href={back.href} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {back.label}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
        {/* Left: client info + status/notes — sticky on desktop */}
        <div className="space-y-6 lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-1">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
                {initials(name)}
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-lg">{name}</CardTitle>
                {latest && isBooked(latest) && (
                  <Badge className="mt-1 bg-primary/15 text-primary hover:bg-primary/15">Appointment booked</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.phone && <InfoRow icon={Phone} label="Phone" value={<span className="tabular-nums">{formatPhone(contact.phone)}</span>} />}
              {contact.email && <InfoRow icon={Mail} label="Email" value={contact.email} />}
              {(contact.address1 || contact.city) && (
                <InfoRow icon={MapPin} label="Address" value={[contact.address1, contact.city, contact.state].filter(Boolean).join(", ")} />
              )}
              {contact.tags && contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {contact.tags.map((t) => <Badge key={t} variant="secondary" className="capitalize">{t}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lead status</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadEditor contactId={contactId} status={lead.status} notes={lead.notes} />
            </CardContent>
          </Card>

          {/* Only shown for returning clients — first-timers have no history to verify. */}
          {pastAppts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Previous appointments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {pastAppts.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{a.title || "Appointment"}</span>
                    <span className="ml-auto shrink-0 text-muted-foreground">{format(new Date(a.startTime), "MMM d, h:mm a")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: sticky summary + internally-scrolling conversation */}
        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-16 lg:h-[calc(100vh-5rem)]">
          {calls.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <MessageSquareText className="h-8 w-8 opacity-50" />
                <p>No calls recorded for this client.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shrink-0">
                <CardHeader>
                  <CardTitle className="text-base">Conversation summary</CardTitle>
                  <CardAction>
                    <span className="text-xs text-muted-foreground">
                      {latest?.createdAt ? format(new Date(latest.createdAt), "MMM d, yyyy · h:mm a") : ""}
                    </span>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{latest?.summary ?? "No summary available."}</p>
                  {latest?.messageId && <RecordingPlayer messageId={latest.messageId} />}
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <StickyNote className="h-3.5 w-3.5" /> Notes
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{lead.notes || "No notes mentioned."}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <CardHeader className="shrink-0">
                  <CardTitle className="text-base">Conversation</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[65vh] min-h-0 flex-1 space-y-3 overflow-y-auto lg:max-h-none">
                  {calls.map((c) => {
                    const lines = parseTranscript(c.transcript);
                    return (
                      <div key={c.id} className="space-y-3">
                        <div className="flex items-center gap-3 pt-1">
                          <Separator className="flex-1" />
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy · h:mm a") : "Call"}
                          </span>
                          <Separator className="flex-1" />
                        </div>
                        {lines.length === 0 && <p className="text-center text-sm text-muted-foreground">No transcript for this call.</p>}
                        {lines.map((l, i) => (
                          <div key={i} className={l.role === "human" ? "flex justify-end" : "flex justify-start"}>
                            <div
                              className={
                                "max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                                (l.role === "human" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")
                              }
                            >
                              {l.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
