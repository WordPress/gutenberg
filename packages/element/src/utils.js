/**
 * External dependencies
 */
import { isString } from 'lodash';

/**
 * Checks if the provided WP element is empty.
 *
 * @param {*} element WP element to check.
 * @return {boolean} True when an element is considered empty.
 */
export const isEmptyElement = ( element ) => {
	if ( typeof element === 'number' ) {
		return false;
	}

	if ( isString( element ) || Array.isArray( element ) ) {
		return ! element.length;
	}

	return ! element;
};
