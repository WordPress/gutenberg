/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { processBlockType } from './process-block-type';
import type {
	BlockType,
	BlockCategory,
	BlockVariation,
	BlockStyle,
	Icon,
} from '../types';
import type { Action, BlocksStoreThunkArgs } from './types';

/**
 * Returns an action object used in signalling that block types have been added.
 * Ignored from documentation as the recommended usage for this action through registerBlockType from @wordpress/blocks.
 *
 * @ignore
 *
 * @param blockTypes Object or array of objects representing blocks to added.
 *
 * @return Action object.
 */
export function addBlockTypes( blockTypes: BlockType | BlockType[] ): Action {
	return {
		type: 'ADD_BLOCK_TYPES',
		blockTypes: Array.isArray( blockTypes ) ? blockTypes : [ blockTypes ],
	};
}

/**
 * Signals that all block types should be computed again.
 * It uses stored unprocessed block types and all the most recent list of registered filters.
 *
 * It addresses the issue where third party block filters get registered after third party blocks. A sample sequence:
 *   1. Filter A.
 *   2. Block B.
 *   3. Block C.
 *   4. Filter D.
 *   5. Filter E.
 *   6. Block F.
 *   7. Filter G.
 * In this scenario some filters would not get applied for all blocks because they are registered too late.
 */
export function reapplyBlockTypeFilters() {
	return ( { dispatch, select }: BlocksStoreThunkArgs ) => {
		const processedBlockTypes: BlockType[] = [];
		for ( const [ name, settings ] of Object.entries(
			select.getUnprocessedBlockTypes()
		) ) {
			const result = dispatch( processBlockType( name, settings ) );
			if ( result ) {
				processedBlockTypes.push( result );
			}
		}

		if ( ! processedBlockTypes.length ) {
			return;
		}

		dispatch.addBlockTypes( processedBlockTypes );
	};
}

export function __experimentalReapplyBlockFilters() {
	deprecated(
		'wp.data.dispatch( "core/blocks" ).__experimentalReapplyBlockFilters',
		{
			since: '6.4',
			alternative: 'reapplyBlockFilters',
		}
	);

	return reapplyBlockTypeFilters();
}

/**
 * Returns an action object used to remove a registered block type.
 * Ignored from documentation as the recommended usage for this action through unregisterBlockType from @wordpress/blocks.
 *
 * @ignore
 *
 * @param names Block name or array of block names to be removed.
 *
 * @return Action object.
 */
export function removeBlockTypes( names: string | string[] ): Action {
	return {
		type: 'REMOVE_BLOCK_TYPES',
		names: Array.isArray( names ) ? names : [ names ],
	};
}

/**
 * Returns an action object used in signalling that new block styles have been added.
 * Ignored from documentation as the recommended usage for this action through registerBlockStyle from @wordpress/blocks.
 *
 * @param blockNames Block names to register new styles for.
 * @param styles     Block style object or array of block style objects.
 *
 * @ignore
 *
 * @return Action object.
 */
export function addBlockStyles(
	blockNames: string | string[],
	styles: BlockStyle | BlockStyle[]
): Action {
	return {
		type: 'ADD_BLOCK_STYLES',
		styles: Array.isArray( styles ) ? styles : [ styles ],
		blockNames: Array.isArray( blockNames ) ? blockNames : [ blockNames ],
	};
}

/**
 * Returns an action object used in signalling that block styles have been removed.
 * Ignored from documentation as the recommended usage for this action through unregisterBlockStyle from @wordpress/blocks.
 *
 * @ignore
 *
 * @param blockName  Block name.
 * @param styleNames Block style names or array of block style names.
 *
 * @return Action object.
 */
export function removeBlockStyles(
	blockName: string,
	styleNames: string | string[]
): Action {
	return {
		type: 'REMOVE_BLOCK_STYLES',
		styleNames: Array.isArray( styleNames ) ? styleNames : [ styleNames ],
		blockName,
	};
}

/**
 * Returns an action object used in signalling that new block variations have been added.
 * Ignored from documentation as the recommended usage for this action through registerBlockVariation from @wordpress/blocks.
 *
 * @ignore
 *
 * @param blockName  Block name.
 * @param variations Block variations.
 *
 * @return Action object.
 */
export function addBlockVariations(
	blockName: string,
	variations: BlockVariation | BlockVariation[]
): Action {
	return {
		type: 'ADD_BLOCK_VARIATIONS',
		variations: Array.isArray( variations ) ? variations : [ variations ],
		blockName,
	};
}

/**
 * Returns an action object used in signalling that block variations have been removed.
 * Ignored from documentation as the recommended usage for this action through unregisterBlockVariation from @wordpress/blocks.
 *
 * @ignore
 *
 * @param blockName      Block name.
 * @param variationNames Block variation names.
 *
 * @return Action object.
 */
export function removeBlockVariations(
	blockName: string,
	variationNames: string | string[]
): Action {
	return {
		type: 'REMOVE_BLOCK_VARIATIONS',
		variationNames: Array.isArray( variationNames )
			? variationNames
			: [ variationNames ],
		blockName,
	};
}

/**
 * Returns an action object used to set the default block name.
 * Ignored from documentation as the recommended usage for this action through setDefaultBlockName from @wordpress/blocks.
 *
 * @ignore
 *
 * @param name Block name.
 *
 * @return Action object.
 */
export function setDefaultBlockName( name: string ): Action {
	return {
		type: 'SET_DEFAULT_BLOCK_NAME',
		name,
	};
}

/**
 * Returns an action object used to set the name of the block used as a fallback
 * for non-block content.
 * Ignored from documentation as the recommended usage for this action through setFreeformContentHandlerName from @wordpress/blocks.
 *
 * @ignore
 *
 * @param name Block name.
 *
 * @return Action object.
 */
export function setFreeformFallbackBlockName( name: string ): Action {
	return {
		type: 'SET_FREEFORM_FALLBACK_BLOCK_NAME',
		name,
	};
}

/**
 * Returns an action object used to set the name of the block used as a fallback
 * for unregistered blocks.
 * Ignored from documentation as the recommended usage for this action through setUnregisteredTypeHandlerName from @wordpress/blocks.
 *
 * @ignore
 *
 * @param name Block name.
 *
 * @return Action object.
 */
export function setUnregisteredFallbackBlockName( name: string ): Action {
	return {
		type: 'SET_UNREGISTERED_FALLBACK_BLOCK_NAME',
		name,
	};
}

/**
 * Returns an action object used to set the name of the block used
 * when grouping other blocks
 * eg: in "Group/Ungroup" interactions
 * Ignored from documentation as the recommended usage for this action through setGroupingBlockName from @wordpress/blocks.
 *
 * @ignore
 *
 * @param name Block name.
 *
 * @return Action object.
 */
export function setGroupingBlockName( name: string ): Action {
	return {
		type: 'SET_GROUPING_BLOCK_NAME',
		name,
	};
}

/**
 * Returns an action object used to set block categories.
 * Ignored from documentation as the recommended usage for this action through setCategories from @wordpress/blocks.
 *
 * @ignore
 *
 * @param categories Block categories.
 *
 * @return Action object.
 */
export function setCategories( categories: BlockCategory[] ): Action {
	return {
		type: 'SET_CATEGORIES',
		categories,
	};
}

/**
 * Returns an action object used to update a category.
 * Ignored from documentation as the recommended usage for this action through updateCategory from @wordpress/blocks.
 *
 * @ignore
 *
 * @param slug     Block category slug.
 * @param category Object containing the category properties that should be updated.
 *
 * @return Action object.
 */
export function updateCategory(
	slug: string,
	category: Partial< BlockCategory >
): Action {
	return {
		type: 'UPDATE_CATEGORY',
		slug,
		category,
	};
}

/**
 * Returns an action object used to add block collections
 * Ignored from documentation as the recommended usage for this action through registerBlockCollection from @wordpress/blocks.
 *
 * @ignore
 *
 * @param namespace The namespace of the blocks to put in the collection
 * @param title     The title to display in the block inserter
 * @param icon      (optional) The icon to display in the block inserter
 *
 * @return Action object.
 */
export function addBlockCollection(
	namespace: string,
	title: string,
	icon?: Icon
): Action {
	return {
		type: 'ADD_BLOCK_COLLECTION',
		namespace,
		title,
		icon,
	};
}

/**
 * Returns an action object used to remove block collections
 * Ignored from documentation as the recommended usage for this action through unregisterBlockCollection from @wordpress/blocks.
 *
 * @ignore
 *
 * @param namespace The namespace of the blocks to put in the collection
 *
 * @return Action object.
 */
export function removeBlockCollection( namespace: string ): Action {
	return {
		type: 'REMOVE_BLOCK_COLLECTION',
		namespace,
	};
}
