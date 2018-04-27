/**
 * External dependencies
 */
import uuid from 'uuid/v4';
import {
	reduce,
} from 'lodash';

/**
 * Internal dependencies
 */
import { getBlockType } from './registration';

/**
 * Returns a block object given its type and attributes.
 *
 * @param {string} name            Block name.
 * @param {Object} blockAttributes Block attributes.
 * @param {?Array} innerBlocks     Nested blocks.
 *
 * @return {Object} Block object.
 */
export function createBlock( name, blockAttributes = {}, innerBlocks = [] ) {
	// Get the type definition associated with a registered block.
	const blockType = getBlockType( name );

	// Ensure attributes contains only values defined by block type, and merge
	// default values for missing attributes.
	const attributes = reduce( blockType.attributes, ( result, source, key ) => {
		const value = blockAttributes[ key ];
		if ( undefined !== value ) {
			result[ key ] = value;
		} else if ( source.hasOwnProperty( 'default' ) ) {
			result[ key ] = source.default;
		}

		return result;
	}, {} );

	// Blocks are stored with a unique ID, the assigned type name,
	// the block attributes, and their inner blocks.
	return {
		uid: uuid(),
		name,
		isValid: true,
		attributes,
		innerBlocks,
	};
}
