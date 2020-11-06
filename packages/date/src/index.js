/**
 * External dependencies
 */
import momentLib from 'moment';
import 'moment-timezone/moment-timezone';
import 'moment-timezone/moment-timezone-utils';

import { format as dateFnsFormat, isFuture, parseISO, toDate } from 'date-fns';
import { format as formatIntl, utcToZonedTime } from 'date-fns-tz';
import originalLocale from 'date-fns/locale/en-US/index';
import buildLocalizeFn from 'date-fns/locale/_lib/buildLocalizeFn';
import buildFormatLongFn from 'date-fns/locale/_lib/buildFormatLongFn';

/** @typedef {import('moment').Moment} Moment */

const WP_ZONE = 'WP';

// This regular expression tests positive for UTC offsets as described in ISO 8601.
// See: https://en.wikipedia.org/wiki/ISO_8601#Time_offsets_from_UTC
const VALID_UTC_OFFSET = /^[+-][0-1][0-9](:?[0-9][0-9])?$/;

// Changes made here will likely need to be made in `lib/client-assets.php` as
// well because it uses the `setSettings()` function to change these settings.
let settings = {
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
	},
	formats: {
		time: 'g: i a',
		date: 'F j, Y',
		datetime: 'F j, Y g: i a',
		datetimeAbbreviated: 'M j, Y g: i a',
	},
	timezone: { offset: '0', string: '', abbr: '' },
};
/**
 * Adds a locale to moment, using the format supplied by `wp_localize_script()`.
 *
 * @param {Object} dateSettings Settings, including locale data.
 */
export function setSettings( dateSettings ) {
	settings = dateSettings;

	// Backup and restore current locale.
	const currentLocale = momentLib.locale();
	momentLib.updateLocale( dateSettings.l10n.locale, {
		// Inherit anything missing from the default locale.
		parentLocale: currentLocale,
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
			LTS: null,
			L: null,
			LL: dateSettings.formats.date,
			LLL: dateSettings.formats.datetime,
			LLLL: null,
		},
		// From human_time_diff?
		// Set to `(number, withoutSuffix, key, isFuture) => {}` instead.
		relativeTime: dateSettings.l10n.relative,
	} );
	momentLib.locale( currentLocale );
}

/**
 * Returns the currently defined date settings.
 *
 * @return {Object} Settings, including locale data.
 */
export function __experimentalGetSettings() {
	return settings;
}

// Date constants.
/**
 * Number of seconds in one minute.
 *
 * @type {number}
 */
const MINUTE_IN_SECONDS = 60;
/**
 * Number of minutes in one hour.
 *
 * @type {number}
 */
const HOUR_IN_MINUTES = 60;
/**
 * Number of seconds in one hour.
 *
 * @type {number}
 */
const HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS;

/**
 * Map of PHP formats to Moment.js formats.
 *
 * These are used internally by {@link wp.date.format}, and are either
 * a string representing the corresponding Moment.js format code, or a
 * function which returns the formatted string.
 *
 * This should only be used through {@link wp.date.format}, not
 * directly.
 *
 * @type {Object}
 */
const formatMap = {
	// Day
	d: 'dd',
	D: 'EEE',
	j: 'd',
	l: 'EEEE',
	N: 'i',

	/**
	 * Gets the ordinal suffix.
	 *
	 * @param {Moment} momentDate Moment instance.
	 *
	 * @return {string} Formatted date.
	 */
	S( momentDate ) {
		// Do - D
		const num = momentDate.format( 'D' );
		const withOrdinal = momentDate.format( 'Do' );
		return withOrdinal.replace( num, '' );
	},

	w: 'd', // @todo: figure out how to make it start from 0
	/**
	 * Gets the day of the year (zero-indexed).
	 *
	 * @param {Moment} momentDate Moment instance.
	 *
	 * @return {string} Formatted date.
	 */
	z( momentDate ) {
		// DDD - 1
		return '' + parseInt( momentDate.format( 'DDD' ), 10 ) - 1;
	},

	// Week
	W: 'W',

	// Month
	F: 'MMMM',
	m: 'MM',
	M: 'MMM',
	n: 'M',
	/**
	 * Gets the days in the month.
	 *
	 * @param {Moment} momentDate Moment instance.
	 *
	 * @return {string} Formatted date.
	 */
	t( momentDate ) {
		return momentDate.daysInMonth();
	},

	// Year
	/**
	 * Gets whether the current year is a leap year.
	 *
	 * @param {Moment} momentDate Moment instance.
	 *
	 * @return {string} Formatted date.
	 */
	L( momentDate ) {
		return momentDate.isLeapYear() ? '1' : '0';
	},
	o: 'GGGG',
	Y: 'yyyy',
	y: 'YY',

	// Time
	a: 'a',
	A: 'A',
	/**
	 * Gets the current time in Swatch Internet Time (.beats).
	 *
	 * @param {Moment} momentDate Moment instance.
	 *
	 * @return {string} Formatted date.
	 */
	B( momentDate ) {
		const timezoned = momentLib( momentDate ).utcOffset( 60 );
		const seconds = parseInt( timezoned.format( 's' ), 10 ),
			minutes = parseInt( timezoned.format( 'm' ), 10 ),
			hours = parseInt( timezoned.format( 'H' ), 10 );
		return parseInt(
			( seconds +
				minutes * MINUTE_IN_SECONDS +
				hours * HOUR_IN_SECONDS ) /
				86.4,
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
	// Timezone
	e: 'zz', // @todo: date-fns-tz perhaps
	/**
	 * Gets whether the timezone is in DST currently.
	 *
	 * @param {Moment} momentDate Moment instance.
	 *
	 * @return {string} Formatted date.
	 */
	I( momentDate ) {
		return momentDate.isDST() ? '1' : '0';
	},
	O: 'xx',
	P: 'xxx',
	T: 'z', // @todo: date-fns-tz perhaps
	/**
	 * Gets the timezone offset in seconds.
	 *
	 * @param {Moment} momentDate Moment instance.
	 *
	 * @return {string} Formatted date.
	 */
	Z( momentDate ) {
		// Timezone offset in seconds.
		const offset = momentDate.format( 'Z' );
		const sign = offset[ 0 ] === '-' ? -1 : 1;
		const parts = offset.substring( 1 ).split( ':' );
		return (
			sign *
			( parts[ 0 ] * HOUR_IN_MINUTES + parts[ 1 ] ) *
			MINUTE_IN_SECONDS
		);
	},
	// Full date/time
	c: 'yyyy-MM-DDTHH:mm:ssZ', // .toISOString
	r: 'ddd, D MMM yyyy HH:mm:ss ZZ',
	U: 'X', // @todo: find out how to get epoc
};

function translateFormat( formatString ) {
	let i, char;
	let newFormat = [];

	for ( i = 0; i < formatString.length; i++ ) {
		char = formatString[ i ];
		// Is this an escape?
		if ( '\\' === char ) {
			// Add next character, then move on.
			i++;
			newFormat.push( "'" + formatString[ i ] + "'" );
			continue;
		}
		if ( char in formatMap ) {
			// @todo: the following is commented out until format functions are implemented
			// if ( typeof formatMap[ char ] !== 'string' ) {
			// 	// If the format is a function, call it.
			// 	newFormat.push( '[' + formatMap[ char ]( momentDate ) + ']' );
			// } else {
			// Otherwise, add as a formatting string.
			newFormat.push( formatMap[ char ] );
			// }
		} else {
			newFormat.push( "'" + char + "'" );
		}
	}
	// Join with [] between to separate characters, and replace
	// unneeded separators with static text.

	newFormat = newFormat.join( '' );

	return newFormat;
}

function getLocalizationSettings() {
	const monthValues = {
		abbreviated: settings.l10n.monthsShort,
		wide: settings.l10n.months,
	};

	const dayValues = {
		abbreviated: settings.l10n.weekdaysShort,
		wide: settings.l10n.weekdays,
	};

	return {
		...originalLocale.localize,
		month: buildLocalizeFn( {
			values: monthValues,
			defaultWidth: 'wide',
		} ),
		day: buildLocalizeFn( {
			values: dayValues,
			defaultWidth: 'wide',
		} ),
		formatLong: {
			date: buildFormatLongFn( {
				formats: {
					full: settings.formats.date,
					defaultWidth: 'full',
				},
			} ),
			time: buildFormatLongFn( {
				formats: {
					full: settings.formats.time,
					defaultWidth: 'full',
				},
			} ),
			dateTime: buildFormatLongFn( {
				formats: {
					full: settings.formats.datetime,
					short: settings.formats.datetimeAbbreviated,
					defaultWidth: 'full',
				},
			} ),
		},
	};
}

/**
 * Returns whether a certain UTC offset is valid or not.
 *
 * @param {number|string} offset a UTC offset.
 *
 * @return {boolean} whether a certain UTC offset is valid or not.
 */
function isValidUTCOffset( offset ) {
	return VALID_UTC_OFFSET.test( offset );
}

function integerToUTCOffset( offset ) {
	const offsetInHours = offset > 23 ? offset / 60 : offset;
	const sign = offset < 0 ? '-' : '+';
	const absoluteOffset =
		offsetInHours < 0 ? offsetInHours * -1 : offsetInHours;

	return offsetInHours < 10
		? `${ sign }0${ absoluteOffset }`
		: `${ sign }${ absoluteOffset }`;
}

function shouldParseAsUTCOffset( offset ) {
	const isNumber = ! Number.isNaN( Number.parseInt( offset, 10 ) );
	return isNumber && ! isValidUTCOffset( offset );
}

function getActualTimezone( timezone = '' ) {
	if ( ! timezone ) {
		const { string, offset } = settings.timezone;

		if ( string ) {
			return string;
		}

		if ( shouldParseAsUTCOffset( offset ) ) {
			return integerToUTCOffset( offset );
		}
	}

	return shouldParseAsUTCOffset( timezone )
		? integerToUTCOffset( timezone )
		: timezone;
}

/**
 * Formats a date. Does not alter the date's timezone.
 *
 * @param {string}                  dateFormat PHP-style formatting string.
 *                                             See php.net/date.
 * @param {Date|string|Moment|null} dateValue  Date object or string,
 *                                             parsable by moment.js.
 *
 * @return {string} Formatted date.
 */
export function format( dateFormat, dateValue = new Date() ) {
	const formatString = translateFormat( dateFormat );
	return dateFnsFormat( new Date( dateValue ), formatString );
}

/**
 * Formats a date (like `date()` in PHP).
 *
 * @param {string}                  dateFormat PHP-style formatting string.
 *                                             See php.net/date.
 * @param {Date|string|Moment|null} dateValue  Date object or string, parsable
 *                                             by moment.js.
 * @param {string|number|null}      timezone   Timezone to output result in or a
 *                                             UTC offset. Defaults to timezone from
 *                                             site.
 *
 * @see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 * @see https://en.wikipedia.org/wiki/ISO_8601#Time_offsets_from_UTC
 *
 * @return {string} Formatted date in English.
 */
export function date( dateFormat, dateValue = new Date(), timezone ) {
	const formatString = translateFormat( dateFormat );

	return formatIntl(
		utcToZonedTime( parseISO( dateValue ), getActualTimezone( timezone ) ),
		formatString,
		{ timeZone: getActualTimezone( timezone ) }
	);
}

/**
 * Formats a date (like `date()` in PHP), in the UTC timezone.
 *
 * @param {string}                  dateFormat PHP-style formatting string.
 *                                             See php.net/date.
 * @param {Date|string|Moment|null} dateValue  Date object or string,
 *                                             parsable by moment.js.
 *
 * @return {string} Formatted date in English.
 */
export function gmdate( dateFormat, dateValue = new Date() ) {
	const formatString = translateFormat( dateFormat );

	return formatIntl(
		utcToZonedTime( parseISO( dateValue ), 'UTC' ),
		formatString
	);
}

/**
 * Formats a date (like `wp_date()` in PHP), translating it into site's locale.
 *
 * Backward Compatibility Notice: if `timezone` is set to `true`, the function
 * behaves like `gmdateI18n`.
 *
 * @param {string}                     dateFormat PHP-style formatting string.
 *                                                See php.net/date.
 * @param {Date|string|Moment|null}    dateValue  Date object or string, parsable by
 *                                                moment.js.
 * @param {string|number|boolean|null} timezone   Timezone to output result in or a
 *                                                UTC offset. Defaults to timezone from
 *                                                site. Notice: `boolean` is effectively
 *                                                deprecated, but still supported for
 *                                                backward compatibility reasons.
 *
 * @see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 * @see https://en.wikipedia.org/wiki/ISO_8601#Time_offsets_from_UTC
 *
 * @return {string} Formatted date.
 */
export function dateI18n( dateFormat, dateValue = new Date(), timezone ) {
	if ( true === timezone ) {
		return gmdateI18n( dateFormat, dateValue );
	}

	if ( false === timezone ) {
		timezone = undefined;
	}

	return formatIntl(
		utcToZonedTime( parseISO( dateValue ), getActualTimezone( timezone ) ),
		translateFormat( dateFormat ),
		{
			timeZone: getActualTimezone( timezone ),
			locale: {
				...originalLocale,
				locale: settings.l10n.locale,
				code: settings.l10n.locale,
				localize: getLocalizationSettings(),
			},
		}
	);
}

/**
 * Formats a date (like `wp_date()` in PHP), translating it into site's locale
 * and using the UTC timezone.
 *
 * @param {string}                  dateFormat PHP-style formatting string.
 *                                             See php.net/date.
 * @param {Date|string|Moment|null} dateValue  Date object or string,
 *                                             parsable by moment.js.
 *
 * @return {string} Formatted date.
 */
export function gmdateI18n( dateFormat, dateValue = new Date() ) {
	return formatIntl(
		utcToZonedTime( parseISO( dateValue ) ),
		translateFormat( dateFormat ),
		{
			timeZone: 'UTC',
			locale: {
				...originalLocale,
				locale: settings.l10n.locale,
				code: settings.l10n.locale,
				localize: getLocalizationSettings(),
			},
		}
	);
}

/**
 * Check whether a date is considered in the future according to the WordPress settings.
 *
 * @param {string|Date} dateValue Date String or Date object in the Defined WP Timezone.
 *
 * @return {boolean} Is in the future.
 */
export function isInTheFuture( dateValue ) {
	const dateObject = toDate( dateValue, { timeZone: WP_ZONE } );

	return isFuture( dateObject );
}

/**
 * Create and return a JavaScript Date Object from a date string in the WP timezone.
 *
 * @param {string?} dateString Date formatted in the WP timezone.
 *
 * @return {Date} Date
 */
export function getDate( dateString ) {
	const actualDate = dateString ? dateString : new Date();
	return toDate( actualDate, { timeZone: WP_ZONE } );
}
