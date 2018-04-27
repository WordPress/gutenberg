/**
 * External dependencies
 */
import uuid from 'uuid/v4';
import {
	every,
	get,
	reduce,
	includes,
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
	// the block attributes, and their inner blocks.
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

	// Compute the block that have a from transformation able to transfer blocks passed as argument.
	const blocksToBeTransformedFrom = filter(
		getBlockTypes(),
		createIsTypeTransformableFrom( sourceBlockName, isMultiBlock ),
	).map( type => type.name );

	const blockType = getBlockType( sourceBlockName );
	const transformsTo = get( blockType, 'transforms.to', [] );

	// Generate list of block transformations using the supplied "transforms to".
	const blocksToBeTransformedTo = flatMap(
		isMultiBlock ? filter( transformsTo, 'isMultiBlock' ) : transformsTo,
		transformation => transformation.blocks
	);

	// Returns a unique list of available block transformations.
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
		id: -uniqueId(), // Temporary id replaced when the block is saved server side
		isTemporary: true,
		title: __( 'Untitled block' ),
		type,
		attributes,
	};
}
