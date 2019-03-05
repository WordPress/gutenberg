/**
 * Internal dependencies
 */

import { insert } from './insert';

/**
 * Inserts a line break at the given or selected position.
 *
 * @param {Object} value Value to modify.
 *
 * @return {Object} The value with the line break inserted.
 */
export function insertLineBreak( value ) {
	return insert( value, '\n' );
}
