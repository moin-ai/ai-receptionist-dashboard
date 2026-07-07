import { ChevronRight, Mail, Phone, Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickRow } from "@/components/click-row";
import { listContacts, contactName, type Contact } from "@/lib/ghl";
import { getStatuses, type LeadStatus } from "@/lib/leads";
import { StatusBadge } from "@/components/status-badge";
import { initials, formatPhone } from "@/lib/utils";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  let contacts: Contact[] = [];
  let error: string | null = null;
  try {
    const res = await listContacts({ query: q, limit: 100 });
    contacts = res.contacts;
  } catch (e) {
    error = (e as Error).message;
  }
  const statuses = await getStatuses(contacts.map((c) => c.id)).catch(() => ({}) as Record<string, LeadStatus>);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-muted-foreground">Everyone your AI receptionist has talked to.</p>
        </div>
        <form className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search by name, email or phone…" className="bg-card pl-9 shadow-sm" />
          </div>
          <Button type="submit">
            <Search className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </form>
      </header>

      {error && <p className="text-sm text-destructive">Couldn&apos;t load clients: {error}</p>}

      <Card className="overflow-hidden py-0">
        <Table className="[&_td]:px-4 [&_td]:py-3 [&_th]:px-4">
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</TableHead>
              <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Email</TableHead>
              <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">Added</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8 opacity-50" />
                    <p>{q ? `No clients match “${q}”.` : "No clients found."}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {contacts.map((c) => {
              const name = contactName(c);
              return (
                <ClickRow key={c.id} href={`/clients/${c.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {initials(name)}
                      </span>
                      <span className="font-medium">{name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.phone ? (
                      <span className="inline-flex items-center gap-2 tabular-nums text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 opacity-60" /> {formatPhone(c.phone)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden max-w-56 md:table-cell">
                    {c.email ? (
                      <span className="inline-flex max-w-full items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0 opacity-60" /> <span className="truncate">{c.email}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {c.dateAdded ? format(new Date(c.dateAdded), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell>{statuses[c.id] && <StatusBadge status={statuses[c.id]} />}</TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </TableCell>
                </ClickRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
