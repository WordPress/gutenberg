/**
 * Normalize the rowspan/colspan value.
 * Returns undefined if the parameter is not a positive number
 * or the default value (1) for rowspan/colspan.
 *
 * @param {number|undefined} rowColSpan rowspan/colspan value.
 *
 * @return {string|undefined} normalized rowspan/colspan value.
 */
export function normalizeRowColSpan( rowColSpan ) {
	const parsedValue = parseInt( rowColSpan, 10 );
	if ( ! Number.isInteger( parsedValue ) ) {
		return undefined;
	}
	return parsedValue < 0 || parsedValue === 1
		? undefined
		: parsedValue.toString();
}
