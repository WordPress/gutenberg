/**
 * Internal dependencies
 */
import { is } from './is';

/**
 * Determines if a value is empty, null, or undefined.
 *
 * @param {any} value The value to check.
 *
 * @return {boolean} Whether value is empty.
 */
export function isValueEmpty( value ) {
	const isEmptyString = value === '';

	return ! is.defined( value ) || isEmptyString;
}
