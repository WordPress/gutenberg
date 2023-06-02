/**
 * Internal dependencies
 */
import type { RichTextValue } from './types';

/**
 * Check if the selection of a Rich Text value is collapsed or not. Collapsed
 * means that no characters are selected, but there is a caret present. If there
 * is no selection, `undefined` will be returned. This is similar to
 * `window.getSelection().isCollapsed()`.
 *
 * @param props       The rich text value to check.
 * @param props.start
 * @param props.end
 * @return True if the selection is collapsed, false if not, undefined if there is no selection.
 */
export function isCollapsed( {
	start,
	end,
}: RichTextValue ): boolean | undefined {
	if ( start === undefined || end === undefined ) {
		return;
	}

	return start === end;
}
