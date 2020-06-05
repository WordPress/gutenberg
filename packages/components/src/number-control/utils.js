/**
 * Parses a value to safely store value state.
 *
 * @param {any} value The incoming value.
 * @return {number} The parsed number value.
 */
export function getValue( value ) {
	const parsedValue = parseFloat( value );

	return isNaN( parsedValue ) ? value : parsedValue;
}
