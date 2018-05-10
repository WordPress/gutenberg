/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * Returns an action object used in signalling that block types have been added.
 *
 * @param {Array|Object} blockTypes Block types received.
 *
 * @return {Object} Action object.
 */
export function addBlockTypes( blockTypes ) {
	return {
		type: 'ADD_BLOCK_TYPES',
		blockTypes: castArray( blockTypes ),
	};
}

/**
 * Returns an action object used to remove a registered block type.
 *
 * @param {string|Array} names Block name.
 *
 * @return {Object} Action object.
 */
export function removeBlockTypes( names ) {
	return {
		type: 'REMOVE_BLOCK_TYPES',
		names: castArray( names ),
	};
}

/**
 * Returns an action object used to set the default block type.
 *
 * @param {string} name Block name.
 *
 * @return {Object} Action object.
 */
export function setDefaultBlockType( name ) {
	return {
		type: 'SET_DEFAULT_BLOCK_TYPE',
		name,
	};
}

/**
 * Returns an action object used to set the fallback block type.
 *
 * @param {string} name Block name.
 *
 * @return {Object} Action object.
 */
export function setFallbackBlockType( name ) {
	return {
		type: 'SET_FALLBACK_BLOCK_TYPE',
		name,
	};
}
