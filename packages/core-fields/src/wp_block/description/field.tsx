import { decodeEntities } from '@wordpress/html-entities';
import type { FieldsScriptParts } from '../../types';

type Pattern = {
	excerpt?: string | { raw?: string };
};

function getPatternDescription( item: Pattern ) {
	if ( typeof item.excerpt === 'string' ) {
		return decodeEntities( item.excerpt );
	}
	return decodeEntities( item.excerpt?.raw || '' );
}

/**
 * The JavaScript parts of the pattern description field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< Pattern >[ string ] = {
	getValue: ( { item } ) => getPatternDescription( item ),
	// Renders as plain text that takes the typography of where it renders,
	// like the values of other fields.
	render: ( { item } ) => {
		const description = getPatternDescription( item );
		return description ? <span>{ description }</span> : null;
	},
};
