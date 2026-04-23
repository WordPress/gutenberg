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
	isBlockRegistered,
	normalizeBlockType,
	__experimentalSanitizeBlockAttributes,
} from './utils';
import type { Block, BlockType, BlockTransform } from '../types';

/**
 * Returns a block object given its type and attributes.
 *
 * @param name        Block name.
 * @param attributes  Block attributes.
 * @param innerBlocks Nested blocks.
 *
 * @return Block object.
 */
export function createBlock(
	name: string,
	attributes: Record< string, unknown > = {},
	innerBlocks: Block[] = []
): Block {
	if ( ! isBlockRegistered( name ) ) {
		return createBlock( 'core/missing', {
			originalName: name,
			originalContent: '',
			originalUndelimitedContent: '',
		} );
	}

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
 * @param innerBlocksOrTemplate Nested blocks or InnerBlocks templates.
 *
 * @return Array of Block objects.
 */
export function createBlocksFromInnerBlocksTemplate(
	innerBlocksOrTemplate: Array<
		Block | [ string, Record< string, unknown >?, Array< unknown >? ]
	> = []
): Block[] {
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
			name as string,
			attributes as Record< string, unknown >,
			createBlocksFromInnerBlocksTemplate(
				innerBlocks as Array<
					| Block
					| [ string, Record< string, unknown >?, Array< unknown >? ]
				>
			)
		);
	} );
}

/**
 * Given a block object, returns a copy of the block object while sanitizing its attributes,
 * optionally merging new attributes and/or replacing its inner blocks.
 *
 * @param block           Block instance.
 * @param mergeAttributes Block attributes.
 * @param newInnerBlocks  Nested blocks.
 *
 * @return A cloned block.
 */
export function __experimentalCloneSanitizedBlock(
	block: Block,
	mergeAttributes: Record< string, unknown > = {},
	newInnerBlocks?: Block[]
): Block {
	const { name } = block;

	if ( ! isBlockRegistered( name ) ) {
		return createBlock( 'core/missing', {
			originalName: name,
			originalContent: '',
			originalUndelimitedContent: '',
		} );
	}

	const clientId = uuid();

	const sanitizedAttributes = __experimentalSanitizeBlockAttributes( name, {
		...block.attributes,
		...mergeAttributes,
	} );

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
 * @param block           Block instance.
 * @param mergeAttributes Block attributes.
 * @param newInnerBlocks  Nested blocks.
 *
 * @return A cloned block.
 */
export function cloneBlock(
	block: Block,
	mergeAttributes: Record< string, unknown > = {},
	newInnerBlocks?: Block[]
): Block {
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
 * @param transform The transform object to validate.
 * @param direction Is this a 'from' or 'to' transform.
 * @param blocks    The blocks to transform from.
 *
 * @return Is the transform possible?
 */
const isPossibleTransformForSource = (
	transform: BlockTransform,
	direction: 'from' | 'to',
	blocks: Block[]
): boolean => {
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
		transform.blocks!.indexOf( sourceBlock.name ) !== -1 ||
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
		isContainerGroupBlock( transform.blockName! )
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
 * @param blocks The blocks to transform from.
 *
 * @return Block types that the blocks can be transformed into.
 */
const getBlockTypesForPossibleFromTransforms = (
	blocks: Block[]
): BlockType[] => {
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
 * @param blocks The blocks to transform from.
 *
 * @return Block types that the source can be transformed into.
 */
const getBlockTypesForPossibleToTransforms = (
	blocks: Block[]
): BlockType[] => {
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
	return blockNames
		.filter( ( name ): name is string => !! name )
		.map( getBlockType )
		.filter( ( bt ): bt is BlockType => !! bt );
};

/**
 * Determines whether transform is a "block" type
 * and if so whether it is a "wildcard" transform
 * ie: targets "any" block type
 *
 * @param t the Block transform object
 *
 * @return whether transform is a wildcard transform
 */
export const isWildcardBlockTransform = (
	t: BlockTransform | null | undefined
): boolean =>
	!! t &&
	t.type === 'block' &&
	Array.isArray( t.blocks ) &&
	t.blocks.includes( '*' );

/**
 * Determines whether the given Block is the core Block which
 * acts as a container Block for other Blocks as part of the
 * Grouping mechanics
 *
 * @param name the name of the Block to test against
 *
 * @return whether or not the Block is the container Block type
 */
export const isContainerGroupBlock = ( name: string ): boolean =>
	name === getGroupingBlockName();

/**
 * Returns an array of block types that the set of blocks received as argument
 * can be transformed into.
 *
 * @param blocks Blocks array.
 *
 * @return Block types that the blocks argument can be transformed to.
 */
export function getPossibleBlockTransformations(
	blocks: Block[]
): BlockType[] {
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
 * @param transforms Transforms to search.
 * @param predicate  Function returning true on matching transform.
 *
 * @return Highest-priority transform candidate.
 */
export function findTransform(
	transforms: BlockTransform[],
	predicate: ( transform: BlockTransform ) => boolean
): BlockTransform | null {
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
	return hooks.applyFilters( 'transform', null ) as BlockTransform | null;
}

/**
 * Returns normal block transforms for a given transform direction, optionally
 * for a specific block by name, or an empty array if there are no transforms.
 * If no block name is provided, returns transforms for all blocks. A normal
 * transform object includes `blockName` as a property.
 *
 * @param direction       Transform direction ("to", "from").
 * @param blockTypeOrName Block type or name.
 *
 * @return Block transforms for direction.
 */
export function getBlockTransforms(
	direction: 'to' | 'from',
	blockTypeOrName?: string | BlockType
): BlockTransform[] {
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
					transforms.supportedMobileTransforms!.includes(
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
 * @param transform A transform object.
 * @param blocks    Blocks array.
 *
 * @return True if given blocks are a match for the transform.
 */
function maybeCheckTransformIsMatch(
	transform: BlockTransform,
	blocks: Block[]
): boolean {
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
 * @param blocks Blocks array or block object.
 * @param name   Block name.
 *
 * @return Array of blocks or null.
 */
export function switchToBlockType(
	blocks: Block[] | Block,
	name: string
): Block[] | null {
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
					t.blocks!.indexOf( name ) !== -1 ) &&
				( ! isMultiBlock || !! t.isMultiBlock ) &&
				maybeCheckTransformIsMatch( t, blocksArray )
		) ||
		findTransform(
			transformationsFrom,
			( t ) =>
				t.type === 'block' &&
				( isWildcardBlockTransform( t ) ||
					t.blocks!.indexOf( sourceName ) !== -1 ) &&
				( ! isMultiBlock || !! t.isMultiBlock ) &&
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
				transformation.__experimentalConvert!( blocksArray );
		} else {
			transformationResults = transformation.transform!(
				blocksArray.map( ( currentBlock ) => currentBlock.attributes ),
				blocksArray.map( ( currentBlock ) => currentBlock.innerBlocks )
			);
		}
	} else if ( '__experimentalConvert' in transformation ) {
		transformationResults =
			transformation.__experimentalConvert!( firstBlock );
	} else {
		transformationResults = transformation.transform!(
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
		 * @param transformedBlock The transformed block.
		 * @param blocks           Original blocks transformed.
		 * @param index            Index of the transformed block on the array of results.
		 * @param results          An array all the blocks that resulted from the transformation.
		 */
		return applyFilters(
			'blocks.switchToBlockType.transformedBlock',
			result,
			blocks,
			index,
			results
		);
	} );

	return ret as Block[];
}

/**
 * Create a block object from the example API.
 *
 * @param name
 * @param example
 *
 * @return block.
 */
type BlockExample = {
	attributes?: Record< string, unknown >;
	innerBlocks?: Array< {
		name: string;
		attributes?: Record< string, unknown >;
		innerBlocks?: BlockExample[ 'innerBlocks' ];
	} >;
};

export const getBlockFromExample = (
	name: string,
	example: BlockExample
): Block =>
	createBlock(
		name,
		example.attributes,
		( example.innerBlocks ?? [] ).map( ( innerBlock ) =>
			getBlockFromExample( innerBlock.name, innerBlock )
		)
	);
