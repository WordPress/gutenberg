import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { decodeEntities } from '@wordpress/html-entities';
import { Text } from '@wordpress/ui';

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
	render: ( { item } ) => {
		const description = getPatternDescription( item );
		return description ? <Text>{ description }</Text> : null;
	},
};
