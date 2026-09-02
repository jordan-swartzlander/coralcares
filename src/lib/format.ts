// Slot dates/times are stored as UTC "wall-clock" values (the date/time as
// entered, not a real instant), so formatting must force UTC — otherwise the
// server's local timezone shifts the displayed date/time.

export function formatSlotDate(d: Date): string {
  return d.toLocaleDateString([], { timeZone: "UTC" });
}

export function formatSlotTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

export function gradeLabel(grade: string | null): string {
  if (!grade) return "";
  return grade === "K" ? "Kindergarten" : `Grade ${grade}`;
}
