declare module 'date-fns-tz' {
  export function zonedTimeToUtc(date: Date | number, timeZone: string): Date;
  export function utcToZonedTime(date: Date | number, timeZone: string): Date;
  // Add other functions as needed
}