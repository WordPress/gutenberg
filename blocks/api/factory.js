/**
 * External dependencies
 */
import uuid from 'uuid/v4';

/**
 * Returns a block object given its type and attributes
 *
 * @param  {Object} blockType   BlockType
 * @param  {Object} attributes  Block attributes
 * @return {Object}             Block object
 */
export function createBlock( blockType, attributes = {} ) {
	return {
		uid: uuid(),
		blockType,
		attributes
	};
}
