import { TZDate } from '@date-fns/tz';

/**
 * Expresses a date in the calendar's time zone, so that computing or
 * comparing calendar months matches the month grid that the calendar
 * displays.
 *
 * @param date     The date to express in the calendar's time zone.
 * @param timeZone The calendar's IANA time zone or UTC offset. When empty, the
 *                 date is returned unchanged, matching the calendar's own
 *                 fallback to the browser time zone.
 * @return The date to use for calendar month computations.
 */
export default function toCalendarDate( date: Date, timeZone?: string ): Date {
	return timeZone ? new TZDate( date, timeZone ) : date;
}
