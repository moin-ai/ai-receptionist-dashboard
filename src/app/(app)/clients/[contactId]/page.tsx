import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadEditor } from "@/components/lead-editor";
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
import { format } from "date-fns";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";
}

export default async function ClientDetailPage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;

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
  const calls = callsRes.callLogs;
  const appts = apptsRes.events;
  const name = contactName(contact);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left: client info + status/notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
                {initials(name)}
              </div>
              <div>
                <CardTitle className="text-lg">{name}</CardTitle>
                {isBooked(calls[0] ?? {} as CallLog) && (
                  <Badge className="mt-1 bg-primary/15 text-primary hover:bg-primary/15">Appointment booked</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {contact.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{contact.phone}</p>}
              {contact.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{contact.email}</p>}
              {(contact.address1 || contact.city) && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {[contact.address1, contact.city, contact.state].filter(Boolean).join(", ")}
                </p>
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

          {appts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appointments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {appts.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>{a.title || "Appointment"}</span>
                    <span className="ml-auto text-muted-foreground">{format(new Date(a.startTime), "MMM d, h:mm a")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: conversation(s) */}
        <div className="space-y-6">
          {calls.length === 0 && (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No calls recorded for this client.</CardContent></Card>
          )}
          {calls.map((c) => {
            const lines = parseTranscript(c.transcript);
            return (
              <Card key={c.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Conversation summary</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy · h:mm a") : ""}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{c.summary ?? "No summary available."}</p>

                  {lines.length > 0 && (
                    <details className="rounded-lg border">
                      <summary className="cursor-pointer px-4 py-2 text-sm font-medium">Full transcript</summary>
                      <div className="space-y-3 px-4 py-3">
                        {lines.map((l, i) => (
                          <div key={i} className={l.role === "human" ? "flex justify-end" : "flex justify-start"}>
                            <div
                              className={
                                "max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                                (l.role === "human"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground")
                              }
                            >
                              {l.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
