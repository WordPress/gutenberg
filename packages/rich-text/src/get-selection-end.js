/**
 * Gets the end index of the current selection, or returns `undefined` if no
 * selection exists. The selection ends right before the character at this
 * index.
 *
 * @param {Object} value Value to get the selection from.
 *
 * @return {number|undefined} Index where the selection ends.
 */
export function getSelectionEnd( { end } ) {
	return end;
}
