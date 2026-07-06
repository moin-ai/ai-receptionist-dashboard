import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client for server-side overlay reads/writes. Bypasses RLS —
// only ever imported into server code that already ran behind the auth middleware.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
