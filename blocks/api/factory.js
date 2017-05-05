/**
 * External dependencies
 */
import uuid from 'uuid/v4';
import { get, castArray, findIndex, isObjectLike } from 'lodash';

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
	const blockSettings = getBlockSettings( blockType );

	let defaultAttributes;
	if ( blockSettings ) {
		defaultAttributes = blockSettings.defaultAttributes;
	}

	return {
		uid: uuid(),
		blockType,
		attributes: {
			...defaultAttributes,
			...attributes
		}
	};
}

/**
 * Switch a block into one or more blocks of the new block type
 *
 * @param  {Object} block      Block object
 * @param  {string} blockType  BlockType
 * @return {Array}             Block object
 */
export function switchToBlockType( block, blockType ) {
	// Find the right transformation by giving priority to the "to"
	// transformation.
	const destinationSettings = getBlockSettings( blockType );
	const sourceSettings = getBlockSettings( block.blockType );
	const transformationsFrom = get( destinationSettings, 'transforms.from', [] );
	const transformationsTo = get( sourceSettings, 'transforms.to', [] );
	const transformation =
		transformationsTo.find( t => t.blocks.indexOf( blockType ) !== -1 ) ||
		transformationsFrom.find( t => t.blocks.indexOf( block.blockType ) !== -1 );

	// If no valid transformation, stop.  (How did we get here?)
	if ( ! transformation ) {
		return null;
	}

	let transformationResults = transformation.transform( block.attributes );

	// Ensure that the transformation function returned an object or an array
	// of objects.
	if ( ! isObjectLike( transformationResults ) ) {
		return null;
	}

	// If the transformation function returned a single object, we want to work
	// with an array instead.
	transformationResults = castArray( transformationResults );

	// Ensure that every block object returned by the transformation has a
	// valid block type.
	if ( transformationResults.some( ( result ) => ! getBlockSettings( result.blockType ) ) ) {
		return null;
	}

	const firstSwitchedBlock = findIndex( transformationResults, ( result ) => result.blockType === blockType );

	// Ensure that at least one block object returned by the transformation has
	// the expected "destination" block type.
	if ( firstSwitchedBlock < 0 ) {
		return null;
	}

	return transformationResults.map( ( result, index ) => {
		return {
			// The first transformed block whose type matches the "destination"
			// type gets to keep the existing block's UID.
			uid: index === firstSwitchedBlock ? block.uid : uuid(),
			blockType: result.blockType,
			attributes: result.attributes
		};
	} );
}
