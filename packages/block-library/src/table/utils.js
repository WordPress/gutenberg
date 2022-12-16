/**
 * Normalize the row or column span value.
 *
 * @param {number|undefined} rowColSpan normalized value.
 */
export function normalizeRowColSpan( rowColSpan ) {
	return parseInt( rowColSpan, 10 ) && parseInt( rowColSpan, 10 ) !== 1
		? parseInt( rowColSpan, 10 )
		: undefined;
}
