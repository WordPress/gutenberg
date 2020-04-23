/**
 * Internal dependencies
 */
import { useControlledState } from '../utils/hooks';

/**
 * Determines if a value is empty, null, or undefined.
 *
 * @param {any} value The value to check.
 * @return {boolean} Whether value is empty.
 */
export function isValueEmpty( value ) {
	const isNullish = typeof value === 'undefined' || value === null;
	const isEmptyString = value === '';

	return isNullish || isEmptyString;
}

/**
 * Custom hook to better handle incoming value and internal state.
 *
 * @param {*} initialValue
 */
export function useValueState( initialValue ) {
	/**
	 * React requires input HTML elements to have a defined value prop
	 * to be considered "controlled".
	 *
	 * For instances were an incoming value may be undefined or null,
	 * we'll need to transform it to an empty string.
	 */
	const value = isValueEmpty( initialValue ) ? '' : initialValue;

	return useControlledState( value );
}
