export const DAILY_RESET_TIME_ZONE = 'UTC';
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getDailyDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getPreviousDailyDate(now = new Date()): string {
  return getDailyDate(new Date(now.getTime() - MS_PER_DAY));
}

export function addDailyDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function getDailyIndexFrom(startIso: string, now = new Date()): number {
  const start = new Date(startIso).getTime();
  return Math.max(0, Math.floor((now.getTime() - start) / MS_PER_DAY));
}
