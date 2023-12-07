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

export const renderText = ( { field, item } ) => {
	const value = field.getValue( { item } );
	if ( field.formats === undefined ) {
		field.formats = [];
	}
	return field.formats.reduce( ( acc, format ) => {
		if ( format.type === 'link' ) {
			const props = format.renderProps( { item, value } );
			return <a { ...props }>{ acc }</a>;
		}
		return acc;
	}, value );
};

export const renderEnumeration = renderText;
