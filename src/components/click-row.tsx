"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";

// Whole-row link for tables (keeps <tr> semantics; server components can't attach onClick).
export function ClickRow({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <TableRow className="cursor-pointer" onClick={() => router.push(href)}>
      {children}
    </TableRow>
  );
}
