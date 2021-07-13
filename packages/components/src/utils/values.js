/* eslint-disable jsdoc/valid-types */
/**
 * Determines if a value is null or undefined.
 *
 * @template T
 *
 * @param {T | null | undefined} value The value to check.
 * @return {value is T} Whether value is not null or undefined.
 */
export function isValueDefined( value ) {
	return value !== undefined && value !== null;
}
/* eslint-enable jsdoc/valid-types */

/* eslint-disable jsdoc/valid-types */
/**
 * Determines if a value is empty, null, or undefined.
 *
 * @template T
 *
 * @param {T | "" | null | undefined} value The value to check.
 * @return {value is T} Whether value is empty.
 */
export function isValueEmpty( value ) {
	const isEmptyString = value === '';

	return ! isValueDefined( value ) || isEmptyString;
}
/* eslint-enable jsdoc/valid-types */

/**
 * Get the first defined/non-null value from an array.
 *
 * @template T
 *
 * @param {Array<T | null | undefined>} values        Values to derive from.
 * @param {T}                           fallbackValue Fallback value if there are no defined values.
 * @return {T} A defined value or the fallback value.
 */
export function getDefinedValue( values = [], fallbackValue ) {
	return values.find( isValueDefined ) ?? fallbackValue;
}
