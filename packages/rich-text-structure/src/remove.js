/**
 * Internal dependencies
 */

import { insert } from './insert';
import { create } from './create';

/**
 * Removes content from the record at the given start and end indices.
 * If no start index or end index is provided, the record's selection will be
 * used.
 *
 * @param {Object} record     Record to modify.
 * @param {number} startIndex Start index.
 * @param {number} endIndex   End index.
 *
 * @return {Object} A new record with the content removed.
 */
export function remove( record, startIndex, endIndex ) {
	return insert( record, create(), startIndex, endIndex );
}
