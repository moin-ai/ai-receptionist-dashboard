import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LOCATION_ID } from "@/lib/ghl";

export type LeadStatus = "won" | "pending" | "lost";
export type LeadRow = { ghl_contact_id: string; status: LeadStatus; notes: string; updated_at: string };

// Status + notes for one contact (defaults to "pending" if the owner hasn't set it).
export async function getLead(contactId: string): Promise<LeadRow> {
  const fallback: LeadRow = { ghl_contact_id: contactId, status: "pending", notes: "", updated_at: "" };
  try {
    const { data } = await supabaseAdmin()
      .from("lead_status")
      .select("ghl_contact_id,status,notes,updated_at")
      .eq("location_id", LOCATION_ID)
      .eq("ghl_contact_id", contactId)
      .maybeSingle();
    return data ?? fallback;
  } catch {
    return fallback; // table not created yet
  }
}

// Bulk fetch statuses for a list of contacts → map, for tinting lists/badges.
export async function getStatuses(contactIds: string[]): Promise<Record<string, LeadStatus>> {
  if (contactIds.length === 0) return {};
  const { data } = await supabaseAdmin()
    .from("lead_status")
    .select("ghl_contact_id,status")
    .eq("location_id", LOCATION_ID)
    .in("ghl_contact_id", contactIds);
  const map: Record<string, LeadStatus> = {};
  for (const r of data ?? []) map[r.ghl_contact_id] = r.status as LeadStatus;
  return map;
}

export async function upsertLead(contactId: string, patch: { status?: LeadStatus; notes?: string }) {
  const row = { location_id: LOCATION_ID, ghl_contact_id: contactId, ...patch, updated_at: new Date().toISOString() };
  const { error } = await supabaseAdmin().from("lead_status").upsert(row, { onConflict: "location_id,ghl_contact_id" });
  if (error) throw new Error(error.message);
}
