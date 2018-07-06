/**
 * External dependencies
 */
import uuid from 'uuid/v4';
import {
	every,
	reduce,
	castArray,
	findIndex,
	includes,
	isObjectLike,
	filter,
	first,
	flatMap,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { createHooks, applyFilters } from '@wordpress/hooks';

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
 * @param {Object} block              Block object.
 * @param {Object} mergeAttributes    Block attributes.
 * @param {?Array} newInnerBlocks     Nested blocks.
 *
 * @return {Object} A cloned block.
 */
export function cloneBlock( block, mergeAttributes = {}, newInnerBlocks ) {
	return {
		...block,
		uid: uuid(),
		attributes: {
			...block.attributes,
			...mergeAttributes,
		},
		innerBlocks: newInnerBlocks ||
			block.innerBlocks.map( ( innerBlock ) => cloneBlock( innerBlock ) ),
	};
}

/**
 * Returns a boolean indicating whether a transform is valid
 *
 * @param {Object} transform the transform object to validate
 * @param {string} direction is this a 'from' or 'to' transform
 * @param {Object} sourceBlock the name of the source block
 * @param {boolean} isMultiBlock have multiple blocks been selected?
 *
 * @return {boolean} Is the transform valid?
 */
const isValidTransformForSource = ( transform, direction, sourceBlock, isMultiBlock ) => {
	// If multiple blocks are selected, only multi block transforms are valid
	const isValidForMultiBlocks = ! isMultiBlock || transform.isMultiBlock;
	if ( ! isValidForMultiBlocks ) {
		return false;
	}

	// Only consider transforms from and to blocks as valid
	const isValidType = transform.type === 'block';
	if ( ! isValidType ) {
		return false;
	}

	// Check is the transform's block name matches the source block only if this is a transform 'from'
	const isValidForSourceName = direction !== 'from' || transform.blocks.indexOf( sourceBlock.name ) !== -1;
	if ( ! isValidForSourceName ) {
		return false;
	}

	// If the transform has a `canTransform` function specified, check that it returns true
	const canTransform = ! transform.canTransform || !! transform.canTransform( sourceBlock.attributes );
	if ( ! canTransform ) {
		return false;
	}

	return true;
};

/**
 * Returns the names of the blocks that the source block can be transformed
 * into, based on 'from' transforms on other blocks.
 *
 * @param {Object}  sourceBlock  Source block.
 * @param {boolean} isMultiBlock Array of possible block transformations.
 *
 * @return {Array} An array of block names
 */
const getValidFromTransformsForSource = ( sourceBlock, isMultiBlock = false ) => {
	const allBlockTypes = getBlockTypes();

	// filter all blocks to find those with a valid 'from' transform
	const blocksWithValidFromTransforms = filter(
		allBlockTypes,
		( blockType ) => {
			const fromTransforms = getBlockTransforms( 'from', blockType.name );

			return !! findTransform(
				fromTransforms,
				( transform ) => isValidTransformForSource( transform, 'from', sourceBlock, isMultiBlock )
			);
		},
	);

	return blocksWithValidFromTransforms.map( ( type ) => type.name );
};

/**
 * Returns the names of blocks that the source block can be transformed
 * into, based on its own 'to' transforms
 *
 * @param {Object} sourceBlock The instance of the source block
 * @param {boolean} isMultiBlock Have multiple blocks been selected?
 *
 * @return {Array} An array of block names
 */
const getValidToTransformsForSource = ( sourceBlock, isMultiBlock = false ) => {
	const blockType = getBlockType( sourceBlock.name );
	const transformsTo = getBlockTransforms( 'to', blockType.name );

	// filter all 'to' transforms to find those that are valid
	const validTransformsTo = filter(
		transformsTo,
		( transform ) => isValidTransformForSource( transform, 'to', sourceBlock, isMultiBlock )
	);

	// Build a list of block names using the valid 'to' transforms
	return flatMap(
		validTransformsTo,
		( transformation ) => transformation.blocks
	);
};

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
	if ( isMultiBlock && ! every( blocks, { name: sourceBlock.name } ) ) {
		return [];
	}

	const blocksToBeTransformedFrom = getValidFromTransformsForSource( sourceBlock, isMultiBlock );
	const blocksToBeTransformedTo = getValidToTransformsForSource( sourceBlock, isMultiBlock );

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
 * Given an array of transforms, returns the highest-priority transform where
 * the predicate function returns a truthy value. A higher-priority transform
 * is one with a lower priority value (i.e. first in priority order). Returns
 * null if the transforms set is empty or the predicate function returns a
 * falsey value for all entries.
 *
 * @param {Object[]} transforms Transforms to search.
 * @param {Function} predicate  Function returning true on matching transform.
 *
 * @return {?Object} Highest-priority transform candidate.
 */
export function findTransform( transforms, predicate ) {
	// The hooks library already has built-in mechanisms for managing priority
	// queue, so leverage via locally-defined instance.
	const hooks = createHooks();

	for ( let i = 0; i < transforms.length; i++ ) {
		const candidate = transforms[ i ];
		if ( predicate( candidate ) ) {
			hooks.addFilter(
				'transform',
				'transform/' + i.toString(),
				( result ) => result ? result : candidate,
				candidate.priority
			);
		}
	}

	// Filter name is arbitrarily chosen but consistent with above aggregation.
	return hooks.applyFilters( 'transform', null );
}

/**
 * Returns normal block transforms for a given transform direction, optionally
 * for a specific block by name, or an empty array if there are no transforms.
 * If no block name is provided, returns transforms for all blocks. A normal
 * transform object includes `blockName` as a property.
 *
 * @param {string}  direction Transform direction ("to", "from").
 * @param {?string} blockName Optional block name.
 *
 * @return {Array} Block transforms for direction.
 */
export function getBlockTransforms( direction, blockName ) {
	// When retrieving transforms for all block types, recurse into self.
	if ( blockName === undefined ) {
		return flatMap(
			getBlockTypes(),
			( { name } ) => getBlockTransforms( direction, name )
		);
	}

	// Validate that block type exists and has array of direction.
	const { transforms } = getBlockType( blockName ) || {};
	if ( ! transforms || ! Array.isArray( transforms[ direction ] ) ) {
		return [];
	}

	// Map transforms to normal form.
	return transforms[ direction ].map( ( transform ) => ( {
		...transform,
		blockName,
	} ) );
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
	const transformationsFrom = getBlockTransforms( 'from', name );
	const transformationsTo = getBlockTransforms( 'to', sourceName );
	const transformation =
		findTransform(
			transformationsTo,
			( t ) => t.type === 'block' && t.blocks.indexOf( name ) !== -1 && ( ! isMultiBlock || t.isMultiBlock )
		) ||
		findTransform(
			transformationsFrom,
			( t ) => t.type === 'block' && t.blocks.indexOf( sourceName ) !== -1 && ( ! isMultiBlock || t.isMultiBlock )
		);

	// Stop if there is no valid transformation.
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

	return transformationResults.map( ( result, index ) => {
		const transformedBlock = {
			...result,
			// The first transformed block whose type matches the "destination"
			// type gets to keep the existing UID of the first block.
			uid: index === firstSwitchedBlock ? firstBlock.uid : result.uid,
		};

		/**
		 * Filters an individual transform result from block transformation.
		 * All of the original blocks are passed, since transformations are
		 * many-to-many, not one-to-one.
		 *
		 * @param {Object}   transformedBlock The transformed block.
		 * @param {Object[]} blocks           Original blocks transformed.
		 */
		return applyFilters( 'blocks.switchToBlockType.transformedBlock', transformedBlock, blocks );
	} );
}
