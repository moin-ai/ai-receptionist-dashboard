import { fetchRecording } from "@/lib/ghl";

// Streams a call recording so the GHL token stays server-side.
// Auth is enforced by proxy.ts (everything outside /api/webhooks needs a session).
export async function GET(_req: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await params;
  const res = await fetchRecording(messageId);
  if (!res.ok) return new Response("Recording not available", { status: res.status });
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "audio/wav",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
