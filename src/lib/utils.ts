import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";
}

// ponytail: NANP-only pretty-print; other regions render as stored (E.164 is already readable)
export function formatPhone(p?: string) {
  if (!p) return "";
  const m = p.replace(/[^\d+]/g, "").match(/^(?:\+?1)?(\d{3})(\d{3})(\d{4})$/);
  return m ? `+1 (${m[1]}) ${m[2]}-${m[3]}` : p;
}
