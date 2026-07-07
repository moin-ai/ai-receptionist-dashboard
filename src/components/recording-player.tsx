"use client";

import { cn } from "@/lib/utils";

// Compact call-recording player. stopPropagation so it works inside clickable table rows.
export function RecordingPlayer({ messageId, className }: { messageId: string; className?: string }) {
  return (
    <audio
      controls
      preload="none"
      src={`/api/recordings/${messageId}`}
      className={cn("h-9 w-full max-w-72", className)}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
