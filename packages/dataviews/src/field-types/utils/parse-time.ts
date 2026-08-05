/**
 * External dependencies
 */
import { isValid, parse } from 'date-fns';

// Times are wall-clock, so a trailing zone designator is tolerated for
// compatibility with RFC 3339 `full-time` but deliberately does not shift the
// value. A malformed offset is not a zone designator, so the whole value fails
// to parse rather than being silently accepted.
const ZONE_DESIGNATOR = /(?:[Zz]|[+-](?:[01]\d|2[0-3]):?[0-5]\d)$/;

const TIME_FORMATS = [ 'HH:mm', 'HH:mm:ss' ];

// Any day works as long as it is fixed and clear of DST transitions: the parsed
// components are read straight back out, so this date never reaches a consumer.
const REFERENCE_DATE = new Date( 2000, 0, 1 );

/**
 * Parses a time-of-day value into the number of seconds since midnight.
 *
 * @param value The value to parse.
 *
 * @return Seconds since midnight, or `null` if the value is not a valid time.
 */
export default function parseTime( value?: unknown ): number | null {
	if ( typeof value !== 'string' ) {
		return null;
	}

	const time = value.trim().replace( ZONE_DESIGNATOR, '' );

	for ( const timeFormat of TIME_FORMATS ) {
		const parsed = parse( time, timeFormat, REFERENCE_DATE );
		if ( isValid( parsed ) ) {
			return (
				parsed.getHours() * 3600 +
				parsed.getMinutes() * 60 +
				parsed.getSeconds()
			);
		}
	}

	return null;
}
