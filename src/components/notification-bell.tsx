"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bell, CalendarPlus, CalendarX, PhoneIncoming, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  type: "appointment" | "cancelled" | "call" | "client";
  title: string;
  subtitle?: string;
  time: string;
  href: string;
};

const meta = {
  appointment: { icon: CalendarPlus, color: "text-green-600 bg-green-100 dark:bg-green-950" },
  cancelled: { icon: CalendarX, color: "text-red-600 bg-red-100 dark:bg-red-950" },
  call: { icon: PhoneIncoming, color: "text-primary bg-primary/15" },
  client: { icon: UserPlus, color: "text-blue-600 bg-blue-100 dark:bg-blue-950" },
} as const;

const LAST_READ = "notif_last_read";

export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [lastRead, setLastRead] = useState<number>(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      /* ignore transient */
    }
  }, []);

  useEffect(() => {
    setLastRead(Number(localStorage.getItem(LAST_READ) ?? 0));
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const unread = items.filter((i) => new Date(i.time).getTime() > lastRead).length;

  function onOpenChange(o: boolean) {
    setOpen(o);
    if (!o && items.length) {
      const newest = Math.max(...items.map((i) => new Date(i.time).getTime()));
      localStorage.setItem(LAST_READ, String(newest));
      setLastRead(newest);
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label="Notifications" className="relative" />}>
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="glass w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <span className="font-semibold">Notifications</span>
          {unread > 0 && <span className="text-xs text-muted-foreground">{unread} new</span>}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>}
          {items.map((i) => {
            const M = meta[i.type];
            const isUnread = new Date(i.time).getTime() > lastRead;
            return (
              <Link
                key={i.id}
                href={i.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex gap-3 border-b border-border/40 px-4 py-3 transition-colors last:border-0 hover:bg-foreground/5",
                  isUnread && "bg-primary/5",
                )}
              >
                <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", M.color)}>
                  <M.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{i.title}</span>
                  {i.subtitle && <span className="block truncate text-xs text-muted-foreground">{i.subtitle}</span>}
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(i.time), { addSuffix: true })}
                  </span>
                </span>
                {isUnread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
