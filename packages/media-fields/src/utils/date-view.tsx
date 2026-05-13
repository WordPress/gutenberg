/**
 * WordPress dependencies
 */
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import type { NormalizedField } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { MediaItem } from '../types';

const NBSP = ' ';

const DateView = ( {
	item,
	field,
}: {
	item: MediaItem;
	field: NormalizedField< MediaItem >;
} ) => {
	const value = field.getValue( { item } ) as string | null | undefined;
	if ( ! value ) {
		return null;
	}
	// Keep the meridiem ("am"/"pm") tied to the time so it can't orphan
	// onto a second line in narrow layouts like the media-editor sidebar.
	const formatted = dateI18n(
		getSettings().formats.datetimeAbbreviated,
		getDate( value )
	).replace( / (am|pm)$/i, `${ NBSP }$1` );
	return <time dateTime={ value }>{ formatted }</time>;
};

export default DateView;
