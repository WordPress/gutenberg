/**
 * WordPress dependencies
 */
import { RichTextData } from '@wordpress/rich-text';

/**
 * A robust way to retain selection position through various
 * transforms is to insert a special character at the position and
 * then recover it.
 */
export const START_OF_SELECTED_AREA = '\u0086';

/**
 * Retrieve the block attribute that contains the selection position.
 *
 * @param {Object} blockAttributes Block attributes.
 * @return {string|void} The name of the block attribute that was previously selected.
 */
export function retrieveSelectedAttribute( blockAttributes ) {
	if ( ! blockAttributes ) {
		return;
	}

	return Object.keys( blockAttributes ).find( ( name ) => {
		const value = blockAttributes[ name ];
		return (
			( typeof value === 'string' || value instanceof RichTextData ) &&
			// To do: refactor this to use rich text's selection instead, so we
			// no longer have to use on this hack inserting a special character.
			value.toString().indexOf( START_OF_SELECTED_AREA ) !== -1
		);
	} );
}

export function findRichTextAttributeKey( blockType ) {
	for ( const [ key, value ] of Object.entries( blockType.attributes ) ) {
		if ( value.source === 'rich-text' || value.source === 'html' ) {
			return key;
		}
	}
}
