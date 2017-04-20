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
 * @return {?Object|Error}     Block object, null, or error with failure message
 */
export function switchToBlockType( block, blockType ) {
	// Find the right transformation by giving priority to the "to" transformation
	const destinationSettings = getBlockSettings( blockType );
	const sourceSettings = getBlockSettings( block.blockType );
	const transformationsFrom = get( destinationSettings, 'transforms.from', [] );
	const transformationsTo = get( sourceSettings, 'transforms.to', [] );
	const transformation =
		transformationsTo.find( t => t.blocks.indexOf( blockType ) !== -1 ) ||
		transformationsFrom.find( t => t.blocks.indexOf( block.blockType ) !== -1 );

	if ( ! transformation ) {
		return null;
	}

	const attributes = transformation.transform( block.attributes );
	if ( attributes instanceof Error ) {
		// Blocks can perform validation and cancel transformations if needed.
		return attributes;
	}

	return Object.assign( {
		uid: block.uid,
		attributes,
		blockType,
	} );
}
