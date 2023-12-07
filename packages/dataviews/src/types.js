/**
 * WordPress dependencies
 */
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import {
	__experimentalVStack as VStack,
	__experimentalText as Text,
	VisuallyHidden,
} from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import { sprintf, __ } from '@wordpress/i18n';

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

// TODO: remove field prop?
const renderEmptyFormat = ( { format, item, field } ) => {
	if ( format ) {
		const props = format.renderProps ? format.renderProps( { item } ) : {};
		return <Text { ...props }>{ format.renderChildren( { item } ) }</Text>;
	}

	return (
		<>
			<Text variant="muted" aria-hidden="true">
				&#8212;
			</Text>
			<VisuallyHidden>
				{ sprintf(
					/* translators: %s: field description or field id, e.g.: "No author." */
					__( 'No %s.' ),
					field.description?.toLowerCase() || field.id
				) }
			</VisuallyHidden>
		</>
	);
};

export const renderDate = ( { field, item } ) => {
	field.formats.unshift( { type: 'date' } );

	return renderText( { field, item } );
};

export const renderText = ( { field, item } ) => {
	const value = decodeEntities( field.getValue( { item } ) );
	if ( ! value ) {
		const emptyFormat = field.formats.find(
			( format ) => format.type === 'empty'
		);
		return renderEmptyFormat( { format: emptyFormat, item, field } );
	}

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
