export const MAX_AMOUNT_RUPEES = 1_000_000_000;
export const MAX_AMOUNT_PAISE = MAX_AMOUNT_RUPEES * 100;
const INDIAN_GROUPED_INTEGER = /^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{2})*,\d{3})$/;

export function parseRupeesToPaise(input: string): number {
  const value = input.trim();
  if (!INDIAN_GROUPED_INTEGER.test(value)) throw new Error("Enter a valid whole-rupee amount.");
  const rupees = Number(value.replaceAll(",", ""));
  if (!Number.isSafeInteger(rupees) || rupees <= 0 || rupees > MAX_AMOUNT_RUPEES) {
    throw new Error("Amount must be greater than zero and no more than ₹100 crore.");
  }
  return rupees * 100;
}

function groupIndian(value: string): string {
  if (value.length <= 3) return value;
  const lastThree = value.slice(-3);
  const preceding = value.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${preceding},${lastThree}`;
}

export function formatPaise(paise: number): string {
  if (!Number.isSafeInteger(paise) || paise < 0) throw new Error("Paise must be a non-negative safe integer.");
  const rupees = Math.floor(paise / 100);
  const remainder = paise % 100;
  return `₹${groupIndian(String(rupees))}${remainder === 0 ? "" : `.${String(remainder).padStart(2, "0")}`}`;
}
