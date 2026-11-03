import { daysUntil, isDateString } from "./dates";

export function formatRupeesWhileTyping(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (digits.length <= 3) return digits;
  const lastThree = digits.slice(-3);
  const preceding = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${preceding},${lastThree}`;
}

export function formatWeddingDatePreview(value: string): string {
  if (!isDateString(value)) return "";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function getWeddingCountdownText(value: string, now: Date = new Date()): string {
  if (!isDateString(value)) return "";
  const days = daysUntil(value, now);
  if (days > 0) return `${days} days to go`;
  if (days === 0) return "Today";
  return `${Math.abs(days)} days ago`;
}
