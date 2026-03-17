import holiday_jp from "@holiday-jp/holiday_jp";

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function diffDays(newDateStr: string, oldDateStr: string): number {
  const n = parseDate(newDateStr).getTime();
  const o = parseDate(oldDateStr).getTime();
  return Math.round((n - o) / (1000 * 60 * 60 * 24));
}

function isHoliday(date: Date): boolean {
  return holiday_jp.isHoliday(date);
}

function isBusinessDay(date: Date): boolean {
  const dow = date.getDay();
  return dow !== 0 && dow !== 6 && !isHoliday(date);
}

export function nextBusinessDay(dateStr: string): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + 1);
  while (!isBusinessDay(d)) {
    d.setDate(d.getDate() + 1);
  }
  return formatDate(d);
}
