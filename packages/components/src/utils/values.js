/**
 * Determines if a value is null or undefined.
 *
 * @param {any} value The value to check.
 * @return {boolean} Whether value is null or undefined.
 */
export function isValueDefined( value ) {
	return value !== undefined && value !== null;
}

/**
 * Determines if a value is empty, null, or undefined.
 *
 * @param {any} value The value to check.
 * @return {boolean} Whether value is empty.
 */
export function isValueEmpty( value ) {
	const isEmptyString = value === '';

	return ! isValueDefined( value ) || isEmptyString;
}
