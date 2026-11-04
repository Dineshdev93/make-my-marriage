export function isDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export function formatDisplayDate(dateString: string): string {
  if (!isDateString(dateString)) throw new Error("Date must be a real calendar date in YYYY-MM-DD format.");
  const [year, month, day] = dateString.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

function assertDateString(value: string): void {
  if (!isDateString(value)) throw new Error("Date must be a real calendar date in YYYY-MM-DD format.");
}

export function getTodayIST(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function daysUntil(dateString: string, now: Date = new Date()): number {
  assertDateString(dateString);
  const today = getTodayIST(now);
  const dateMs = Date.parse(`${dateString}T00:00:00Z`);
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  return Math.round((dateMs - todayMs) / 86_400_000);
}

export function isOverdue(dueDate: string, completed: boolean, now: Date = new Date()): boolean {
  assertDateString(dueDate);
  return !completed && dueDate < getTodayIST(now);
}
