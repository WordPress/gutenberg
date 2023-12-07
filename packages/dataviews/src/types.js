/**
 * WordPress dependencies
 */
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { __experimentalVStack as VStack } from '@wordpress/components';

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

const renderAfterFormat = ( { format, item } ) => {
	const props = format.renderProps( { item } );
	return <span { ...props }>{ format.renderChildren( { item } ) }</span>;
};

export const renderDate = ( { field, item } ) => {
	field.formats.unshift( { type: 'date' } );

	return renderText( { field, item } );
};

export const renderText = ( { field, item } ) => {
	const value = field.getValue( { item } );
	const result = field.formats.reduce( ( acc, format ) => {
		if ( format.type === 'link' ) {
			return renderLinkFormat( { format, item, children: acc } );
		}
		if ( format.type === 'date' ) {
			return renderDateFormat( { format, item, children: acc } );
		}
		return acc;
	}, value );

	const afterFormat = field.formats.find(
		( format ) => format.type === 'after'
	);
	if ( afterFormat ) {
		return (
			<VStack spacing={ 1 }>
				{ result }
				{ renderAfterFormat( { format: afterFormat, item } ) }
			</VStack>
		);
	}
	return result;
};

export const renderEnumeration = renderText;
