/**
 * External dependencies
 */
import { every, keys, isEqual } from 'lodash';

/**
 * Internal dependencies
 */
import { getDefaultBlockName } from './registration';
import { createBlock } from './factory';

/**
 * Determines whether the block is a default block
 * and its attributes are equal to the default attributes
 * which means the block is untouched.
 *
 * @param  {WPBlock} block Block Object
 *
 * @return {boolean}       Whether the block is an untouched default block
 */
export function isUntouchedDefaultBlock( block ) {
	const newDefaultBlock = createBlock( getDefaultBlockName() );
	const attributeKeys = {
		...keys( newDefaultBlock.attributes ),
		...keys( block.attributes ),
	};

	return (
		block.name === newDefaultBlock.name &&
		every( attributeKeys, ( key ) => isEqual( newDefaultBlock.attributes[ key ], block.attributes[ key ] ) )
	);
}
