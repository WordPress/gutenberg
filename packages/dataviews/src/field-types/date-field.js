/**
 * WordPress dependencies
 */
import { dateI18n, getDate, getSettings } from '@wordpress/date';

export function DateField( { item, field } ) {
	const formattedDate = dateI18n(
		getSettings().formats.datetimeAbbreviated,
		getDate( field.getValue( { item } ) )
	);
	return <time>{ formattedDate }</time>;
}
