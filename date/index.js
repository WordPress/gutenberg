import moment from 'moment';

// Date constants.
/**
 * Number of seconds in one minute.
 *
 * @type {Number}
 */
const MINUTE_IN_SECONDS = 60;
/**
 * Number of minutes in one hour.
 *
 * @type {Number}
 */
const HOUR_IN_MINUTES = 60;
/**
 * Number of seconds in one hour.
 *
 * @type {Number}
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
	d: 'DD',
	D: 'ddd',
	j: 'D',
	l: 'dddd',
	N: 'E',

	/**
	 * Gets the ordinal suffix.
	 *
	 * @param {moment} momentDate Moment instance.
	 *
	 * @return {string} Formatted date.
	 */
	S( momentDate ) {
		// Do - D
		const num = momentDate.format( 'D' );
		const withOrdinal = momentDate.format( 'Do' );
		return withOrdinal.replace( num, '' );
	},

	w: 'd',
	/**
	 * Gets the day of the year (zero-indexed).
	 *
	 * @param {moment} momentDate Moment instance.
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
	 * @param {moment} momentDate Moment instance.
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
	 * @param {moment} momentDate Moment instance.
	 *
	 * @return {string} Formatted date.
	 */
	L( momentDate ) {
		return momentDate.isLeapYear() ? '1' : '0';
	},
	o: 'GGGG',
	Y: 'YYYY',
	y: 'YY',

	// Time
	a: 'a',
	A: 'A',
	/**
	 * Gets the current time in Swatch Internet Time (.beats).
	 *
	 * @param {moment} momentDate Moment instance.
	 *
	 * @return {string} Formatted date.
	 */
	B( momentDate ) {
		const timezoned = moment( momentDate ).utcOffset( 60 );
		const seconds = parseInt( timezoned.format( 's' ), 10 ),
			minutes = parseInt( timezoned.format( 'm' ), 10 ),
			hours = parseInt( timezoned.format( 'H' ), 10 );
		return parseInt(
			(
				seconds +
				( minutes * MINUTE_IN_SECONDS ) +
				( hours * HOUR_IN_SECONDS )
			) / 86.4,
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
	e: 'zz',
	/**
	 * Gets whether the timezone is in DST currently.
	 *
	 * @param {moment} momentDate Moment instance.
	 *
	 * @return {string} Formatted date.
	 */
	I( momentDate ) {
		return momentDate.isDST() ? '1' : '0';
	},
	O: 'ZZ',
	P: 'Z',
	T: 'z',
	/**
	 * Gets the timezone offset in seconds.
	 *
	 * @param {moment} momentDate Moment instance.
	 *
	 * @return {string} Formatted date.
	 */
	Z( momentDate ) {
		// Timezone offset in seconds.
		const offset = momentDate.format( 'Z' );
		const sign = offset[ 0 ] === '-' ? -1 : 1;
		const parts = offset.substring( 1 ).split( ':' );
		return sign * ( ( parts[ 0 ] * HOUR_IN_MINUTES ) + parts[ 1 ] ) * MINUTE_IN_SECONDS;
	},
	// Full date/time
	c: 'YYYY-MM-DDTHH:mm:ssZ', // .toISOString
	r: 'ddd, D MMM YYYY HH:mm:ss ZZ',
	U: 'X',
};

/**
 * Adds a locale to moment, using the format supplied by `wp_localize_script()`.
 *
 * @param {Object} settings Settings, including locale data.
 */
function setupLocale( settings ) {
	// Backup and restore current locale.
	const currentLocale = moment.locale();
	moment.updateLocale( settings.l10n.locale, {
		// Inherit anything missing from the default locale.
		parentLocale: currentLocale,
		months: settings.l10n.months,
		monthsShort: settings.l10n.monthsShort,
		weekdays: settings.l10n.weekdays,
		weekdaysShort: settings.l10n.weekdaysShort,
		meridiem( hour, minute, isLowercase ) {
			if ( hour < 12 ) {
				return isLowercase ? settings.l10n.meridiem.am : settings.l10n.meridiem.AM;
			}
			return isLowercase ? settings.l10n.meridiem.pm : settings.l10n.meridiem.PM;
		},
		longDateFormat: {
			LT: settings.formats.time,
			LTS: null,
			L: null,
			LL: settings.formats.date,
			LLL: settings.formats.datetime,
			LLLL: null,
		},
		// From human_time_diff?
		// Set to `(number, withoutSuffix, key, isFuture) => {}` instead.
		relativeTime: {
			future: settings.l10n.relative.future,
			past: settings.l10n.relative.past,
			s: 'seconds',
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
	} );
	moment.locale( currentLocale );
}

/**
 * Formats a date. Does not alter the date's timezone.
 *
 * @param {string}                    dateFormat PHP-style formatting string.
 *                                               See php.net/date.
 * @param {(Date|string|moment|null)} dateValue  Date object or string,
 *                                               parsable by moment.js.
 *
 * @return {string} Formatted date.
 */
export function format( dateFormat, dateValue = new Date() ) {
	let i, char;
	let newFormat = [];
	const momentDate = moment( dateValue );
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
			if ( typeof formatMap[ char ] !== 'string' ) {
				// If the format is a function, call it.
				newFormat.push( '[' + formatMap[ char ]( momentDate ) + ']' );
			} else {
				// Otherwise, add as a formatting string.
				newFormat.push( formatMap[ char ] );
			}
		} else {
			newFormat.push( '[' + char + ']' );
		}
	}
	// Join with [] between to separate characters, and replace
	// unneeded separators with static text.
	newFormat = newFormat.join( '[]' );
	return momentDate.format( newFormat );
}

/**
 * Formats a date (like `date()` in PHP), in the site's timezone.
 *
 * @param {string}                    dateFormat PHP-style formatting string.
 *                                               See php.net/date.
 * @param {(Date|string|moment|null)} dateValue  Date object or string,
 *                                               parsable by moment.js.
 *
 * @return {string} Formatted date.
 */
export function date( dateFormat, dateValue = new Date() ) {
	const offset = window._wpDateSettings.timezone.offset * HOUR_IN_MINUTES;
	const dateMoment = moment( dateValue ).utcOffset( offset, true );
	return format( dateFormat, dateMoment );
}

/**
 * Formats a date (like `date()` in PHP), in the UTC timezone.
 *
 * @param {string}                    dateFormat PHP-style formatting string.
 *                                               See php.net/date.
 * @param {(Date|string|moment|null)} dateValue  Date object or string,
 *                                               parsable by moment.js.
 *
 * @return {string} Formatted date.
 */
export function gmdate( dateFormat, dateValue = new Date() ) {
	const dateMoment = moment( dateValue ).utc();
	return format( dateFormat, dateMoment );
}

/**
 * Formats a date (like `dateI18n()` in PHP).
 *
 * @param {string}                    dateFormat PHP-style formatting string.
 *                                               See php.net/date.
 * @param {(Date|string|moment|null)} dateValue  Date object or string,
 *                                               parsable by moment.js.
 * @param {boolean}                   gmt        True for GMT/UTC, false for
 *                                               site's timezone.
 *
 * @return {string} Formatted date.
 */
export function dateI18n( dateFormat, dateValue = new Date(), gmt = false ) {
	// Defaults.
	const offset = gmt ? 0 : window._wpDateSettings.timezone.offset * HOUR_IN_MINUTES;
	// Convert to moment object.
	const dateMoment = moment( dateValue ).utcOffset( offset, true );

	// Set the locale.
	dateMoment.locale( window._wpDateSettings.l10n.locale );
	// Format and return.
	return format( dateFormat, dateMoment );
}

export const settings = window._wpDateSettings;

// Initialize.
setupLocale( window._wpDateSettings );
