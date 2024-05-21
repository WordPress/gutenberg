/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { processBlockType } from './process-block-type';

/** @typedef {import('../api/registration').WPBlockVariation} WPBlockVariation */
/** @typedef {import('../api/registration').WPBlockType} WPBlockType */
/** @typedef {import('./reducer').WPBlockCategory} WPBlockCategory */

/**
 * Returns an action object used in signalling that block types have been added.
 * Ignored from documentation as the recommended usage for this action through registerBlockType from @wordpress/blocks.
 *
 * @ignore
 *
 * @param {WPBlockType|WPBlockType[]} blockTypes Object or array of objects representing blocks to added.
 *
 *
 * @return {Object} Action object.
 */
export function addBlockTypes( blockTypes ) {
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
	return ( { dispatch, select } ) => {
		const processedBlockTypes = [];
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
 * @param {string|string[]} names Block name or array of block names to be removed.
 *
 *
 * @return {Object} Action object.
 */
export function removeBlockTypes( names ) {
	return {
		type: 'REMOVE_BLOCK_TYPES',
		names: Array.isArray( names ) ? names : [ names ],
	};
}

/**
 * Returns an action object used in signalling that new block styles have been added.
 * Ignored from documentation as the recommended usage for this action through registerBlockStyle from @wordpress/blocks.
 *
 * @param {string|Array} blockNames Block names to register new styles for.
 * @param {Array|Object} styles     Block style object or array of block style objects.
 *
 * @ignore
 *
 * @return {Object} Action object.
 */
export function addBlockStyles( blockNames, styles ) {
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
 * @param {string}       blockName  Block name.
 * @param {Array|string} styleNames Block style names or array of block style names.
 *
 * @return {Object} Action object.
 */
export function removeBlockStyles( blockName, styleNames ) {
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
 * @param {string}                              blockName  Block name.
 * @param {WPBlockVariation|WPBlockVariation[]} variations Block variations.
 *
 * @return {Object} Action object.
 */
export function addBlockVariations( blockName, variations ) {
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
 * @param {string}          blockName      Block name.
 * @param {string|string[]} variationNames Block variation names.
 *
 * @return {Object} Action object.
 */
export function removeBlockVariations( blockName, variationNames ) {
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
 * @param {string} name Block name.
 *
 * @return {Object} Action object.
 */
export function setDefaultBlockName( name ) {
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
 * @param {string} name Block name.
 *
 * @return {Object} Action object.
 */
export function setFreeformFallbackBlockName( name ) {
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
 * @param {string} name Block name.
 *
 * @return {Object} Action object.
 */
export function setUnregisteredFallbackBlockName( name ) {
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
 * @param {string} name Block name.
 *
 * @return {Object} Action object.
 */
export function setGroupingBlockName( name ) {
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
 * @param {WPBlockCategory[]} categories Block categories.
 *
 * @return {Object} Action object.
 */
export function setCategories( categories ) {
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
 * @param {string} slug     Block category slug.
 * @param {Object} category Object containing the category properties that should be updated.
 *
 * @return {Object} Action object.
 */
export function updateCategory( slug, category ) {
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
 * @param {string} namespace The namespace of the blocks to put in the collection
 * @param {string} title     The title to display in the block inserter
 * @param {Object} icon      (optional) The icon to display in the block inserter
 *
 * @return {Object} Action object.
 */
export function addBlockCollection( namespace, title, icon ) {
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
 * @param {string} namespace The namespace of the blocks to put in the collection
 *
 * @return {Object} Action object.
 */
export function removeBlockCollection( namespace ) {
	return {
		type: 'REMOVE_BLOCK_COLLECTION',
		namespace,
	};
}
