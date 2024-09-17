/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { createHooks, applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	getBlockType,
	getBlockTypes,
	getGroupingBlockName,
} from './registration';
import {
	normalizeBlockType,
	__experimentalSanitizeBlockAttributes,
} from './utils';

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
	const sanitizedAttributes = __experimentalSanitizeBlockAttributes(
		name,
		attributes
	);

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
 * Given an array of InnerBlocks templates or Block Objects,
 * returns an array of created Blocks from them.
 * It handles the case of having InnerBlocks as Blocks by
 * converting them to the proper format to continue recursively.
 *
 * @param {Array} innerBlocksOrTemplate Nested blocks or InnerBlocks templates.
 *
 * @return {Object[]} Array of Block objects.
 */
export function createBlocksFromInnerBlocksTemplate(
	innerBlocksOrTemplate = []
) {
	return innerBlocksOrTemplate.map( ( innerBlock ) => {
		const innerBlockTemplate = Array.isArray( innerBlock )
			? innerBlock
			: [
					innerBlock.name,
					innerBlock.attributes,
					innerBlock.innerBlocks,
			  ];
		const [ name, attributes, innerBlocks = [] ] = innerBlockTemplate;
		return createBlock(
			name,
			attributes,
			createBlocksFromInnerBlocksTemplate( innerBlocks )
		);
	} );
}

/**
 * Given a block object, returns a copy of the block object while sanitizing its attributes,
 * optionally merging new attributes and/or replacing its inner blocks.
 *
 * @param {Object} block           Block instance.
 * @param {Object} mergeAttributes Block attributes.
 * @param {?Array} newInnerBlocks  Nested blocks.
 *
 * @return {Object} A cloned block.
 */
export function __experimentalCloneSanitizedBlock(
	block,
	mergeAttributes = {},
	newInnerBlocks
) {
	const clientId = uuid();

	const sanitizedAttributes = __experimentalSanitizeBlockAttributes(
		block.name,
		{
			...block.attributes,
			...mergeAttributes,
		}
	);

	return {
		...block,
		clientId,
		attributes: sanitizedAttributes,
		innerBlocks:
			newInnerBlocks ||
			block.innerBlocks.map( ( innerBlock ) =>
				__experimentalCloneSanitizedBlock( innerBlock )
			),
	};
}

/**
 * Given a block object, returns a copy of the block object,
 * optionally merging new attributes and/or replacing its inner blocks.
 *
 * @param {Object} block           Block instance.
 * @param {Object} mergeAttributes Block attributes.
 * @param {?Array} newInnerBlocks  Nested blocks.
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
		innerBlocks:
			newInnerBlocks ||
			block.innerBlocks.map( ( innerBlock ) => cloneBlock( innerBlock ) ),
	};
}

/**
 * Returns a boolean indicating whether a transform is possible based on
 * various bits of context.
 *
 * @param {Object} transform The transform object to validate.
 * @param {string} direction Is this a 'from' or 'to' transform.
 * @param {Array}  blocks    The blocks to transform from.
 *
 * @return {boolean} Is the transform possible?
 */
const isPossibleTransformForSource = ( transform, direction, blocks ) => {
	if ( ! blocks.length ) {
		return false;
	}

	// If multiple blocks are selected, only multi block transforms
	// or wildcard transforms are allowed.
	const isMultiBlock = blocks.length > 1;
	const firstBlockName = blocks[ 0 ].name;
	const isValidForMultiBlocks =
		isWildcardBlockTransform( transform ) ||
		! isMultiBlock ||
		transform.isMultiBlock;
	if ( ! isValidForMultiBlocks ) {
		return false;
	}

	// Check non-wildcard transforms to ensure that transform is valid
	// for a block selection of multiple blocks of different types.
	if (
		! isWildcardBlockTransform( transform ) &&
		! blocks.every( ( block ) => block.name === firstBlockName )
	) {
		return false;
	}

	// Only consider 'block' type transforms as valid.
	const isBlockType = transform.type === 'block';
	if ( ! isBlockType ) {
		return false;
	}

	// Check if the transform's block name matches the source block (or is a wildcard)
	// only if this is a transform 'from'.
	const sourceBlock = blocks[ 0 ];
	const hasMatchingName =
		direction !== 'from' ||
		transform.blocks.indexOf( sourceBlock.name ) !== -1 ||
		isWildcardBlockTransform( transform );
	if ( ! hasMatchingName ) {
		return false;
	}

	// Don't allow single Grouping blocks to be transformed into
	// a Grouping block.
	if (
		! isMultiBlock &&
		direction === 'from' &&
		isContainerGroupBlock( sourceBlock.name ) &&
		isContainerGroupBlock( transform.blockName )
	) {
		return false;
	}

	// If the transform has a `isMatch` function specified, check that it returns true.
	if ( ! maybeCheckTransformIsMatch( transform, blocks ) ) {
		return false;
	}

	return true;
};

/**
 * Returns block types that the 'blocks' can be transformed into, based on
 * 'from' transforms on other blocks.
 *
 * @param {Array} blocks The blocks to transform from.
 *
 * @return {Array} Block types that the blocks can be transformed into.
 */
const getBlockTypesForPossibleFromTransforms = ( blocks ) => {
	if ( ! blocks.length ) {
		return [];
	}

	const allBlockTypes = getBlockTypes();

	// filter all blocks to find those with a 'from' transform.
	const blockTypesWithPossibleFromTransforms = allBlockTypes.filter(
		( blockType ) => {
			const fromTransforms = getBlockTransforms( 'from', blockType.name );
			return !! findTransform( fromTransforms, ( transform ) => {
				return isPossibleTransformForSource(
					transform,
					'from',
					blocks
				);
			} );
		}
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
	if ( ! blocks.length ) {
		return [];
	}

	const sourceBlock = blocks[ 0 ];
	const blockType = getBlockType( sourceBlock.name );
	const transformsTo = blockType
		? getBlockTransforms( 'to', blockType.name )
		: [];

	// filter all 'to' transforms to find those that are possible.
	const possibleTransforms = transformsTo.filter( ( transform ) => {
		return (
			transform && isPossibleTransformForSource( transform, 'to', blocks )
		);
	} );

	// Build a list of block names using the possible 'to' transforms.
	const blockNames = possibleTransforms
		.map( ( transformation ) => transformation.blocks )
		.flat();

	// Map block names to block types.
	return blockNames.map( getBlockType );
};

/**
 * Determines whether transform is a "block" type
 * and if so whether it is a "wildcard" transform
 * ie: targets "any" block type
 *
 * @param {Object} t the Block transform object
 *
 * @return {boolean} whether transform is a wildcard transform
 */
export const isWildcardBlockTransform = ( t ) =>
	t &&
	t.type === 'block' &&
	Array.isArray( t.blocks ) &&
	t.blocks.includes( '*' );

/**
 * Determines whether the given Block is the core Block which
 * acts as a container Block for other Blocks as part of the
 * Grouping mechanics
 *
 * @param {string} name the name of the Block to test against
 *
 * @return {boolean} whether or not the Block is the container Block type
 */
export const isContainerGroupBlock = ( name ) =>
	name === getGroupingBlockName();

/**
 * Returns an array of block types that the set of blocks received as argument
 * can be transformed into.
 *
 * @param {Array} blocks Blocks array.
 *
 * @return {Array} Block types that the blocks argument can be transformed to.
 */
export function getPossibleBlockTransformations( blocks ) {
	if ( ! blocks.length ) {
		return [];
	}

	const blockTypesForFromTransforms =
		getBlockTypesForPossibleFromTransforms( blocks );
	const blockTypesForToTransforms =
		getBlockTypesForPossibleToTransforms( blocks );

	return [
		...new Set( [
			...blockTypesForFromTransforms,
			...blockTypesForToTransforms,
		] ),
	];
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
				( result ) => ( result ? result : candidate ),
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
 * @param {string}        direction       Transform direction ("to", "from").
 * @param {string|Object} blockTypeOrName Block type or name.
 *
 * @return {Array} Block transforms for direction.
 */
export function getBlockTransforms( direction, blockTypeOrName ) {
	// When retrieving transforms for all block types, recurse into self.
	if ( blockTypeOrName === undefined ) {
		return getBlockTypes()
			.map( ( { name } ) => getBlockTransforms( direction, name ) )
			.flat();
	}

	// Validate that block type exists and has array of direction.
	const blockType = normalizeBlockType( blockTypeOrName );
	const { name: blockName, transforms } = blockType || {};
	if ( ! transforms || ! Array.isArray( transforms[ direction ] ) ) {
		return [];
	}

	const usingMobileTransformations =
		transforms.supportedMobileTransforms &&
		Array.isArray( transforms.supportedMobileTransforms );
	const filteredTransforms = usingMobileTransformations
		? transforms[ direction ].filter( ( t ) => {
				if ( t.type === 'raw' ) {
					return true;
				}

				if ( t.type === 'prefix' ) {
					return true;
				}

				if ( ! t.blocks || ! t.blocks.length ) {
					return false;
				}

				if ( isWildcardBlockTransform( t ) ) {
					return true;
				}

				return t.blocks.every( ( transformBlockName ) =>
					transforms.supportedMobileTransforms.includes(
						transformBlockName
					)
				);
		  } )
		: transforms[ direction ];

	// Map transforms to normal form.
	return filteredTransforms.map( ( transform ) => ( {
		...transform,
		blockName,
		usingMobileTransformations,
	} ) );
}

/**
 * Checks that a given transforms isMatch method passes for given source blocks.
 *
 * @param {Object} transform A transform object.
 * @param {Array}  blocks    Blocks array.
 *
 * @return {boolean} True if given blocks are a match for the transform.
 */
function maybeCheckTransformIsMatch( transform, blocks ) {
	if ( typeof transform.isMatch !== 'function' ) {
		return true;
	}
	const sourceBlock = blocks[ 0 ];
	const attributes = transform.isMultiBlock
		? blocks.map( ( block ) => block.attributes )
		: sourceBlock.attributes;
	const block = transform.isMultiBlock ? blocks : sourceBlock;

	return transform.isMatch( attributes, block );
}

/**
 * Switch one or more blocks into one or more blocks of the new block type.
 *
 * @param {Array|Object} blocks Blocks array or block object.
 * @param {string}       name   Block name.
 *
 * @return {?Array} Array of blocks or null.
 */
export function switchToBlockType( blocks, name ) {
	const blocksArray = Array.isArray( blocks ) ? blocks : [ blocks ];
	const isMultiBlock = blocksArray.length > 1;
	const firstBlock = blocksArray[ 0 ];
	const sourceName = firstBlock.name;

	// Find the right transformation by giving priority to the "to"
	// transformation.
	const transformationsFrom = getBlockTransforms( 'from', name );
	const transformationsTo = getBlockTransforms( 'to', sourceName );

	const transformation =
		findTransform(
			transformationsTo,
			( t ) =>
				t.type === 'block' &&
				( isWildcardBlockTransform( t ) ||
					t.blocks.indexOf( name ) !== -1 ) &&
				( ! isMultiBlock || t.isMultiBlock ) &&
				maybeCheckTransformIsMatch( t, blocksArray )
		) ||
		findTransform(
			transformationsFrom,
			( t ) =>
				t.type === 'block' &&
				( isWildcardBlockTransform( t ) ||
					t.blocks.indexOf( sourceName ) !== -1 ) &&
				( ! isMultiBlock || t.isMultiBlock ) &&
				maybeCheckTransformIsMatch( t, blocksArray )
		);

	// Stop if there is no valid transformation.
	if ( ! transformation ) {
		return null;
	}

	let transformationResults;

	if ( transformation.isMultiBlock ) {
		if ( '__experimentalConvert' in transformation ) {
			transformationResults =
				transformation.__experimentalConvert( blocksArray );
		} else {
			transformationResults = transformation.transform(
				blocksArray.map( ( currentBlock ) => currentBlock.attributes ),
				blocksArray.map( ( currentBlock ) => currentBlock.innerBlocks )
			);
		}
	} else if ( '__experimentalConvert' in transformation ) {
		transformationResults =
			transformation.__experimentalConvert( firstBlock );
	} else {
		transformationResults = transformation.transform(
			firstBlock.attributes,
			firstBlock.innerBlocks
		);
	}

	// Ensure that the transformation function returned an object or an array
	// of objects.
	if (
		transformationResults === null ||
		typeof transformationResults !== 'object'
	) {
		return null;
	}

	// If the transformation function returned a single object, we want to work
	// with an array instead.
	transformationResults = Array.isArray( transformationResults )
		? transformationResults
		: [ transformationResults ];

	// Ensure that every block object returned by the transformation has a
	// valid block type.
	if (
		transformationResults.some(
			( result ) => ! getBlockType( result.name )
		)
	) {
		return null;
	}

	const hasSwitchedBlock = transformationResults.some(
		( result ) => result.name === name
	);

	// Ensure that at least one block object returned by the transformation has
	// the expected "destination" block type.
	if ( ! hasSwitchedBlock ) {
		return null;
	}

	const ret = transformationResults.map( ( result, index, results ) => {
		/**
		 * Filters an individual transform result from block transformation.
		 * All of the original blocks are passed, since transformations are
		 * many-to-many, not one-to-one.
		 *
		 * @param {Object}   transformedBlock The transformed block.
		 * @param {Object[]} blocks           Original blocks transformed.
		 * @param {Object[]} index            Index of the transformed block on the array of results.
		 * @param {Object[]} results          An array all the blocks that resulted from the transformation.
		 */
		return applyFilters(
			'blocks.switchToBlockType.transformedBlock',
			result,
			blocks,
			index,
			results
		);
	} );

	return ret;
}

/**
 * Create a block object from the example API.
 *
 * @param {string} name
 * @param {Object} example
 *
 * @return {Object} block.
 */
export const getBlockFromExample = ( name, example ) => {
	try {
		return createBlock(
			name,
			example.attributes,
			( example.innerBlocks ?? [] ).map( ( innerBlock ) =>
				getBlockFromExample( innerBlock.name, innerBlock )
			)
		);
	} catch {
		return createBlock( 'core/missing', {
			originalName: name,
			originalContent: '',
			originalUndelimitedContent: '',
		} );
	}
};
