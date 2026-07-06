import { AppSidebar, MobileNav } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { Toaster } from "@/components/ui/sonner";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <AppSidebar userEmail={user?.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav userEmail={user?.email} />
        <header className="sticky top-0 z-20 hidden items-center justify-end px-8 py-3 md:flex">
          <NotificationBell />
        </header>
        <main className="flex-1 px-4 pb-8 pt-2 sm:px-6 md:px-8">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
