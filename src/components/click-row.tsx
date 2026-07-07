"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TableRow } from "@/components/ui/table";

// Whole-row link for tables (keeps <tr> semantics; server components can't attach onClick).
export function ClickRow({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <TableRow className={cn("group cursor-pointer", className)} onClick={() => router.push(href)}>
      {children}
    </TableRow>
  );
}
