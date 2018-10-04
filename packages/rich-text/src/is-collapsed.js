/**
 * Check if the selection of a Rich Text value is collapsed or not. Collapsed
 * means that no characters are selected, but there is a caret present. If there
 * is no selection, `undefined` will be returned. This is similar to
 * `window.getSelection().isCollapsed()`.
 *
 * @param {Object} value The rich text value to check.
 *
 * @return {?boolean} True if the selection is collapsed, false if not,
 *                    undefined if there is no selection.
 */
export function isCollapsed( { _start, _end } ) {
	if ( _start === undefined || _end === undefined ) {
		return;
	}

	return _start === _end;
}
