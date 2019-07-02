/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import { editPost } from '../actions';

/**
 * Store control which, given an array of blocks, modifies block entries which
 * source from meta properties to assign the attribute values.
 *
 * @param {WPBlock[]} blocks Blocks array.
 *
 * @yield  {Object}    Yielded action objects or store controls.
 * @return {WPBlock[]} Modified blocks array.
 */
export function* applyAll( blocks ) {
	const meta = yield select( 'core/editor', 'getEditedPostAttribute', 'meta' );

	for ( let i = 0; i < blocks.length; i++ ) {
		const block = blocks[ i ];
		const blockType = yield select( 'core/blocks', 'getBlockType', block.name );
		for ( const [ attributeName, schema ] of Object.entries( blockType.attributes ) ) {
			if ( schema.source === 'meta' ) {
				blocks[ i ].attributes[ attributeName ] = meta[ schema.meta ];
			}
		}
	}

	return blocks;
}

/**
 * Store control invoked upon a block attributes update, responsible for
 * reflecting an update in a meta value.
 *
 * @param {Object} schema Block type attribute schema.
 * @param {*}      value  Updated block attribute value.
 *
 * @yield {Object} Yielded action objects or store controls.
 */
export function* update( schema, value ) {
	yield editPost( {
		meta: {
			[ schema.meta ]: value,
		},
	} );
}
