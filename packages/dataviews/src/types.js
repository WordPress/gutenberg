/**
 * WordPress dependencies
 */
import { dateI18n, getDate, getSettings } from '@wordpress/date';

export const renderDate = ( { field, item } ) => {
	const formattedDate = dateI18n(
		getSettings().formats.datetimeAbbreviated,
		getDate( field.getValue( { item } ) )
	);
	return <time>{ formattedDate }</time>;
};
