/**
 * Determines if a value is null or undefined.
 *
 * @param value The value to check.
 * @return Whether value is not null or undefined.
 */
export function isValueDefined< T >(
	value: T
): value is Exclude< T, null | undefined > {
	return value !== undefined && value !== null;
}

/**
 * Determines if a value is empty, null, or undefined.
 *
 * @param value The value to check.
 * @return Whether value is empty.
 */
export function isValueEmpty(
	value: string | number | null | undefined
): value is '' | null | undefined {
	const isEmptyString = value === '';

	return ! isValueDefined( value ) || isEmptyString;
}

/**
 * Get the first defined/non-null value from an array.
 *
 * @param values        Values to derive from.
 * @param fallbackValue Fallback value if there are no defined values.
 * @return A defined value or the fallback value.
 */
export function getDefinedValue< T >(
	values: Array< T | null | undefined > = [],
	fallbackValue: T
) {
	return values.find( isValueDefined ) ?? fallbackValue;
}

/**
 * Converts a string to a number.
 *
 * @param value
 * @return String as a number.
 */
export const stringToNumber = ( value: string ) => {
	return parseFloat( value );
};

/**
 * Regardless of the input being a string or a number, returns a number.
 *
 * Returns `undefined` in case the string is `undefined` or not a valid numeric value.
 *
 * @param value
 * @return The parsed number.
 */
export const ensureNumber = ( value: string | number ) => {
	return typeof value === 'string' ? stringToNumber( value ) : value;
};
