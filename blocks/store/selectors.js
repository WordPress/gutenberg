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
	return state.blockTypes;
}

export function getBlockType( state, name ) {
	return find( state.blockTypes, { name } );
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
