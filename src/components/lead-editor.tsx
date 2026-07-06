"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveLead } from "@/app/(app)/clients/[contactId]/actions";
import type { LeadStatus } from "@/lib/leads";

const options: { value: LeadStatus; label: string; active: string }[] = [
  { value: "won", label: "Won", active: "bg-green-600 text-white border-green-600" },
  { value: "pending", label: "Pending", active: "bg-amber-500 text-white border-amber-500" },
  { value: "lost", label: "Lost", active: "bg-slate-500 text-white border-slate-500" },
];

export function LeadEditor({
  contactId,
  status,
  notes,
}: {
  contactId: string;
  status: LeadStatus;
  notes: string;
}) {
  const [current, setCurrent] = useState<LeadStatus>(status);
  const [note, setNote] = useState(notes);
  const [pending, start] = useTransition();

  function pick(value: LeadStatus) {
    const prev = current;
    setCurrent(value);
    start(async () => {
      try {
        await saveLead(contactId, { status: value });
        toast.success(`Marked ${value}`);
      } catch (e) {
        setCurrent(prev);
        toast.error((e as Error).message);
      }
    });
  }

  function saveNotes() {
    start(async () => {
      try {
        await saveLead(contactId, { notes: note });
        toast.success("Notes saved");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Status</p>
        <div className="grid grid-cols-3 gap-2">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              disabled={pending}
              onClick={() => pick(o.value)}
              className={cn(
                "rounded-lg border py-2 text-sm font-medium transition-colors disabled:opacity-60",
                current === o.value ? o.active : "border-input bg-background hover:bg-accent",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Notes</p>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notes for yourself before or after the meeting…"
          rows={5}
        />
        <Button onClick={saveNotes} disabled={pending || note === notes} size="sm" className="mt-2">
          Save note
        </Button>
      </div>
    </div>
  );
}
