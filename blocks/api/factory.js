/**
 * External dependencies
 */
import uuid from 'uuid/v4';
import {
	get,
	reduce,
	castArray,
	findIndex,
	isObjectLike,
	find,
} from 'lodash';

/**
 * Internal dependencies
 */
import { getBlockType } from './registration';

/**
 * Returns a block object given its type and attributes.
 *
 * @param  {String} name        Block name
 * @param  {Object} attributes  Block attributes
 * @return {Object}             Block object
 */
export function createBlock( name, attributes = {} ) {
	// Get the type definition associated with a registered block.
	const blockType = getBlockType( name );

	// Ensure attributes contains only values defined by block type, and merge
	// default values for missing attributes.
	attributes = reduce( blockType.attributes, ( result, source, key ) => {
		const value = attributes[ key ];
		if ( undefined !== value ) {
			result[ key ] = value;
		} else if ( source.default ) {
			result[ key ] = source.default;
		}

		return result;
	}, {} );

	// Blocks are stored with a unique ID, the assigned type name,
	// and the block attributes.
	return {
		uid: uuid(),
		name,
		isValid: true,
		attributes,
	};
}

/**
 * Switch a block into one or more blocks of the new block type.
 *
 * @param  {Object} block      Block object
 * @param  {string} name       Block name
 * @return {Array}             Block object
 */
export function switchToBlockType( block, name ) {
	// Find the right transformation by giving priority to the "to"
	// transformation.
	const destinationType = getBlockType( name );
	const sourceType = getBlockType( block.name );
	const transformationsFrom = get( destinationType, 'transforms.from', [] );
	const transformationsTo = get( sourceType, 'transforms.to', [] );
	const transformation =
		find( transformationsTo, t => t.blocks.indexOf( name ) !== -1 ) ||
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

	// Ensure that every block object returned by the transformation has a
	// valid block type.
	if ( transformationResults.some( ( result ) => ! getBlockType( result.name ) ) ) {
		return null;
	}

	const firstSwitchedBlock = findIndex( transformationResults, ( result ) => result.name === name );

	// Ensure that at least one block object returned by the transformation has
	// the expected "destination" block type.
	if ( firstSwitchedBlock < 0 ) {
		return null;
	}

	return transformationResults.map( ( result, index ) => ( {
		...result,
		// The first transformed block whose type matches the "destination"
		// type gets to keep the existing block's UID.
		uid: index === firstSwitchedBlock ? block.uid : result.uid,
	} ) );
}
