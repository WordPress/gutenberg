/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * Returns an action object used in signalling that custom alignment types have been added.
 *
 * @param {Array|Object} customAlignmentTypes Alignment types received.
 *
 * @return {Object} Action object.
 */
export function addCustomAlignmentTypes( customAlignmentTypes ) {
	return {
		type: 'ADD_CUSTOM_ALIGNMENT_TYPES',
		customAlignmentTypes: castArray( customAlignmentTypes ),
	};
}

/**
 * Returns an action object used to remove a registered custom alignment type.
 *
 * @param {string|Array} names Custom alignment name.
 *
 * @return {Object} Action object.
 */
export function removeCustomAlignmentTypes( names ) {
	return {
		type: 'REMOVE_CUSTOM_ALIGNMENT_TYPES',
		names: castArray( names ),
	};
}

/**
 * Returns an action object used in signalling that format types have been
 * added.
 *
 * @param {Array|Object} formatTypes Format types received.
 *
 * @return {Object} Action object.
 */
export function addFormatTypes( formatTypes ) {
	return {
		type: 'ADD_FORMAT_TYPES',
		formatTypes: castArray( formatTypes ),
	};
}

/**
 * Returns an action object used to remove a registered format type.
 *
 * @param {string|Array} names Format name.
 *
 * @return {Object} Action object.
 */
export function removeFormatTypes( names ) {
	return {
		type: 'REMOVE_FORMAT_TYPES',
		names: castArray( names ),
	};
}
