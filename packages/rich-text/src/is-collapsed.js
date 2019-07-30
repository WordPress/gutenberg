/**
 * Check if the selection of a Rich Text value is collapsed or not. Collapsed
 * means that no characters are selected, but there is a caret present. If there
 * is no selection, `undefined` will be returned. This is similar to
 * `window.getSelection().isCollapsed()`.
 *
 * @param {Object} value The rich text value to check.
 *
 * @return {boolean|undefined} True if the selection is collapsed, false if not,
 *                             undefined if there is no selection.
 */
export function isCollapsed( { start, end } ) {
	if ( start === undefined || end === undefined ) {
		return;
	}

	return start === end;
}
