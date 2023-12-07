/**
 * WordPress dependencies
 */
import { dateI18n, getDate, getSettings } from '@wordpress/date';

const renderLinkFormat = ( { format, item, children } ) => {
	const props = format.renderProps( { item } );
	return <a { ...props }>{ children }</a>;
};

const renderDateFormat = ( { children } ) => {
	const formattedDate = dateI18n(
		getSettings().formats.datetimeAbbreviated,
		getDate( children )
	);
	return <time>{ formattedDate }</time>;
};

export const renderDate = ( { field, item } ) => {
	field.formats.unshift( { type: 'date' } );

	return renderText( { field, item } );
};

export const renderText = ( { field, item } ) => {
	const value = field.getValue( { item } );
	return field.formats.reduce( ( acc, format ) => {
		if ( format.type === 'link' ) {
			return renderLinkFormat( { format, item, children: acc } );
		}
		if ( format.type === 'date' ) {
			return renderDateFormat( { format, item, children: acc } );
		}

		return acc;
	}, value );
};

export const renderEnumeration = renderText;
