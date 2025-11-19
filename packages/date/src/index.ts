/**
 * External dependencies
 */
import type { Moment } from 'moment';
import momentLib from 'moment';
import 'moment-timezone/moment-timezone';
import 'moment-timezone/moment-timezone-utils';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
/**
 * Internal dependencies
 */
import type { DateSettings } from './types';

export * from './types';

const WP_ZONE = 'WP';

// This regular expression tests positive for UTC offsets as described in ISO 8601.
// See: https://en.wikipedia.org/wiki/ISO_8601#Time_offsets_from_UTC
const VALID_UTC_OFFSET = /^[+-][0-1][0-9](:?[0-9][0-9])?$/;

// Changes made here will likely need to be synced with Core in the file
// src/wp-includes/script-loader.php in `wp_default_packages_inline_scripts()`.
let settings: DateSettings = {
	l10n: {
		locale: 'en',
		months: [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		],
		monthsShort: [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		],
		weekdays: [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		],
		weekdaysShort: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
		meridiem: { am: 'am', pm: 'pm', AM: 'AM', PM: 'PM' },
		relative: {
			future: '%s from now',
			past: '%s ago',
			s: 'a few seconds',
			ss: '%d seconds',
			m: 'a minute',
			mm: '%d minutes',
			h: 'an hour',
			hh: '%d hours',
			d: 'a day',
			dd: '%d days',
			M: 'a month',
			MM: '%d months',
			y: 'a year',
			yy: '%d years',
		},
		startOfWeek: 0,
	},
	formats: {
		time: 'g: i a',
		date: 'F j, Y',
		datetime: 'F j, Y g: i a',
		datetimeAbbreviated: 'M j, Y g: i a',
	},
	timezone: { offset: 0, offsetFormatted: '0', string: '', abbr: '' },
};

/**
 * Adds a locale to moment, using the format supplied by `wp_localize_script()`.
 *
 * @param dateSettings Settings, including locale data.
 */
export function setSettings( dateSettings: DateSettings ) {
	settings = dateSettings;

	setupWPTimezone();

	// Does moment already have a locale with the right name?
	if ( momentLib.locales().includes( dateSettings.l10n.locale ) ) {
		// Is that locale misconfigured, e.g. because we are on a site running
		// WordPress < 6.0?
		if (
			momentLib
				.localeData( dateSettings.l10n.locale )
				.longDateFormat( 'LTS' ) === null
		) {
			// Delete the misconfigured locale.
			// @ts-ignore Type definitions are incorrect - null is permitted.
			momentLib.defineLocale( dateSettings.l10n.locale, null );
		} else {
			// We have a properly configured locale, so no need to create one.
			return;
		}
	}

	// defineLocale() will modify the current locale, so back it up.
	const currentLocale = momentLib.locale();

	// Create locale.
	momentLib.defineLocale( dateSettings.l10n.locale, {
		// Inherit anything missing from English. We don't load
		// moment-with-locales.js so English is all there is.
		parentLocale: 'en',
		months: dateSettings.l10n.months,
		monthsShort: dateSettings.l10n.monthsShort,
		weekdays: dateSettings.l10n.weekdays,
		weekdaysShort: dateSettings.l10n.weekdaysShort,
		meridiem( hour, minute, isLowercase ) {
			if ( hour < 12 ) {
				return isLowercase
					? dateSettings.l10n.meridiem.am
					: dateSettings.l10n.meridiem.AM;
			}
			return isLowercase
				? dateSettings.l10n.meridiem.pm
				: dateSettings.l10n.meridiem.PM;
		},
		longDateFormat: {
			LT: dateSettings.formats.time,
			LTS: momentLib.localeData( 'en' ).longDateFormat( 'LTS' ),
			L: momentLib.localeData( 'en' ).longDateFormat( 'L' ),
			LL: dateSettings.formats.date,
			LLL: dateSettings.formats.datetime,
			LLLL: momentLib.localeData( 'en' ).longDateFormat( 'LLLL' ),
		},
		// From human_time_diff?
		// Set to `(number, withoutSuffix, key, isFuture) => {}` instead.
		relativeTime: dateSettings.l10n.relative,
	} );

	// Restore the locale to what it was.
	momentLib.locale( currentLocale );
}

/**
 * Returns the currently defined date settings.
 *
 * @return {DateSettings} Settings, including locale data.
 */
export function getSettings() {
	return settings;
}

/**
 * Returns the currently defined date settings.
 *
 * @deprecated
 * @return {DateSettings} Settings, including locale data.
 */
export function __experimentalGetSettings() {
	deprecated( 'wp.date.__experimentalGetSettings', {
		since: '6.1',
		alternative: 'wp.date.getSettings',
	} );
	return getSettings();
}

function setupWPTimezone() {
	// Get the current timezone settings from the WP timezone string.
	const currentTimezone = momentLib.tz.zone( settings.timezone.string );

	// Check to see if we have a valid TZ data, if so, use it for the custom WP_ZONE timezone, otherwise just use the offset.
	if ( currentTimezone ) {
		// Create WP timezone based off settings.timezone.string.  We need to include the additional data so that we
		// don't lose information about daylight savings time and other items.
		// See https://github.com/WordPress/gutenberg/pull/48083
		momentLib.tz.add(
			momentLib.tz.pack( {
				name: WP_ZONE,
				abbrs: currentTimezone.abbrs,
				untils: currentTimezone.untils,
				offsets: currentTimezone.offsets,
			} )
		);
	} else {
		// Create WP timezone based off dateSettings.
		momentLib.tz.add(
			momentLib.tz.pack( {
				name: WP_ZONE,
				abbrs: [ WP_ZONE ],
				untils: [ null ],
				offsets: [ -settings.timezone.offset * 60 || 0 ],
			} )
		);
	}
}

// Date constants.
/**
 * Number of seconds in one minute.
 */
const MINUTE_IN_SECONDS = 60;
/**
 * Number of minutes in one hour.
 */
const HOUR_IN_MINUTES = 60;
/**
 * Number of seconds in one hour.
 */
const HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS;

/**
 * Map of PHP formats to Moment.js formats.
 *
 * These are used internally by {@link format}, and are either
 * a string representing the corresponding Moment.js format code, or a
 * function which returns the formatted string.
 *
 * This should only be used through {@link format}, not
 * directly.
 */
const formatMap = {
	// Day.
	d: 'DD',
	D: 'ddd',
	j: 'D',
	l: 'dddd',
	N: 'E',

	/**
	 * Gets the ordinal suffix.
	 *
	 * @param momentDate Moment instance.
	 *
	 * @return Formatted date.
	 */
	S( momentDate: Moment ) {
		// Do - D.
		const num = momentDate.format( 'D' );
		const withOrdinal = momentDate.format( 'Do' );
		return withOrdinal.replace( num, '' );
	},

	w: 'd',
	/**
	 * Gets the day of the year (zero-indexed).
	 *
	 * @param momentDate Moment instance.
	 *
	 * @return Formatted date.
	 */
	z( momentDate: Moment ) {
		// DDD - 1.
		return ( parseInt( momentDate.format( 'DDD' ), 10 ) - 1 ).toString();
	},

	// Week.
	W: 'W',

	// Month.
	F: 'MMMM',
	m: 'MM',
	M: 'MMM',
	n: 'M',
	/**
	 * Gets the days in the month.
	 *
	 * @param momentDate Moment instance.
	 *
	 * @return Formatted date.
	 */
	t( momentDate: Moment ) {
		return momentDate.daysInMonth();
	},

	// Year.
	/**
	 * Gets whether the current year is a leap year.
	 *
	 * @param momentDate Moment instance.
	 *
	 * @return Formatted date.
	 */
	L( momentDate: Moment ) {
		return momentDate.isLeapYear() ? '1' : '0';
	},
	o: 'GGGG',
	Y: 'YYYY',
	y: 'YY',

	// Time.
	a: 'a',
	A: 'A',
	/**
	 * Gets the current time in Swatch Internet Time (.beats).
	 *
	 * @param momentDate Moment instance.
	 *
	 * @return Formatted date.
	 */
	B( momentDate: Moment ) {
		const timezoned = momentLib( momentDate ).utcOffset( 60 );
		const seconds = parseInt( timezoned.format( 's' ), 10 ),
			minutes = parseInt( timezoned.format( 'm' ), 10 ),
			hours = parseInt( timezoned.format( 'H' ), 10 );
		return parseInt(
			(
				( seconds +
					minutes * MINUTE_IN_SECONDS +
					hours * HOUR_IN_SECONDS ) /
				86.4
			).toString(),
			10
		);
	},
	g: 'h',
	G: 'H',
	h: 'hh',
	H: 'HH',
	i: 'mm',
	s: 'ss',
	u: 'SSSSSS',
	v: 'SSS',
	// Timezone.
	e: 'zz',
	/**
	 * Gets whether the timezone is in DST currently.
	 *
	 * @param momentDate Moment instance.
	 *
	 * @return Formatted date.
	 */
	I( momentDate: Moment ) {
		return momentDate.isDST() ? '1' : '0';
	},
	O: 'ZZ',
	P: 'Z',
	T: 'z',
	/**
	 * Gets the timezone offset in seconds.
	 *
	 * @param momentDate Moment instance.
	 *
	 * @return Formatted date.
	 */
	Z( momentDate: Moment ) {
		// Timezone offset in seconds.
		const offset = momentDate.format( 'Z' );
		const sign = offset[ 0 ] === '-' ? -1 : 1;
		const parts = offset
			.substring( 1 )
			.split( ':' )
			.map( ( n ) => parseInt( n, 10 ) );
		return (
			sign *
			( parts[ 0 ] * HOUR_IN_MINUTES + parts[ 1 ] ) *
			MINUTE_IN_SECONDS
		);
	},
	// Full date/time.
	c: 'YYYY-MM-DDTHH:mm:ssZ', // .toISOString.
	/**
	 * Formats the date as RFC2822.
	 *
	 * @param momentDate Moment instance.
	 *
	 * @return Formatted date.
	 */
	r( momentDate: Moment ) {
		return momentDate
			.locale( 'en' )
			.format( 'ddd, DD MMM YYYY HH:mm:ss ZZ' );
	},
	U: 'X',
};

/**
 * Formats a date. Does not alter the date's timezone.
 *
 * @param dateFormat PHP-style formatting string.
 *                   See [php.net/date](https://www.php.net/manual/en/function.date.php).
 * @param dateValue  Date object or string,
 *                   parsable by moment.js.
 *
 * @return Formatted date.
 */
export function format(
	dateFormat: string,
	dateValue: Moment | Date | string | number = new Date()
) {
	let i, char;
	const newFormat = [];
	const momentDate = momentLib( dateValue );
	for ( i = 0; i < dateFormat.length; i++ ) {
		char = dateFormat[ i ];
		// Is this an escape?
		if ( '\\' === char ) {
			// Add next character, then move on.
			i++;
			newFormat.push( '[' + dateFormat[ i ] + ']' );
			continue;
		}
		if ( char in formatMap ) {
			const formatter = formatMap[ char as keyof typeof formatMap ];
			if ( typeof formatter !== 'string' ) {
				// If the format is a function, call it.
				newFormat.push( '[' + formatter( momentDate ) + ']' );
			} else {
				// Otherwise, add as a formatting string.
				newFormat.push( formatter );
			}
		} else {
			newFormat.push( '[' + char + ']' );
		}
	}
	// Join with [] between to separate characters, and replace
	// unneeded separators with static text.
	return momentDate.format( newFormat.join( '[]' ) );
}

/**
 * Formats a date (like `date()` in PHP).
 *
 * @param  dateFormat PHP-style formatting string.
 *                    See [php.net/date](https://www.php.net/manual/en/function.date.php).
 * @param  dateValue  Date object or string, parsable
 *                    by moment.js.
 * @param  timezone   Timezone to output result in or a
 *                    UTC offset. Defaults to timezone from
 *                    site.
 *
 * @see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 * @see https://en.wikipedia.org/wiki/ISO_8601#Time_offsets_from_UTC
 *
 * @return {string} Formatted date in English.
 */
export function date(
	dateFormat: string,
	dateValue: Moment | Date | string | number = new Date(),
	timezone?: string
) {
	const dateMoment = buildMoment( dateValue, timezone );
	return format( dateFormat, dateMoment );
}

/**
 * Formats a date (like `date()` in PHP), in the UTC timezone.
 *
 * @param dateFormat PHP-style formatting string.
 *                   See [php.net/date](https://www.php.net/manual/en/function.date.php).
 * @param dateValue  Date object or string,
 *                   parsable by moment.js.
 *
 * @return Formatted date in English.
 */
export function gmdate(
	dateFormat: string,
	dateValue: Moment | Date | string | number = new Date()
) {
	const dateMoment = momentLib( dateValue ).utc();
	return format( dateFormat, dateMoment );
}

/**
 * Formats a date (like `wp_date()` in PHP), translating it into site's locale.
 *
 * Backward Compatibility Notice: if `timezone` is set to `true`, the function
 * behaves like `gmdateI18n`.
 *
 * @param dateFormat PHP-style formatting string.
 *                   See [php.net/date](https://www.php.net/manual/en/function.date.php).
 * @param dateValue  Date object or string, parsable by
 *                   moment.js.
 * @param timezone   Timezone to output result in or a
 *                   UTC offset. Defaults to timezone from
 *                   site. Notice: `boolean` is effectively
 *                   deprecated, but still supported for
 *                   backward compatibility reasons.
 *
 * @see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 * @see https://en.wikipedia.org/wiki/ISO_8601#Time_offsets_from_UTC
 *
 * @return  Formatted date.
 */
export function dateI18n(
	dateFormat: string,
	dateValue: Moment | Date | string | number = new Date(),
	timezone?: string | number | boolean
) {
	if ( true === timezone ) {
		return gmdateI18n( dateFormat, dateValue );
	}

	if ( false === timezone ) {
		timezone = undefined;
	}

	const dateMoment = buildMoment( dateValue, timezone );
	dateMoment.locale( settings.l10n.locale );
	return format( dateFormat, dateMoment );
}

/**
 * Formats a date (like `wp_date()` in PHP), translating it into site's locale
 * and using the UTC timezone.
 *
 * @param dateFormat PHP-style formatting string.
 *                   See [php.net/date](https://www.php.net/manual/en/function.date.php).
 * @param dateValue  Date object or string,
 *                   parsable by moment.js.
 *
 * @return Formatted date.
 */
export function gmdateI18n(
	dateFormat: string,
	dateValue: Moment | Date | string | number = new Date()
) {
	const dateMoment = momentLib( dateValue ).utc();
	dateMoment.locale( settings.l10n.locale );
	return format( dateFormat, dateMoment );
}

/**
 * Check whether a date is considered in the future according to the WordPress settings.
 *
 * @param dateValue Date String or Date object in the Defined WP Timezone.
 *
 * @return Is in the future.
 */
export function isInTheFuture( dateValue: Date | string | number ) {
	const now = momentLib.tz( WP_ZONE );
	const momentObject = momentLib.tz( dateValue, WP_ZONE );

	return momentObject.isAfter( now );
}

/**
 * Create and return a JavaScript Date Object from a date string in the WP timezone.
 *
 * @param dateString Date formatted in the WP timezone.
 *
 * @return  Date
 */
export function getDate( dateString?: string | null ) {
	if ( ! dateString ) {
		return momentLib.tz( WP_ZONE ).toDate();
	}

	return momentLib.tz( dateString, WP_ZONE ).toDate();
}

/**
 * Returns a human-readable time difference between two dates, like human_time_diff() in PHP.
 *
 * @param from From date, in the WP timezone.
 * @param to   To date, formatted in the WP timezone.
 *
 * @return Human-readable time difference.
 */
export function humanTimeDiff(
	from: Moment | Date | string | number,
	to?: Moment | Date | string | number
) {
	const fromMoment = momentLib.tz( from, WP_ZONE );
	const toMoment = to ? momentLib.tz( to, WP_ZONE ) : momentLib.tz( WP_ZONE );
	return fromMoment.from( toMoment );
}

/**
 * Creates a moment instance using the given timezone or, if none is provided, using global settings.
 *
 * @param dateValue Date object or string, parsable
 *                  by moment.js.
 * @param timezone  Timezone to output result in or a
 *                  UTC offset. Defaults to timezone from
 *                  site.
 *
 * @see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 * @see https://en.wikipedia.org/wiki/ISO_8601#Time_offsets_from_UTC
 *
 * @return A moment instance.
 */
function buildMoment(
	dateValue?: Moment | Date | string | number,
	timezone: string | number = ''
) {
	const dateMoment = momentLib( dateValue );

	if ( timezone && ! isUTCOffset( timezone ) ) {
		// The ! isUTCOffset() check guarantees that timezone is a string.
		return dateMoment.tz( timezone as string );
	}

	if ( timezone && isUTCOffset( timezone ) ) {
		return dateMoment.utcOffset( timezone );
	}

	if ( settings.timezone.string ) {
		return dateMoment.tz( settings.timezone.string );
	}

	return dateMoment.utcOffset( +settings.timezone.offset );
}

/**
 * Returns whether a certain UTC offset is valid or not.
 *
 * @param offset a UTC offset.
 *
 * @return  whether a certain UTC offset is valid or not.
 */
function isUTCOffset( offset: number | string ) {
	if ( 'number' === typeof offset ) {
		return true;
	}

	return VALID_UTC_OFFSET.test( offset );
}

setupWPTimezone();
