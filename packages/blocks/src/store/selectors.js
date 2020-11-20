/**
 * External dependencies
 */
import {
	deburr,
	filter,
	findLast,
	first,
	flow,
	includes,
	map,
	some,
	get as lodashGet,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { createAtomSelector } from '@wordpress/stan';

/**
 * Internal dependencies
 */
import {
	blockTypesByName,
	blockCategories,
	blockCollections,
	defaultBlockName,
	freeformFallbackBlockName,
	unregisteredFallbackBlockName,
	groupingBlockName,
	blockVariationsByBlockName,
	blockStylesByBlockName,
} from './atoms';

/** @typedef {import('../api/registration').WPBlockVariation} WPBlockVariation */
/** @typedef {import('../api/registration').WPBlockVariationScope} WPBlockVariationScope */
/** @typedef {import('./reducer').WPBlockCategory} WPBlockCategory */

/**
 * Given a block name or block type object, returns the corresponding
 * normalized block type object.
 *
 * @param {(string|Object)} nameOrType Block name or type object
 *
 * @return {Object} Block type object.
 */
const getNormalizedBlockType = createAtomSelector(
	( nameOrType ) => ( { get } ) =>
		'string' === typeof nameOrType
			? get( getBlockType( nameOrType ) )
			: nameOrType
);

/**
 * Returns all the given block variations for a given block name.
 *
 * @param {string} name Block type name.
 *
 * @return {Array} Block Variations.
 */
const getAllBlockVariations = createAtomSelector(
	( blockName ) => ( { get } ) => {
		return get( blockVariationsByBlockName )[ blockName ];
	}
);

/**
 * Returns all the available block types.
 *
 * @return {Array} Block Types.
 */
export const getBlockTypes = createAtomSelector( () => ( { get } ) => {
	return Object.values( get( blockTypesByName ) ).map( ( blockType ) => {
		return {
			...blockType,
			variations: get( getAllBlockVariations( blockType.name ) ),
		};
	} );
} );

/**
 * Returns a block type by name.
 *
 * @param {string} name Block type name.
 *
 * @return {Object?} Block Type.
 */
export const getBlockType = createAtomSelector( ( name ) => ( { get } ) => {
	const blockType = get( blockTypesByName )[ name ];
	return blockType
		? {
				...blockType,
				variations: get( getAllBlockVariations( name ) ),
		  }
		: null;
} );

/**
 * Returns block styles by block name.
 *
 * @param {string} name  Block type name.
 *
 * @return {Array?} Block Styles.
 */
export const getBlockStyles = createAtomSelector( ( name ) => ( { get } ) => {
	return get( blockStylesByBlockName )[ name ];
} );

/**
 * Returns block variations by block name.
 *
 * @param {string}                blockName Block type name.
 * @param {WPBlockVariationScope} [scope]   Block variation scope name.
 *
 * @return {(WPBlockVariation[]|void)} Block variations.
 */
export const getBlockVariations = createAtomSelector(
	( blockName, scope ) => ( { get } ) => {
		const variations = get( getAllBlockVariations( blockName ) );
		if ( ! variations || ! scope ) {
			return variations;
		}
		return variations.filter( ( variation ) => {
			// For backward compatibility reasons, variation's scope defaults to `block` and `inserter` when not set.
			return ( variation.scope || [ 'block', 'inserter' ] ).includes(
				scope
			);
		} );
	}
);

/**
 * Returns the default block variation for the given block type.
 * When there are multiple variations annotated as the default one,
 * the last added item is picked. This simplifies registering overrides.
 * When there is no default variation set, it returns the first item.
 *
 * @param {string}                blockName Block type name.
 * @param {WPBlockVariationScope} [scope]   Block variation scope name.
 *
 * @return {?WPBlockVariation} The default block variation.
 */
export const getDefaultBlockVariation = createAtomSelector(
	( blockName, scope ) => ( { get } ) => {
		const variations = get( getBlockVariations( blockName, scope ) );

		return findLast( variations, 'isDefault' ) || first( variations );
	}
);

/**
 * Returns all the available categories.
 *
 * @return {WPBlockCategory[]} Categories list.
 */
export const getCategories = createAtomSelector( () => ( { get } ) => {
	return get( blockCategories );
} );

/**
 * Returns all the available collections.
 *
 * @return {Object} Collections list.
 */
export const getCollections = createAtomSelector( () => ( { get } ) => {
	return get( blockCollections );
} );

/**
 * Returns the name of the default block name.
 *
 * @return {string?} Default block name.
 */
export const getDefaultBlockName = createAtomSelector( () => ( { get } ) => {
	return get( defaultBlockName );
} );

/**
 * Returns the name of the block for handling non-block content.
 *
 * @return {string?} Name of the block for handling non-block content.
 */
export const getFreeformFallbackBlockName = createAtomSelector(
	() => ( { get } ) => {
		return get( freeformFallbackBlockName );
	}
);

/**
 * Returns the name of the block for handling unregistered blocks.
 *
 * @return {string?} Name of the block for handling unregistered blocks.
 */
export const getUnregisteredFallbackBlockName = createAtomSelector(
	() => ( { get } ) => {
		return get( unregisteredFallbackBlockName );
	}
);

/**
 * Returns the name of the block for handling unregistered blocks.
 *
 * @return {string?} Name of the block for handling unregistered blocks.
 */
export const getGroupingBlockName = createAtomSelector( () => ( { get } ) => {
	return get( groupingBlockName );
} );

/**
 * Returns an array with the child blocks of a given block.
 *
 * @param {string} blockName Block type name.
 * @return {Array} Array of child block names.
 */
export const getChildBlockNames = createAtomSelector(
	( blockName ) => ( { get } ) => {
		const blockTypes = get( getBlockTypes() );
		return map(
			filter( blockTypes, ( blockType ) => {
				return includes( blockType.parent, blockName );
			} ),
			( { name } ) => name
		);
	}
);

/**
 * Returns the block support value for a feature, if defined.
 *
 * @param  {(string|Object)} nameOrType      Block name or type object
 * @param  {string}          feature         Feature to retrieve
 * @param  {*}               defaultSupports Default value to return if not
 *                                           explicitly defined
 *
 * @return {?*} Block support value
 */
export const getBlockSupport = createAtomSelector(
	( nameOrType, feature, defaultSupports ) => ( { get } ) => {
		const blockType = get( getNormalizedBlockType( nameOrType ) );

		return lodashGet(
			blockType,
			[ 'supports', ...feature.split( '.' ) ],
			defaultSupports
		);
	}
);

/**
 * Returns true if the block defines support for a feature, or false otherwise.
 *
 * @param {(string|Object)} nameOrType      Block name or type object.
 * @param {string}          feature         Feature to test.
 * @param {boolean}         defaultSupports Whether feature is supported by
 *                                          default if not explicitly defined.
 *
 * @return {boolean} Whether block supports feature.
 */
export const hasBlockSupport = createAtomSelector(
	( nameOrType, feature, defaultSupports ) => ( { get } ) => {
		return !! get(
			getBlockSupport( nameOrType, feature, defaultSupports )
		);
	}
);

/**
 * Returns true if the block type by the given name or object value matches a
 * search term, or false otherwise.
 *
 * @param {(string|Object)} nameOrType Block name or type object.
 * @param {string}          searchTerm Search term by which to filter.
 *
 * @return {Object[]} Whether block type matches search term.
 */
export const isMatchingSearchTerm = createAtomSelector(
	( nameOrType, searchTerm ) => ( { get } ) => {
		const blockType = get( getNormalizedBlockType( nameOrType ) );

		const getNormalizedSearchTerm = flow( [
			// Disregard diacritics.
			//  Input: "média"
			deburr,

			// Lowercase.
			//  Input: "MEDIA"
			( term ) => term.toLowerCase(),

			// Strip leading and trailing whitespace.
			//  Input: " media "
			( term ) => term.trim(),
		] );

		const normalizedSearchTerm = getNormalizedSearchTerm( searchTerm );

		const isSearchMatch = flow( [
			getNormalizedSearchTerm,
			( normalizedCandidate ) =>
				includes( normalizedCandidate, normalizedSearchTerm ),
		] );

		return (
			isSearchMatch( blockType.title ) ||
			some( blockType.keywords, isSearchMatch ) ||
			isSearchMatch( blockType.category )
		);
	}
);

/**
 * Returns a boolean indicating if a block has child blocks or not.
 *
 * @param {string} blockName Block type name.
 *
 * @return {boolean} True if a block contains child blocks and false otherwise.
 */
export const hasChildBlocks = ( blockName ) =>
	createAtomSelector( ( { get } ) => {
		return get( getChildBlockNames( blockName ) ).length > 0;
	} );

/**
 * Returns a boolean indicating if a block has at least one child block with inserter support.
 *
 * @param {string} blockName Block type name.
 *
 * @return {boolean} True if a block contains at least one child blocks with inserter support
 *                   and false otherwise.
 */
export const hasChildBlocksWithInserterSupport = createAtomSelector(
	( blockName ) => ( { get } ) => {
		return some(
			get( getChildBlockNames( blockName ) ),
			( childBlockName ) => {
				return get(
					hasBlockSupport( childBlockName, 'inserter', true )
				);
			}
		);
	}
);
