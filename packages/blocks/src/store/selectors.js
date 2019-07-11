/**
 * External dependencies
 */
import createSelector from 'rememo';
import { filter, get, includes, map, some, flow, deburr } from 'lodash';

/**
 * @typedef {import('@wordpress/blocks').Block<Record<string,any>>} BlockType
 */

/**
 * @typedef {import('@wordpress/blocks').BlockStyle} BlockStyle
 */

/**
 * @typedef {import('@wordpress/blocks').BlockSupports} BlockSupports
 */

/**
 * @typedef {import('@wordpress/blocks').Category} Category
 */

/**
 * @typedef {import('./reducer').State} State
 */

/**
 * Given a block name or block type object, returns the corresponding
 * normalized block type object.
 *
 * @param {State}            state      Blocks state.
 * @param {string|BlockType} nameOrType Block name or type object
 *
 * @return {BlockType} Block type object.
 */
const getNormalizedBlockType = ( state, nameOrType ) => (
	'string' === typeof nameOrType ?
		getBlockType( state, nameOrType ) :
		nameOrType
);

/**
 * Returns all the available block types.
 *
 * @param {State} state Data state.
 *
 * @return {Block[]} Block Types.
 */
export const getBlockTypes = createSelector(
	( state ) => Object.values( state.blockTypes ),
	( state ) => [
		state.blockTypes,
	]
);

/**
 * Returns a block type by name.
 *
 * @param {State} state Data state.
 * @param {string} name Block type name.
 *
 * @return {BlockType|undefined} Block Type.
 */
export function getBlockType( state, name ) {
	return state.blockTypes[ name ];
}

/**
 * Returns block styles by block name.
 *
 * @param {State}  state Data state.
 * @param {string} name  Block type name.
 *
 * @return {BlockStyle[]|undefined} Block Styles.
 */
export function getBlockStyles( state, name ) {
	return state.blockStyles[ name ];
}

/**
 * Returns all the available categories.
 *
 * @param {State} state Data state.
 *
 * @return {Category[]} Categories list.
 */
export function getCategories( state ) {
	return state.categories;
}

/**
 * Returns the name of the default block name.
 *
 * @param {State} state Data state.
 *
 * @return {string|undefined} Default block name.
 */
export function getDefaultBlockName( state ) {
	return state.defaultBlockName;
}

/**
 * Returns the name of the block for handling non-block content.
 *
 * @param {State} state Data state.
 *
 * @return {string|undefined} Name of the block for handling non-block content.
 */
export function getFreeformFallbackBlockName( state ) {
	return state.freeformFallbackBlockName;
}

/**
 * Returns the name of the block for handling unregistered blocks.
 *
 * @param {State} state Data state.
 *
 * @return {string|undefined} Name of the block for handling unregistered blocks.
 */
export function getUnregisteredFallbackBlockName( state ) {
	return state.unregisteredFallbackBlockName;
}

/**
 * Returns the name of the block for handling unregistered blocks.
 *
 * @param {State} state Data state.
 *
 * @return {string|undefined} Name of the block for handling unregistered blocks.
 */
export function getGroupingBlockName( state ) {
	return state.groupingBlockName;
}

/**
 * Returns an array with the child blocks of a given block.
 *
 * @param {State}  state     Data state.
 * @param {string} blockName Block type name.
 *
 * @return {string[]} Array of child block names.
 */
export const getChildBlockNames = createSelector(
	( state, blockName ) => {
		return map(
			filter( state.blockTypes, ( blockType ) => {
				return includes( blockType.parent, blockName );
			} ),
			( { name } ) => name
		);
	},
	( state ) => [
		state.blockTypes,
	]
);

// eslint-disable-next-line valid-jsdoc
/**
 * Returns the block support value for a feature, if defined.
 *
 * @param {State}               state             Data state.
 * @param {string|BlockType}    nameOrType        Block name or type object
 * @param {keyof BlockSupports} feature           Feature to retrieve
 * @param {any}                 [defaultSupports] Default value to return if not explicitly defined
 *
 * @return {any} Block support value
 */
export const getBlockSupport = ( state, nameOrType, feature, defaultSupports ) => {
	const blockType = getNormalizedBlockType( state, nameOrType );

	return get( blockType, [
		'supports',
		feature,
	], defaultSupports );
};

// eslint-disable-next-line valid-jsdoc
/**
 * Returns true if the block defines support for a feature, or false otherwise.
 *
 * @param {State}               state             Data state.
 * @param {string|BlockType}    nameOrType        Block name or type object.
 * @param {keyof BlockSupports} feature           Feature to test.
 * @param {boolean}             [defaultSupports] Whether feature is supported by default if not explicitly defined.
 *
 * @return {boolean} Whether block supports feature.
 */
export function hasBlockSupport( state, nameOrType, feature, defaultSupports ) {
	return !! getBlockSupport( state, nameOrType, feature, defaultSupports );
}

/**
 * Returns true if the block type by the given name or object value matches a
 * search term, or false otherwise.
 *
 * @param {State}            state      Blocks state.
 * @param {string|BlockType} nameOrType Block name or type object.
 * @param {string}           searchTerm Search term by which to filter.
 *
 * @return {boolean} Whether block type matches search term.
 */
export function isMatchingSearchTerm( state, nameOrType, searchTerm ) {
	const blockType = getNormalizedBlockType( state, nameOrType );

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
		( normalizedCandidate ) => includes(
			normalizedCandidate,
			normalizedSearchTerm
		),
	] );

	return (
		isSearchMatch( blockType.title ) ||
		some( blockType.keywords, isSearchMatch ) ||
		isSearchMatch( blockType.category )
	);
}

/**
 * Returns a boolean indicating if a block has child blocks or not.
 *
 * @param {State}  state     Data state.
 * @param {string} blockName Block type name.
 *
 * @return {boolean} `true` if a block contains child blocks and `false` otherwise.
 */
export const hasChildBlocks = ( state, blockName ) => {
	return getChildBlockNames( state, blockName ).length > 0;
};

/**
 * Returns a boolean indicating if a block has at least one child block with inserter support.
 *
 * @param {State}  state     Data state.
 * @param {string} blockName Block type name.
 *
 * @return {boolean} `true` if a block contains at least one child blocks with
 *                    inserter support and `false` otherwise.
 */
export const hasChildBlocksWithInserterSupport = ( state, blockName ) => {
	return some( getChildBlockNames( state, blockName ), ( childBlockName ) => {
		return hasBlockSupport( state, childBlockName, 'inserter', true );
	} );
};
