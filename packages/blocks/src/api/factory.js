/**
 * External dependencies
 */
import uuid from 'uuid/v4';
import {
	every,
	reduce,
	castArray,
	findIndex,
	isObjectLike,
	filter,
	first,
	flatMap,
	uniq,
	isFunction,
	isEmpty,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { createHooks, applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getBlockType, getBlockTypes } from './registration';
import { normalizeBlockType } from './utils';

/**
 * Returns a block object given its type and attributes.
 *
 * @param {string} name        Block name.
 * @param {Object} attributes  Block attributes.
 * @param {?Array} innerBlocks Nested blocks.
 *
 * @return {Object} Block object.
 */
export function createBlock( name, attributes = {}, innerBlocks = [] ) {
	// Get the type definition associated with a registered block.
	const blockType = getBlockType( name );

	// Ensure attributes contains only values defined by block type, and merge
	// default values for missing attributes.
	const sanitizedAttributes = reduce( blockType.attributes, ( result, schema, key ) => {
		const value = attributes[ key ];

		if ( undefined !== value ) {
			result[ key ] = value;
		} else if ( schema.hasOwnProperty( 'default' ) ) {
			result[ key ] = schema.default;
		}

		if ( [ 'node', 'children' ].indexOf( schema.source ) !== -1 ) {
			// Ensure value passed is always an array, which we're expecting in
			// the RichText component to handle the deprecated value.
			if ( typeof result[ key ] === 'string' ) {
				result[ key ] = [ result[ key ] ];
			} else if ( ! Array.isArray( result[ key ] ) ) {
				result[ key ] = [];
			}
		}

		return result;
	}, {} );

	const clientId = uuid();

	// Blocks are stored with a unique ID, the assigned type name, the block
	// attributes, and their inner blocks.
	return {
		clientId,
		name,
		isValid: true,
		attributes: sanitizedAttributes,
		innerBlocks,
	};
}

/**
 * Given a block object, returns a copy of the block object, optionally merging
 * new attributes and/or replacing its inner blocks.
 *
 * @param {Object} block              Block instance.
 * @param {Object} mergeAttributes    Block attributes.
 * @param {?Array} newInnerBlocks     Nested blocks.
 *
 * @return {Object} A cloned block.
 */
export function cloneBlock( block, mergeAttributes = {}, newInnerBlocks ) {
	const clientId = uuid();

	return {
		...block,
		clientId,
		attributes: {
			...block.attributes,
			...mergeAttributes,
		},
		innerBlocks: newInnerBlocks ||
			block.innerBlocks.map( ( innerBlock ) => cloneBlock( innerBlock ) ),
	};
}

/**
 * Returns a boolean indicating whether a transform is possible based on
 * various bits of context.
 *
 * @param {Object} transform The transform object to validate.
 * @param {string} direction Is this a 'from' or 'to' transform.
 * @param {Array} blocks The blocks to transform from.
 *
 * @return {boolean} Is the transform possible?
 */
const isPossibleTransformForSource = ( transform, direction, blocks ) => {
	if ( isEmpty( blocks ) ) {
		return false;
	}

	// If multiple blocks are selected, only multi block transforms
	// or wildcard transforms are allowed.
	const isMultiBlock = blocks.length > 1;
	const firstBlockName = first( blocks ).name;
	const isValidForMultiBlocks = isWildCardBlockTransform( transform ) || ! isMultiBlock || transform.isMultiBlock;
	if ( ! isValidForMultiBlocks ) {
		return false;
	}

	// Check non-wildcard transforms to ensure that transform is valid
	// for a block selection of multiple blocks of different types
	if ( ! isWildCardBlockTransform( transform ) && ! every( blocks, { name: firstBlockName } ) ) {
		return false;
	}

	// Only consider 'block' type transforms as valid.
	const isBlockType = transform.type === 'block';
	if ( ! isBlockType ) {
		return false;
	}

	// Check if the transform's block name matches the source block (or is a wildcard)
	// only if this is a transform 'from'.
	const sourceBlock = first( blocks );
	const hasMatchingName = direction !== 'from' || transform.blocks.indexOf( sourceBlock.name ) !== -1 || isWildCardBlockTransform( transform );
	if ( ! hasMatchingName ) {
		return false;
	}

	// Don't allow single 'core/group' blocks to be transformed into
	// a 'core/group' block.
	if ( ! isMultiBlock && isContainerGroupBlock( sourceBlock.name ) && isContainerGroupBlock( transform.blockName ) ) {
		return false;
	}

	// If the transform has a `isMatch` function specified, check that it returns true.
	if ( isFunction( transform.isMatch ) ) {
		const attributes = transform.isMultiBlock ? blocks.map( ( block ) => block.attributes ) : sourceBlock.attributes;
		if ( ! transform.isMatch( attributes ) ) {
			return false;
		}
	}

	return true;
};

/**
 * Returns block types that the 'blocks' can be transformed into, based on
 * 'from' transforms on other blocks.
 *
 * @param {Array}  blocks  The blocks to transform from.
 *
 * @return {Array} Block types that the blocks can be transformed into.
 */
const getBlockTypesForPossibleFromTransforms = ( blocks ) => {
	if ( isEmpty( blocks ) ) {
		return [];
	}

	const allBlockTypes = getBlockTypes();

	// filter all blocks to find those with a 'from' transform.
	const blockTypesWithPossibleFromTransforms = filter(
		allBlockTypes,
		( blockType ) => {
			const fromTransforms = getBlockTransforms( 'from', blockType.name );

			return !! findTransform(
				fromTransforms,
				( transform ) => {
					return transform && isPossibleTransformForSource( transform, 'from', blocks );
				}
			);
		},
	);

	return blockTypesWithPossibleFromTransforms;
};

/**
 * Returns block types that the 'blocks' can be transformed into, based on
 * the source block's own 'to' transforms.
 *
 * @param {Array} blocks The blocks to transform from.
 *
 * @return {Array} Block types that the source can be transformed into.
 */
const getBlockTypesForPossibleToTransforms = ( blocks ) => {
	if ( isEmpty( blocks ) ) {
		return [];
	}

	const sourceBlock = first( blocks );
	const blockType = getBlockType( sourceBlock.name );
	const transformsTo = getBlockTransforms( 'to', blockType.name );

	// filter all 'to' transforms to find those that are possible.
	const possibleTransforms = filter(
		transformsTo,
		( transform ) => {
			return transform && isPossibleTransformForSource( transform, 'to', blocks );
		}
	);

	// Build a list of block names using the possible 'to' transforms.
	const blockNames = flatMap(
		possibleTransforms,
		( transformation ) => transformation.blocks
	);

	// Map block names to block types.
	return blockNames.map( ( name ) => getBlockType( name ) );
};

/**
 * Determines whether transform is a "block" type
 * and if so whether it is a "wildcard" transform
 * ie: targets "any" block type
 *
 * @param  {Object} t Block transform object
 * @return {boolean}   whether transform is a wildcard transform
 */
const isWildCardBlockTransform = ( t ) => t && t.type === 'block' && t.blocks.length && t.blocks[ 0 ] === '*';

/**
 * Determines whether the given Block is the core Block which
 * acts as a container Block for other Blocks as part of the
 * Grouping mechanocs
 * @param  {string} name the name of the Block to test against
 * @return {boolean}      whether or not the Block is the container Block type
 */
const isContainerGroupBlock = ( name ) => name === 'core/group';

/**
 * Determines whether the provided Blocks are a multi Block selection
 * and of the same type (eg: all `core/paragraph`).
 *
 * @param  {Array}  blocksArray the Block definitions
 * @return {boolean}             whether or not the given Blocks pass the criteria
 */
const isMultiBlockSelectionOfSameType = ( blocksArray = [] ) => {
	// Is it a Multi Block selection?
	if ( ! blocksArray.length > 1 ) {
		return false;
	}
	const sourceName = blocksArray[ 0 ].name;

	return ! every( blocksArray, ( block ) => ( block.name === sourceName ) );
};

/**
 * Returns an array of block types that the set of blocks received as argument
 * can be transformed into.
 *
 * @param {Array} blocks Blocks array.
 *
 * @return {Array} Block types that the blocks argument can be transformed to.
 */
export function getPossibleBlockTransformations( blocks ) {
	if ( isEmpty( blocks ) ) {
		return [];
	}

	const blockTypesForFromTransforms = getBlockTypesForPossibleFromTransforms( blocks );
	const blockTypesForToTransforms = getBlockTypesForPossibleToTransforms( blocks );

	return uniq( [
		...blockTypesForFromTransforms,
		...blockTypesForToTransforms,
	] );
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
 * @param {string|Object} blockTypeOrName  Block type or name.
 *
 * @return {Array} Block transforms for direction.
 */
export function getBlockTransforms( direction, blockTypeOrName ) {
	// When retrieving transforms for all block types, recurse into self.
	if ( blockTypeOrName === undefined ) {
		return flatMap(
			getBlockTypes(),
			( { name } ) => getBlockTransforms( direction, name )
		);
	}

	// Validate that block type exists and has array of direction.
	const blockType = normalizeBlockType( blockTypeOrName );
	const { name: blockName, transforms } = blockType || {};
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

	// Unless it's a `core/group` Block then check
	// that all Blocks are of the same type otherwise
	// we can't run a conversion
	if ( ! isContainerGroupBlock( name ) && isMultiBlockSelectionOfSameType( blocksArray ) ) {
		return null;
	}

	// Find the right transformation by giving priority to the "to"
	// transformation.
	const transformationsFrom = getBlockTransforms( 'from', name );
	const transformationsTo = getBlockTransforms( 'to', sourceName );

	const transformation =
		findTransform(
			transformationsTo,
			( t ) => t.type === 'block' && ( ( isWildCardBlockTransform( t ) ) || t.blocks.indexOf( name ) !== -1 ) && ( ! isMultiBlock || t.isMultiBlock )
		) ||
		findTransform(
			transformationsFrom,
			( t ) => t.type === 'block' && ( ( isWildCardBlockTransform( t ) ) || t.blocks.indexOf( sourceName ) !== -1 ) && ( ! isMultiBlock || t.isMultiBlock )
		);

	// Stop if there is no valid transformation.
	if ( ! transformation ) {
		return null;
	}

	let transformationResults;

	if ( transformation.isMultiBlock ) {
		transformationResults = transformation.transform(
			blocksArray.map( ( currentBlock ) => currentBlock.attributes ),
			blocksArray.map( ( currentBlock ) => currentBlock.innerBlocks ),
			blocksArray.map( ( currentBlock ) => currentBlock.name ),
		);
	} else {
		transformationResults = transformation.transform( firstBlock.attributes, firstBlock.innerBlocks, firstBlock.name );
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
			// type gets to keep the existing client ID of the first block.
			clientId: index === firstSwitchedBlock ? firstBlock.clientId : result.clientId,
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
