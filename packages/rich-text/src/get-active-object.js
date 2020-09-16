/**
 * Internal dependencies
 */

import { OBJECT_REPLACEMENT_CHARACTER } from './special-characters';

/** @typedef {import('./create').RichTextValue} RichTextValue */
/** @typedef {import('./create').RichTextReplacement} RichTextReplacement */

/**
 * Gets the active object, if there is any.
 *
 * @param {RichTextValue} value Value to inspect.
 *
 * @return {?RichTextReplacement} Active object, or undefined.
 */
export function getActiveObject( { start, end, replacements, text } ) {
	if ( start + 1 !== end || text[ start ] !== OBJECT_REPLACEMENT_CHARACTER ) {
		return;
	}

	return replacements[ start ];
}
