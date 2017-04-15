/**
 * External dependencies
 */
import uuid from 'uuid/v4';

/**
 * Internal dependencies
 */
import { getBlockSettings } from './registration';

/**
 * Returns a block object given its type and attributes
 *
 * @param  {String} blockType   BlockType
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

/**
 * Switch Block Type and returns the updated block
 *
 * @param  {Object} block      Block object
 * @param  {string} blockType  BlockType
 * @return {Object?}           Block object
 */
export function switchToBlockType( block, blockType ) {
	const destinationSettings = getBlockSettings( blockType );
	const transformation = destinationSettings.transformations
		.find( t => t.blocks.indexOf( block.blockType ) !== -1 );
	if ( ! transformation ) {
		return null;
	}

	return Object.assign( {
		uid: block.uid,
		attributes: transformation.transform( block.attributes ),
		blockType
	} );
}
