/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { select } from '@wordpress/data';

const editor = select( 'core/editor' );

/**
 * Filters an attribute value during parse to inject post properties from meta.
 *
 * @param {*}      value  Parsed value.
 * @param {Object} schema Attribute schema.
 *
 * @return {*} Filtered value with meta substitute if applicable.
 */
function getMetaAttributeFromPost( value, schema ) {
	if ( schema.source === 'meta' ) {
		const meta = editor.getCurrentPost().meta;
		if ( meta && meta.hasOwnProperty( schema.meta ) ) {
			return meta[ schema.meta ];
		}
	}

	return value;
}

addFilter( 'blocks.getBlockAttribute', 'core/edit-post/meta/getMetaAttributeFromPost', getMetaAttributeFromPost );
