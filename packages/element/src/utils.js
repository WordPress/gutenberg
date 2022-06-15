/**
 * External dependencies
 */
import { isNumber, isString } from 'lodash';

/**
 * Checks if the provided WP element is empty.
 *
 * @param {*} element WP element to check.
 * @return {boolean} True when an element is considered empty.
 */
export const isEmptyElement = ( element ) => {
	if ( isNumber( element ) ) {
		return false;
	}

	if ( isString( element ) || Array.isArray( element ) ) {
		return ! element.length;
	}

	return ! element;
};
