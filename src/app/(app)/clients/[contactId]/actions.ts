"use server";

import { revalidatePath } from "next/cache";
import { upsertLead, type LeadStatus } from "@/lib/leads";

export async function saveLead(contactId: string, patch: { status?: LeadStatus; notes?: string }) {
  await upsertLead(contactId, patch);
  revalidatePath(`/clients/${contactId}`);
}
