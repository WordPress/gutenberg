/**
 * Internal dependencies
 */
import type { DayNumber, DayString } from '../types/field-api';

export const DAYS_OF_WEEK: DayString[] = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
];
const DEFAULT_DAY_STRING = 'sunday';
const DEFAULT_DAY_NUMBER = 0;

/**
 * Converts a weekStartsOn string to a number (0-6).
 *
 * @param day - The day name ('sunday', 'monday', etc.)
 * @return The corresponding number (0 for Sunday, 1 for Monday, etc.)
 */
export function weekStartsOnToNumber( day: DayString ): DayNumber {
	const index = DAYS_OF_WEEK.indexOf( day );
	if ( index === -1 ) {
		return DEFAULT_DAY_NUMBER;
	}

	return index as DayNumber;
}

/**
 * Converts a weekStartsOn number (0-6) to a string.
 *
 * @param day - The day number (0 for Sunday, 1 for Monday, etc.)
 * @return The corresponding day name ('sunday', 'monday', etc.)
 */
export function numberToWeekStartsOn( day: DayNumber ): DayString {
	const result = DAYS_OF_WEEK[ day ];
	if ( result === undefined ) {
		return DEFAULT_DAY_STRING;
	}

	return result;
}
