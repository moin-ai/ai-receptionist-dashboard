import { Resend } from "resend";

// Public endpoint for a GHL workflow "Custom Webhook" that fires when the AI books
// an appointment. Workflow webhooks aren't signed, so we gate on a shared secret
// (?secret= or x-webhook-secret header) the owner sets when configuring the workflow.
// ponytail: shared-secret is the right guard for an unsigned workflow webhook; upgrade
// to RSA signature verification only if we move to a signed marketplace-app webhook.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const provided = request.headers.get("x-webhook-secret") ?? url.searchParams.get("secret");
  if (!process.env.WEBHOOK_SECRET || provided !== process.env.WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json();
  } catch {
    // some GHL webhooks send form-encoded; ignore body we can't parse
  }

  const name =
    (payload.full_name as string) ||
    [payload.first_name, payload.last_name].filter(Boolean).join(" ") ||
    (payload.contact_name as string) ||
    "A new client";
  const when = (payload.appointment_start_time as string) || (payload.start_time as string) || "";

  const to = process.env.NOTIFY_EMAIL_TO;
  const from = process.env.NOTIFY_EMAIL_FROM || "AI Receptionist <onboarding@resend.dev>";
  if (process.env.RESEND_API_KEY && to) {
    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from,
        to,
        subject: `New appointment booked${name ? ` — ${name}` : ""}`,
        html: `<p><strong>${name}</strong> just booked an appointment${when ? ` for <strong>${when}</strong>` : ""}.</p>
               <p>Open your dashboard to see the conversation and details.</p>`,
      });
    } catch (e) {
      // don't fail the webhook if email hiccups — GHL would retry unnecessarily
      console.error("notify email failed:", (e as Error).message);
    }
  }

  return Response.json({ ok: true });
}
