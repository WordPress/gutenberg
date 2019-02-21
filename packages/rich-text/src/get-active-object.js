/**
 * Gets the active object, if there is any.
 *
 * @param {Object} value Value to inspect.
 *
 * @return {?Object} Active object, or undefined.
 */
export function getActiveObject( { start, end, objects } ) {
	if ( start + 1 !== end ) {
		return;
	}

	return objects[ start ];
}
