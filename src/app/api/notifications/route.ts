import { getNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// Authed via proxy.ts. Returns the derived activity feed.
export async function GET() {
  try {
    return Response.json({ items: await getNotifications() });
  } catch (e) {
    return Response.json({ items: [], error: (e as Error).message }, { status: 200 });
  }
}
