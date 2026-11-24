import { __, _x, isRTL, sprintf } from '@wordpress/i18n';
import { dateI18n, getDate, getSettings } from '@wordpress/date';

/*
 * The publish date wording of the post summary, as the editor's
 * `getPostScheduleLabel()` and `getFullPostScheduleLabel()` have it. This
 * script module can't import the editor, so the strings keep their source and
 * context to share its translations.
 */

/**
 * The full publish date with the site's timezone, e.g. "November 5, 2026
 * 9:24 am UTC+0".
 *
 * @param dateAttribute The post date.
 * @return The full label.
 */
export function getFullPublishDateLabel( dateAttribute: string | null ) {
	const date = getDate( dateAttribute );

	const timezoneAbbreviation = getTimezoneAbbreviation();
	const formattedDate = dateI18n(
		// translators: Use a non-breaking space between 'g:i' and 'a' if appropriate.
		_x( 'F j, Y g:i\xa0a', 'post schedule full date format' ),
		date
	);
	return isRTL()
		? `${ timezoneAbbreviation } ${ formattedDate }`
		: `${ formattedDate } ${ timezoneAbbreviation }`;
}

/**
 * The publish date in words, the first that applies:
 *
 * 1. "Immediately", for a reset or floating date;
 * 2. the full date with the site's timezone, when the user's timezone differs
 *    from the site's, as "today" or "tomorrow" would be ambiguous;
 * 3. "Today at 9:24 am";
 * 4. "Tomorrow at 9:24 am";
 * 5. "November 12 9:24 am", within the current year;
 * 6. "November 12, 2027 9:24 am", otherwise.
 *
 * @param dateAttribute      The post date.
 * @param options            Options.
 * @param options.isFloating Whether the date floats, see isDateFloating().
 * @param options.now        The current date, for tests.
 * @return The label.
 */
export function getPublishDateLabel(
	dateAttribute: string | null | undefined,
	{ isFloating = false, now = new Date() } = {}
) {
	if ( ! dateAttribute || isFloating ) {
		return __( 'Immediately' );
	}

	if ( ! isTimezoneSameAsSiteTimezone( now ) ) {
		return getFullPublishDateLabel( dateAttribute );
	}

	const date = getDate( dateAttribute );

	if ( isSameDay( date, now ) ) {
		return sprintf(
			// translators: %s: Time of day the post is scheduled for.
			__( 'Today at %s' ),
			// translators: If using a space between 'g:i' and 'a', use a non-breaking space.
			dateI18n( _x( 'g:i\xa0a', 'post schedule time format' ), date )
		);
	}

	const tomorrow = new Date( now );
	tomorrow.setDate( tomorrow.getDate() + 1 );

	if ( isSameDay( date, tomorrow ) ) {
		return sprintf(
			// translators: %s: Time of day the post is scheduled for.
			__( 'Tomorrow at %s' ),
			// translators: If using a space between 'g:i' and 'a', use a non-breaking space.
			dateI18n( _x( 'g:i\xa0a', 'post schedule time format' ), date )
		);
	}

	if ( date.getFullYear() === now.getFullYear() ) {
		return dateI18n(
			// translators: If using a space between 'g:i' and 'a', use a non-breaking space.
			_x( 'F j g:i\xa0a', 'post schedule date format without year' ),
			date
		);
	}

	return dateI18n(
		// translators: Use a non-breaking space between 'g:i' and 'a' if appropriate.
		_x( 'F j, Y g:i\xa0a', 'post schedule full date format' ),
		date
	);
}

function getTimezoneAbbreviation() {
	const { timezone } = getSettings();

	if ( timezone.abbr && isNaN( Number( timezone.abbr ) ) ) {
		return timezone.abbr;
	}

	const symbol = Number( timezone.offset ) < 0 ? '' : '+';
	return `UTC${ symbol }${ timezone.offsetFormatted }`;
}

function isTimezoneSameAsSiteTimezone( date: Date ) {
	const { timezone } = getSettings();

	const siteOffset = Number( timezone.offset );
	const dateOffset = -1 * ( date.getTimezoneOffset() / 60 );
	return siteOffset === dateOffset;
}

function isSameDay( left: Date, right: Date ) {
	return (
		left.getDate() === right.getDate() &&
		left.getMonth() === right.getMonth() &&
		left.getFullYear() === right.getFullYear()
	);
}
