/**
 * Check if the selection of a rich text record is collapsed.
 *
 * @param {Object} record The rich text record to check.
 *
 * @return {boolean} True if the selection is collapsed, false if not.
 */
export function isCollapsed( { start, end } ) {
	if ( start === undefined || end === undefined ) {
		return;
	}

	return start === end;
}
