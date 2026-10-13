import { OBJECT_REPLACEMENT_CHARACTER } from './special-characters';
import type { RichTextFormat, RichTextValue } from './types';

/**
 * Gets the active object, if there is any.
 *
 * @param {RichTextValue} value Value to inspect.
 *
 * @return {RichTextFormat|void} Active object, or undefined.
 */
export function getActiveObject( {
	start,
	end,
	replacements,
	text,
}: RichTextValue ) {
	if ( start + 1 !== end || text[ start ] !== OBJECT_REPLACEMENT_CHARACTER ) {
		return;
	}

	return replacements[ start ];
}
