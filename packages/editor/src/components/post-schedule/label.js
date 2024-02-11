/**
 * WordPress dependencies
 */
import { __, _x, sprintf, isRTL } from '@wordpress/i18n';
import { getSettings, getDate, dateI18n } from '@wordpress/date';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostScheduleLabel( props ) {
	return usePostScheduleLabel( props );
}

export function usePostScheduleLabel( { full = false } = {} ) {
	const { date, isFloating } = useSelect(
		( select ) => ( {
			date: select( editorStore ).getEditedPostAttribute( 'date' ),
			isFloating: select( editorStore ).isEditedPostDateFloating(),
		} ),
		[]
	);

	return full
		? getFullPostScheduleLabel( date )
		: getPostScheduleLabel( date, { isFloating } );
}

export function getFullPostScheduleLabel( dateAttribute ) {
	const date = getDate( dateAttribute );

	const timezoneAbbreviation = getTimezoneAbbreviation();
	const formattedDate = dateI18n(
		// translators: If using a space between 'g:i' and 'a', use a non-breaking space.
		_x( 'F j, Y g:i\xa0a', 'post schedule full date format' ),
		date
	);
	return isRTL()
		? `${ timezoneAbbreviation } ${ formattedDate }`
		: `${ formattedDate } ${ timezoneAbbreviation }`;
}

export function getPostScheduleLabel(
	dateAttribute,
	{ isFloating = false, now = new Date() } = {}
) {
	if ( ! dateAttribute || isFloating ) {
		return __( 'Immediately' );
	}

	// If the user timezone does not equal the site timezone then using words
	// like 'tomorrow' is confusing, so show the full date.
	if ( ! isTimezoneSameAsSiteTimezone( now ) ) {
		return getFullPostScheduleLabel( dateAttribute );
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

	const symbol = timezone.offset < 0 ? '' : '+';
	return `UTC${ symbol }${ timezone.offsetFormatted }`;
}

function isTimezoneSameAsSiteTimezone( date ) {
	const { timezone } = getSettings();

	const siteOffset = Number( timezone.offset );
	const dateOffset = -1 * ( date.getTimezoneOffset() / 60 );
	return siteOffset === dateOffset;
}

function isSameDay( left, right ) {
	return (
		left.getDate() === right.getDate() &&
		left.getMonth() === right.getMonth() &&
		left.getFullYear() === right.getFullYear()
	);
}
