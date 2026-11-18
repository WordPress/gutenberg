import { getSettings } from '@wordpress/date';

/**
 * Whether the site's time format is 12-hour: it has an `a` or `A` that is not
 * escaped with a backslash.
 *
 * @return Whether the site uses a 12-hour clock.
 */
export function is12HourTime(): boolean {
	return /a(?!\\)/i.test(
		getSettings()
			.formats.time.toLowerCase()
			.replace( /\\\\/g, '' )
			.split( '' )
			.reverse()
			.join( '' )
	);
}
