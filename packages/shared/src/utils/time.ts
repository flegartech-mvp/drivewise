export function isNightTime(date: Date): boolean {
  const hour = date.getHours();
  return hour < 6 || hour >= 22;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function durationSeconds(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}
