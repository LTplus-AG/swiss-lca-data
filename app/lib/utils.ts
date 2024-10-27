/**
 * Utility function to conditionally join class names.
 * @param classes - A list of class names to join.
 * @returns A string of joined class names.
 */
export function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * A simple utility function to format a date.
 * @param date - The date to format.
 * @param options - Options for date formatting.
 * @returns A formatted date string.
 */
export function formatDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

/**
 * A utility function to generate a unique ID.
 * @returns A unique string ID.
 */
export function generateId(): string {
  return "id-" + Math.random().toString(36).substr(2, 16);
}
