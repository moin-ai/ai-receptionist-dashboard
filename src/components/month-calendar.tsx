"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/lib/leads";

export type CalItem = {
  id: string;
  title: string;
  startTime: string;
  contactId?: string;
  status?: LeadStatus;
};

const dotColor: Record<LeadStatus | "default", string> = {
  won: "bg-green-500",
  pending: "bg-amber-500",
  lost: "bg-slate-400",
  default: "bg-primary",
};

export function MonthCalendar({ month, items }: { month: string; items: CalItem[] }) {
  const monthDate = new Date(month + "-01T00:00:00");
  const [selected, setSelected] = useState<Date | null>(null);

  const gridStart = startOfWeek(startOfMonth(monthDate));
  const gridEnd = endOfWeek(endOfMonth(monthDate));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const byDay = new Map<string, CalItem[]>();
  for (const it of items) {
    const key = format(new Date(it.startTime), "yyyy-MM-dd");
    (byDay.get(key) ?? byDay.set(key, []).get(key)!).push(it);
  }

  const prev = format(addMonths(monthDate, -1), "yyyy-MM");
  const next = format(addMonths(monthDate, 1), "yyyy-MM");
  const selectedItems = selected ? byDay.get(format(selected, "yyyy-MM-dd")) ?? [] : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="glass rounded-2xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{format(monthDate, "MMMM yyyy")}</h2>
          <div className="flex gap-1">
            <Link href={`?month=${prev}`} className="rounded-md border p-1.5 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></Link>
            <Link href={`?month=${next}`} className="rounded-md border p-1.5 hover:bg-accent"><ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayItems = byDay.get(key) ?? [];
            const isSel = selected && isSameDay(day, selected);
            return (
              <button
                key={key}
                onClick={() => setSelected(day)}
                className={cn(
                  "flex min-h-16 flex-col rounded-lg border p-1.5 text-left transition-colors hover:bg-accent",
                  !isSameMonth(day, monthDate) && "opacity-40",
                  isSel && "ring-2 ring-primary",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    isToday(day) && "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayItems.length > 0 && (
                  <span className="mt-auto flex flex-wrap gap-0.5">
                    {dayItems.slice(0, 4).map((it) => (
                      <span key={it.id} className={cn("h-1.5 w-1.5 rounded-full", dotColor[it.status ?? "default"])} />
                    ))}
                    {dayItems.length > 4 && <span className="text-[10px] text-muted-foreground">+{dayItems.length - 4}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <h3 className="mb-3 font-semibold">
          {selected ? format(selected, "EEEE, MMM d") : "Select a day"}
        </h3>
        {selected && selectedItems.length === 0 && <p className="text-sm text-muted-foreground">No appointments.</p>}
        {!selected && <p className="text-sm text-muted-foreground">Click a day to see its appointments.</p>}
        <div className="space-y-2">
          {selectedItems.map((it) => (
            <Link
              key={it.id}
              href={it.contactId ? `/clients/${it.contactId}` : "#"}
              className="block rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{it.title}</span>
                <span className="text-muted-foreground">{format(new Date(it.startTime), "h:mm a")}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
