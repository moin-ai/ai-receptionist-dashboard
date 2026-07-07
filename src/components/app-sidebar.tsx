"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, LayoutDashboard, LogOut, Menu, PhoneCall, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notification-bell";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/calls", label: "Calls", icon: PhoneCall },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
        <Image src="/logo.png" alt="Logo" width={36} height={36} className="h-full w-full object-contain" />
      </div>
      <span className="font-semibold tracking-tight">{process.env.NEXT_PUBLIC_APP_NAME ?? "AI Receptionist"}</span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({ email }: { email?: string }) {
  const router = useRouter();
  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return (
    <div className="mt-auto space-y-2 border-t border-border/60 pt-3">
      {email && <p className="truncate px-2 text-xs text-muted-foreground">{email}</p>}
      <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground hover:text-foreground">
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

// Desktop rail
export function AppSidebar({ userEmail }: { userEmail?: string }) {
  return (
    <aside className="glass sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 rounded-none border-y-0 border-l-0 px-3 py-5 md:flex">
      <Brand />
      <NavLinks />
      <UserFooter email={userEmail} />
    </aside>
  );
}

// Mobile top bar + drawer
export function MobileNav({ userEmail }: { userEmail?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass sticky top-0 z-30 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 md:hidden">
      <Brand />
      <div className="flex items-center gap-1">
        <NotificationBell />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="glass flex w-72 flex-col gap-6 border-0 px-3 py-5">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Brand onNavigate={() => setOpen(false)} />
            <NavLinks onNavigate={() => setOpen(false)} />
            <UserFooter email={userEmail} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
