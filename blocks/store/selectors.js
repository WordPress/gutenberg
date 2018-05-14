/**
 * External dependencies
 */
import createSelector from 'rememo';
import { filter, includes, map, mapValues, compact } from 'lodash';

/**
 * Returns all the available block types.
 *
 * @param {Object} state Data state.
 *
 * @return {Array} Block Types.
 */
export const getBlockTypes = createSelector(
	( state ) => compact( Object.values( state.blockTypes ).map( ( { name } ) => getBlockType( state, name ) ) ),
	( state ) => [
		state.blockTypes,
		state.implementations,
	]
);

/**
 * Returns a block type by name.
 *
 * @param {Object} state Data state.
 * @param {string} name Block type name.
 *
 * @return {Object?} Block Type.
 */
export const getBlockType = createSelector(
	( state, name ) => {
		const blockTypeDefinition = state.blockTypes[ name ];
		const blockTypeImplementation = state.implementations[ name ];

		if ( ! blockTypeDefinition || ! blockTypeImplementation ) {
			return null;
		}

		return {
			...blockTypeDefinition,
			...blockTypeImplementation,
			attributes: mapValues( blockTypeDefinition.attributes, ( attribute, key ) => {
				const implementationAttribute = blockTypeImplementation.attributes ? blockTypeImplementation.attributes[ key ] : {};
				return {
					...attribute,
					...implementationAttribute,
				};
			} ),
		};
	},
	( state ) => [
		state.blockTypes,
		state.implementations,
	]
);

/**
 * Returns all the available categories.
 *
 * @param {Object} state Data state.
 *
 * @return {Array} Categories list.
 */
export function getCategories( state ) {
	return state.categories;
}

/**
 * Returns the name of the default block name.
 *
 * @param {Object} state Data state.
 *
 * @return {string?} Default block name.
 */
export function getDefaultBlockName( state ) {
	return state.defaultBlockName;
}

/**
 * Returns the name of the fallback block name.
 *
 * @param {Object} state Data state.
 *
 * @return {string?} Fallback block name.
 */
export function getFallbackBlockName( state ) {
	return state.fallbackBlockName;
}

/**
 * Returns an array with the child blocks of a given block.
 *
 * @param {Object} state     Data state.
 * @param {string} blockName Block type name.
 *
 * @return {Array} Array of child block names.
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

/**
 * Returns a boolean indicating if a block has child blocks or not.
 *
 * @param {Object} state     Data state.
 * @param {string} blockName Block type name.
 *
 * @return {boolean} True if a block contains child blocks and false otherwise.
 */
export const hasChildBlocks = ( state, blockName ) => {
	return getChildBlockNames( state, blockName ).length > 0;
};
