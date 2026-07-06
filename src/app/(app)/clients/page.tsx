import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickRow } from "@/components/click-row";
import { listContacts, contactName, type Contact } from "@/lib/ghl";
import { getStatuses, type LeadStatus } from "@/lib/leads";
import { StatusBadge } from "@/components/status-badge";
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
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-muted-foreground">Everyone your AI receptionist has talked to.</p>
        </div>
        <form className="w-full sm:w-64">
          <Input name="q" defaultValue={q} placeholder="Search clients…" />
        </form>
      </header>

      {error && <p className="text-sm text-destructive">Couldn&apos;t load clients: {error}</p>}

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Added</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No clients found.
                </TableCell>
              </TableRow>
            )}
            {contacts.map((c) => (
              <ClickRow key={c.id} href={`/clients/${c.id}`}>
                <TableCell className="font-medium">{contactName(c)}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{c.email ?? "—"}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {c.dateAdded ? format(new Date(c.dateAdded), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell>{statuses[c.id] && <StatusBadge status={statuses[c.id]} />}</TableCell>
              </ClickRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
