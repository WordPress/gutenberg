/**
 * External dependencies
 */
import {
	addHours,
	format as dateFnsFormat,
	getDaysInMonth,
	isFuture,
	isLeapYear,
	parseISO,
} from 'date-fns';
import {
	format as formatTZ,
	utcToZonedTime,
	zonedTimeToUtc,
	toDate,
} from 'date-fns-tz';
import originalLocale from 'date-fns/locale/en-US/index';
import buildLocalizeFn from 'date-fns/locale/_lib/buildLocalizeFn';
import buildFormatLongFn from 'date-fns/locale/_lib/buildFormatLongFn';

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
		time: 'g:i a',
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
	 * @param {Date} dateValue Date ISO string or object.
	 *
	 * @return {string} Formatted date.
	 */
	S( dateValue ) {
		const num = dateFnsFormat( dateValue, 'd' );
		const withOrdinal = dateFnsFormat( dateValue, 'do' );
		return withOrdinal.replace( num, '' );
	},
	/**
	 * Returns the day of the week (zero-indexed).
	 *
	 * @param {string} dateValue
	 */
	w( dateValue ) {
		return `${ parseInt( dateFnsFormat( dateValue, 'i' ), 10 ) - 1 }`;
	},
	/**
	 * Gets the day of the year (zero-indexed).
	 *
	 * @param {Date} dateValue Date ISO string or object.
	 *
	 * @return {string} Formatted date.
	 */
	z( dateValue ) {
		// DDD - 1
		return `${ parseInt( dateFnsFormat( dateValue, 'DDD' ), 10 ) - 1 }`;
	},

	// Week
	W: 'II',

	// Month
	F: 'MMMM',
	m: 'MM',
	M: 'MMM',
	n: 'M',
	/**
	 * Gets the days in the month.
	 *
	 * @param {Date} dateValue Date ISO string or object.
	 *
	 * @return {string} Formatted date.
	 */
	t( dateValue ) {
		return getDaysInMonth( dateValue );
	},

	// Year
	/**
	 * Gets whether the current year is a leap year.
	 *
	 * @param {Date} dateValue Date ISO string or object.
	 *
	 * @return {string} Formatted date.
	 */
	L( dateValue ) {
		return isLeapYear( dateValue ) ? '1' : '0';
	},
	o: 'R',
	Y: 'yyyy',
	y: 'yy',

	// Time
	a( dateValue ) {
		return formatTZ( dateValue, 'aa', {
			timeZone: getActualTimezone(),
		} ).toLowerCase();
	},
	A: 'bb',
	/**
	 * Gets the given time in Swatch Internet Time (.beats).
	 *
	 * @param {Date} dateValue Date ISO string or object.
	 *
	 * @return {string} Formatted date.
	 */
	B( dateValue ) {
		const parsedDate = addHours( zonedTimeToUtc( dateValue ), 1 );
		const seconds = parseInt( dateFnsFormat( parsedDate, 's' ), 10 ),
			minutes = parseInt( dateFnsFormat( parsedDate, 'm' ), 10 ),
			hours = parseInt( dateFnsFormat( parsedDate, 'H' ), 10 );

		/*
		 * Rounding up to match results on the same timestamp using
		 * PHP's date_format.
		 */
		return Math.ceil(
			( seconds +
				minutes * MINUTE_IN_SECONDS +
				hours * HOUR_IN_SECONDS ) /
				86.4
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
	/**
	 * Return the timezone identifier for the given date.
	 *
	 * @param {Date} dateValue Date ISO string or object.
	 *
	 * @return {string} Formatted date.
	 */
	e( dateValue ) {
		return formatTZ( dateValue, 'zzzz', { timeZone: getActualTimezone() } );
	},
	/**
	 * Gets whether the timezone is in DST currently.
	 *
	 *
	 * @return {string} Formatted date.
	 */
	I() {
		return ''; // @todo
	},
	O( dateValue ) {
		return formatTZ( dateValue, 'xx', { timeZone: getActualTimezone() } );
	},
	P( dateValue ) {
		return formatTZ( dateValue, 'xxx', { timeZone: getActualTimezone() } );
	},
	T( dateValue ) {
		return formatTZ( dateValue, 'z', { timeZone: getActualTimezone() } );
	},
	/**
	 * Gets the timezone offset in seconds.
	 *
	 * @param {Date|string} dateValue Date ISO string or object.
	 *
	 * @return {string} Formatted date.
	 */
	Z( dateValue ) {
		// Timezone offset in seconds.
		const offset = dateFnsFormat(
			utcToZonedTime( dateValue, 'UTC' ),
			'XXX'
		);
		const sign = offset[ 0 ] === '-' ? -1 : 1;
		const parts = offset.substring( 1 ).split( ':' ).map( Number );
		return (
			sign *
			( parts[ 0 ] * HOUR_IN_MINUTES + parts[ 1 ] ) *
			MINUTE_IN_SECONDS
		);
	},
	// Full date/time
	c( dateValue ) {
		return formatTZ(
			utcToZonedTime(
				zonedTimeToUtc( dateValue, getActualTimezone() ),
				'UTC'
			), // Offsets the time to the correct timezone
			"yyyy-MM-dd'T'HH:mm:ssXXX",
			{
				timeZone: getActualTimezone(), // Adds the timezone offset to the Date object that will be formatted.
			}
		);
	}, // .toISOString
	r( dateValue ) {
		return formatTZ(
			utcToZonedTime(
				zonedTimeToUtc( dateValue, getActualTimezone() ),
				'UTC'
			), // Offsets the time to the correct timezone
			'iii, d MMM yyyy HH:mm:ss XX',
			{
				timeZone: getActualTimezone(), // Adds the timezone offset to the Date object that will be formatted.
			}
		);
	},
	U( dateValue ) {
		return formatTZ(
			zonedTimeToUtc( dateValue, getActualTimezone() ),
			't'
		);
	},
};

/**
 * Applies map of PHP formatting tokens into date-fns formatting tokens to the given format and date.
 *
 * @param {string} formatString
 * @param {Date|string} dateValue
 */
function translateFormat( formatString, dateValue ) {
	let i, char;
	let newFormat = [];

	const parsedDate =
		typeof dateValue === 'string' ? parseISO( dateValue ) : dateValue;

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
			if ( typeof formatMap[ char ] !== 'string' ) {
				// If the format is a function, call it.
				newFormat.push( "'" + formatMap[ char ]( parsedDate ) + "'" );
			} else {
				// Otherwise, add as a formatting string.
				newFormat.push( formatMap[ char ] );
			}
		} else {
			newFormat.push( char );
		}
	}
	// Join with [] between to separate characters, and replace
	// unneeded separators with static text.

	newFormat = newFormat.join( '' );

	return newFormat;
}

/**
 * Build date-fns locale settings from WordPress localization settings.
 */
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

/**
 * Transform the given integer into a valid UTC Offset in hours.
 *
 * @param {number} offset A UTC offset as an integer
 */
function integerToUTCOffset( offset ) {
	const offsetInHours = offset > 23 ? offset / 60 : offset;
	const sign = offset < 0 ? '-' : '+';
	const absoluteOffset =
		offsetInHours < 0 ? offsetInHours * -1 : offsetInHours;

	return offsetInHours < 10
		? `${ sign }0${ absoluteOffset }`
		: `${ sign }${ absoluteOffset }`;
}

/**
 * Determines whether or not the given value can be parsed as a UTC offset,
 * by checking if it is parseable as an integer and if it isn't a
 * valid UTC offset already.
 *
 * @param {string} offset An offset as an integer or a string.
 */
function shouldParseAsUTCOffset( offset ) {
	const isNumber = ! Number.isNaN( Number.parseInt( offset, 10 ) );
	return isNumber && ! isValidUTCOffset( offset );
}

/**
 * Get a properly formatted timezone from a timezone string or offset.
 * Return system timezone or offset if no timezone was given.
 *
 * @param {string} timezone
 */
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
 * @param {Date|string|null} dateValue  Date object or ISO string.
 *
 * @return {string} Formatted date.
 */
export function format( dateFormat, dateValue = new Date() ) {
	const formatString = translateFormat( dateFormat, dateValue );
	return dateFnsFormat( new Date( dateValue ), formatString );
}

/**
 * Formats a date (like `date()` in PHP).
 *
 * @param {string}                  dateFormat PHP-style formatting string.
 *                                             See php.net/date.
 * @param {Date|string|null} dateValue  Date object or ISO string, parsable
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
	return format(
		dateFormat,
		utcToZonedTime( dateValue, getActualTimezone( timezone ) )
	);
}

/**
 * Formats a date (like `date()` in PHP), in the UTC timezone.
 *
 * @param {string}                  dateFormat PHP-style formatting string.
 *                                             See php.net/date.
 * @param {Date|string|null} dateValue  Date object or ISO string.
 *
 * @return {string} Formatted date in English.
 */
export function gmdate( dateFormat, dateValue = new Date() ) {
	return format( dateFormat, utcToZonedTime( dateValue, 'UTC' ) );
}

/**
 * Formats a date (like `wp_date()` in PHP), translating it into site's locale.
 *
 * Backward Compatibility Notice: if `timezone` is set to `true`, the function
 * behaves like `gmdateI18n`.
 *
 * @param {string}                     dateFormat PHP-style formatting string.
 *                                                See php.net/date.
 * @param {Date|string|null}    dateValue  Date object or string, parsable by
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

	return formatTZ(
		utcToZonedTime(
			zonedTimeToUtc( dateValue, getActualTimezone() ),
			getActualTimezone( timezone )
		),
		translateFormat( dateFormat, dateValue ),
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
 * @param {Date|string|null} dateValue  Date object or ISO string.
 *
 * @return {string} Formatted date.
 */
export function gmdateI18n( dateFormat, dateValue = new Date() ) {
	return formatTZ(
		utcToZonedTime( dateValue, 'UTC' ),
		translateFormat( dateFormat, dateValue ),
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
	const dateObject = toDate( dateValue, { timeZone: getActualTimezone() } );

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
	const actualDate = dateString ? new Date( dateString ) : new Date();
	return toDate( actualDate, { timeZone: getActualTimezone() } );
}

export { zonedTimeToUtc };
