/**
 * External dependencies
 */
import uuid from 'uuid/v4';
import { get, castArray, findIndex, isObjectLike, find } from 'lodash';

/**
 * Returns a block object given its type and attributes.
 *
 * @param  {String} blockType   Block type
 * @param  {Object} attributes  Block attributes
 * @return {Object}             Block object
 */
export function createBlock( blockType, attributes = {} ) {
	// Do we need this? What purpose does it have?
	const defaultAttributes = blockType.defaultAttributes;

	// Blocks are stored with a unique ID, the assigned type name,
	// and the block attributes.
	return {
		uid: uuid(),
		name: blockType.name,
		isValid: true,
		attributes: {
			...defaultAttributes,
			...attributes,
		},
	};
}

/**
 * Switch a block into one or more blocks of the new block type.
 *
 * @param  {Object} block           Block object
 * @param  {string} sourceType      Source Block type
 * @param  {string} destinationType Destination Block type
 * @return {Array}                  Block object
 */
export function switchToBlockType( block, sourceType, destinationType ) {
	// Find the right transformation by giving priority to the "to"
	// transformation.
	const transformationsFrom = get( destinationType, 'transforms.from', [] );
	const transformationsTo = get( sourceType, 'transforms.to', [] );
	const transformation =
		find( transformationsTo, t => t.blocks.indexOf( destinationType.name ) !== -1 ) ||
		find( transformationsFrom, t => t.blocks.indexOf( block.name ) !== -1 );

	// Stop if there is no valid transformation. (How did we get here?)
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

	const firstSwitchedBlock = findIndex( transformationResults, ( result ) => result.name === destinationType.name );

	// Ensure that at least one block object returned by the transformation has
	// the expected "destination" block type.
	if ( firstSwitchedBlock < 0 ) {
		return null;
	}

	return transformationResults.map( ( result, index ) => {
		return {
			// The first transformed block whose type matches the "destination"
			// type gets to keep the existing block's UID.
			uid: index === firstSwitchedBlock ? block.uid : result.uid,
			name: result.name,
			attributes: result.attributes,
		};
	} );
}
