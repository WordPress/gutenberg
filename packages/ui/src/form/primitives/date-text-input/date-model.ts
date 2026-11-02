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

/**
 * Convert an ISO date to the UTC date used by Calendar.
 * @param value
 */
export function toCalendarDate( value: string ): Date {
	if ( ! parseISODate( value ) ) {
		throw new RangeError( 'DateInput: expected a valid YYYY-MM-DD date.' );
	}
	const [ year, month, day ] = value.split( '-' ).map( Number );
	const date = new Date( 0 );
	date.setUTCFullYear( year, month - 1, day );
	return date;
}

/**
 * Convert Calendar's UTC date without involving the host time zone.
 * @param date
 */
export function fromCalendarDate( date: Date ): string {
	return `${ String( date.getUTCFullYear() ).padStart( 4, '0' ) }-${ String( date.getUTCMonth() + 1 ).padStart( 2, '0' ) }-${ String( date.getUTCDate() ).padStart( 2, '0' ) }`;
}
