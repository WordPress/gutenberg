/**
 * Converts a weekStartsOn string to a number (0-6).
 *
 * @param day - The day name ('sunday', 'monday', etc.)
 * @return The corresponding number (0 for Sunday, 1 for Monday, etc.)
 */
export function weekStartsOnToNumber(
	day:
		| 'sunday'
		| 'monday'
		| 'tuesday'
		| 'wednesday'
		| 'thursday'
		| 'friday'
		| 'saturday'
): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
	const mapping = {
		sunday: 0,
		monday: 1,
		tuesday: 2,
		wednesday: 3,
		thursday: 4,
		friday: 5,
		saturday: 6,
	} as const;

	return mapping[ day ];
}

/**
 * Converts a weekStartsOn number (0-6) to a string.
 *
 * @param day - The day number (0 for Sunday, 1 for Monday, etc.)
 * @return The corresponding day name ('sunday', 'monday', etc.)
 */
export function numberToWeekStartsOn(
	day: 0 | 1 | 2 | 3 | 4 | 5 | 6
):
	| 'sunday'
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday' {
	const mapping = {
		0: 'sunday',
		1: 'monday',
		2: 'tuesday',
		3: 'wednesday',
		4: 'thursday',
		5: 'friday',
		6: 'saturday',
	} as const;

	return mapping[ day ];
}
