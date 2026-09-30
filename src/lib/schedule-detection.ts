// Ordered by specificity — recurrence patterns first, then absolute, then relative
const SCHEDULE_PATTERNS: RegExp[] = [
  // Recurrence
  /\b(every|each)\s+(day|week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d+\s*(days?|weeks?|months?))\b/i,
  /\b(daily|weekly|monthly|yearly|annually|recurring|repeat(ing)?)\b/i,

  // Relative future
  /\b(tomorrow|next\s+(week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
  /\bin\s+\d+\s*(minute|hour|day|week|month|year)s?\b/i,
  /\b(end\s+of\s+(day|week|month|year)|eod|eom|eow)\b/i,
  /\blater\s+today\b/i,

  // Absolute time/date
  /\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)\b/i,
  /\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\bon\s+(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(tember)?|oct(ober)?|nov(ember)?|dec(ember)?)\s+\d{1,2}\b/i,
  /\bon\s+the\s+\d{1,2}(st|nd|rd|th)?\b/i,
  /\b\d{4}-\d{2}-\d{2}\b/,                   // ISO date
  /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/,        // MM/DD or MM/DD/YYYY
  /\b(this|next)\s+(friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/i,
  /\bschedule(d)?\b/i,
];

export type ScheduleDetectionResult = {
  isSchedule: boolean;
  matchedPattern: string | null;
};

export function detectScheduleIntent(prompt: string): ScheduleDetectionResult {
  const trimmed = prompt.trim();
  if (!trimmed) return { isSchedule: false, matchedPattern: null };

  for (const pattern of SCHEDULE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return { isSchedule: true, matchedPattern: match[0] };
    }
  }

  return { isSchedule: false, matchedPattern: null };
}
