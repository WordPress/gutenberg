/**
 * Gets the start index of the current selection, or returns `undefined` if no
 * selection exists. The selection starts right before the character at this
 * index.
 *
 * @param {Object} value Value to get the selection from.
 *
 * @return {number|undefined} Index where the selection starts.
 */
export function getSelectionStart( { start } ) {
	return start;
}
