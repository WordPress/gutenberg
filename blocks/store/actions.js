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
 * Returns an action object used in signalling that block types have been implemented.
 *
 * @param {Array|Object} implementations Block types implementations.
 *
 * @return {Object} Action object.
 */
export function implementBlockTypes( implementations ) {
	return {
		type: 'IMPLEMENT_BLOCK_TYPES',
		implementations: castArray( implementations ),
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
 * Returns an action object used to set the default block name.
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
 * Returns an action object used to set the fallback block name.
 *
 * @param {string} name Block name.
 *
 * @return {Object} Action object.
 */
export function setFallbackBlockName( name ) {
	return {
		type: 'SET_FALLBACK_BLOCK_NAME',
		name,
	};
}
