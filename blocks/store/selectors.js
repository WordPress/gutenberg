/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * Returns all the available block types.
 *
 * @param {Object} state Data state.
 *
 * @return {Array} Block Types.
 */
export function getBlockTypes( state ) {
	return state.blockTypes.types;
}

export function getBlockType( state, name ) {
	return find( state.blockTypes.types, { name } );
}

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
 * Returns the name of the default block type
 *
 * @param {Object} state Data state.
 *
 * @return {string?} Default block type name.
 */
export function getDefaultBlockTypeName( state ) {
	return state.blockTypes.defaultBlockType;
}

/**
 * Returns the name of the fallback block type
 *
 * @param {Object} state Data state.
 *
 * @return {string?} Fallback block type name.
 */
export function getFallbackBlockTypeName( state ) {
	return state.blockTypes.fallbackBlockType;
}
