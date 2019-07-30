/**
 * Internal dependencies
 */

import { OBJECT_REPLACEMENT_CHARACTER } from './special-characters';

/**
 * Gets the active object, if there is any.
 *
 * @param {Object} value Value to inspect.
 *
 * @return {?Object} Active object, or undefined.
 */
export function getActiveObject( { start, end, replacements, text } ) {
	if ( start + 1 !== end || text[ start ] !== OBJECT_REPLACEMENT_CHARACTER ) {
		return;
	}

	return replacements[ start ];
}
