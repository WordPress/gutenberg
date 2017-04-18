/**
 * External dependencies
 */
import uuid from 'uuid/v4';
import { get } from 'lodash';

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
	const sourceSettings = getBlockSettings( block.blockType );
	const transformationsFrom = get( destinationSettings, 'transforms.from', [] );
	const transformationsTo = get( sourceSettings, 'transforms.to', [] );

	// Find the from transformation
	const transformation =
		transformationsFrom.find( t => t.blocks.indexOf( block.blockType ) !== -1 ) ||
		transformationsTo.find( t => t.blocks.indexOf( blockType ) !== -1 );

	if ( ! transformation ) {
		return null;
	}

	return Object.assign( {
		uid: block.uid,
		attributes: transformation.transform( block.attributes ),
		blockType
	} );
}
