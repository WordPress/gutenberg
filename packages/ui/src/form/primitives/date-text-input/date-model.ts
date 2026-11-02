/**
 * Return the number of days in a Gregorian month without local-time conversion.
 * @param year
 * @param month
 */
export function daysInMonth( year: number, month: number ) {
	if ( month === 2 ) {
		return year % 4 === 0 && ( year % 100 !== 0 || year % 400 === 0 )
			? 29
			: 28;
	}
	return [ 4, 6, 9, 11 ].includes( month ) ? 30 : 31;
}

/**
 * Parse a complete Gregorian ISO date. Partial and impossible dates return null.
 * @param text
 */
export function parseISODate( text: string ): string | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec( text );
	if ( ! match ) {
		return null;
	}
	const [ year, month, day ] = match.slice( 1 ).map( Number );
	return year > 0 &&
		month >= 1 &&
		month <= 12 &&
		day >= 1 &&
		day <= daysInMonth( year, month )
		? text
		: null;
}
