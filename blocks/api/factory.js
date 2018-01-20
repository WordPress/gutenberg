/**
 * External dependencies
 */
import uuid from 'uuid/v4';
import {
	every,
	get,
	reduce,
	castArray,
	findIndex,
	includes,
	isObjectLike,
	filter,
	find,
	first,
	flatMap,
	uniqueId,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getBlockType, getBlockTypes } from './registration';

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
	// and the block attributes.
	return {
		uid: uuid(),
		name,
		isValid: true,
		attributes,
		innerBlocks,
	};
}

/**
 * Given a block object, returns a copy of the block object, optionally merging
 * new attributes and/or replacing its inner blocks.
 *
 * @param {Object} block           Block object.
 * @param {Object} mergeAttributes Block attributes.
 * @param {?Array} innerBlocks     Nested blocks.
 *
 * @return {Object} A cloned block.
 */
export function cloneBlock( block, mergeAttributes = {}, innerBlocks = block.innerBlocks ) {
	return {
		...block,
		uid: uuid(),
		attributes: {
			...block.attributes,
			...mergeAttributes,
		},
		innerBlocks,
	};
}

/**
 * Returns a predicate that receives a transformation and returns true if the
 * given transformation is able to execute in the situation specified in the
 * params.
 *
 * @param {string}  sourceName   Block name.
 * @param {boolean} isMultiBlock Array of possible block transformations.
 *
 * @return {Function} Predicate that receives a block type.
 */
const isTransformForBlockSource = ( sourceName, isMultiBlock = false ) => ( transform ) => (
	transform.type === 'block' &&
	transform.blocks.indexOf( sourceName ) !== -1 &&
	( ! isMultiBlock || transform.isMultiBlock )
);

/**
 * Returns a predicate that receives a block type and returns true if the given
 * block type contains a transformation able to execute in the situation
 * specified in the params.
 *
 * @param {string}  sourceName   Block name.
 * @param {boolean} isMultiBlock Array of possible block transformations.
 *
 * @return {Function} Predicate that receives a block type.
 */
const createIsTypeTransformableFrom = ( sourceName, isMultiBlock = false ) => ( type ) => (
	!! find(
		get( type, 'transforms.from', [] ),
		isTransformForBlockSource( sourceName, isMultiBlock ),
	)
);

/**
 * Returns an array of possible block transformations that could happen on the
 * set of blocks received as argument.
 *
 * @param {Array} blocks Blocks array.
 *
 * @return {Array} Array of possible block transformations.
 */
export function getPossibleBlockTransformations( blocks ) {
	const sourceBlock = first( blocks );
	if ( ! blocks || ! sourceBlock ) {
		return [];
	}
	const isMultiBlock = blocks.length > 1;
	const sourceBlockName = sourceBlock.name;

	if ( isMultiBlock && ! every( blocks, { name: sourceBlockName } ) ) {
		return [];
	}

	//compute the block that have a from transformation able to transfer blocks passed as argument.
	const blocksToBeTransformedFrom = filter(
		getBlockTypes(),
		createIsTypeTransformableFrom( sourceBlockName, isMultiBlock ),
	).map( type => type.name );

	const blockType = getBlockType( sourceBlockName );
	const transformsTo = get( blockType, 'transforms.to', [] );

	//computes a list of blocks that source block can be transformed into using the "to transformations" implemented in it.
	const blocksToBeTransformedTo = flatMap(
		isMultiBlock ? filter( transformsTo, 'isMultiBlock' ) : transformsTo,
		transformation => transformation.blocks
	);

	//returns a unique list of blocks that blocks passed as argument can transform into
	return reduce( [
		...blocksToBeTransformedFrom,
		...blocksToBeTransformedTo,
	], ( result, name ) => {
		const transformBlockType = getBlockType( name );
		if ( transformBlockType && ! includes( result, transformBlockType ) ) {
			result.push( transformBlockType );
		}
		return result;
	}, [] );
}

/**
 * Switch one or more blocks into one or more blocks of the new block type.
 *
 * @param {Array|Object} blocks Blocks array or block object.
 * @param {string}       name   Block name.
 *
 * @return {Array} Array of blocks.
 */
export function switchToBlockType( blocks, name ) {
	const blocksArray = castArray( blocks );
	const isMultiBlock = blocksArray.length > 1;
	const firstBlock = blocksArray[ 0 ];
	const sourceName = firstBlock.name;

	if ( isMultiBlock && ! every( blocksArray, ( block ) => ( block.name === sourceName ) ) ) {
		return null;
	}

	// Find the right transformation by giving priority to the "to"
	// transformation.
	const destinationType = getBlockType( name );
	const sourceType = getBlockType( sourceName );
	const transformationsFrom = get( destinationType, 'transforms.from', [] );
	const transformationsTo = get( sourceType, 'transforms.to', [] );
	const transformation =
		find(
			transformationsTo,
			t => t.type === 'block' && t.blocks.indexOf( name ) !== -1 && ( ! isMultiBlock || t.isMultiBlock )
		) ||
		find(
			transformationsFrom,
			t => t.type === 'block' && t.blocks.indexOf( sourceName ) !== -1 && ( ! isMultiBlock || t.isMultiBlock )
		);

	// Stop if there is no valid transformation. (How did we get here?)
	if ( ! transformation ) {
		return null;
	}

	let transformationResults;
	if ( transformation.isMultiBlock ) {
		transformationResults = transformation.transform( blocksArray.map( ( currentBlock ) => currentBlock.attributes ) );
	} else {
		transformationResults = transformation.transform( firstBlock.attributes );
	}

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
		// type gets to keep the existing UID of the first block.
		uid: index === firstSwitchedBlock ? firstBlock.uid : result.uid,
	} ) );
}

/**
 * Creates a new reusable block.
 *
 * @param {string} type       The type of the block referenced by the reusable
 *                            block.
 * @param {Object} attributes The attributes of the block referenced by the
 *                            reusable block.
 *
 * @return {Object} A reusable block object.
 */
export function createReusableBlock( type, attributes ) {
	return {
		id: -uniqueId(), // Temorary id replaced when the block is saved server side
		isTemporary: true,
		title: __( 'Untitled block' ),
		type,
		attributes,
	};
}
