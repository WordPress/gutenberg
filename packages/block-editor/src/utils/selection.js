/**
 * External dependencies
 */
import { findKey } from 'lodash';

/**
 * A robust way to retain selection position through various
 * transforms is to insert a special character at the position and
 * then recover it.
 */
export const START_OF_SELECTED_AREA = '\u0086';

/**
 * Retrieve the block attribute that contains the selection position.
 *
 * @param {Object} blockAttributes Block attributes.
 * @return {string} The name of the block attribute that was previously selected.
 */
export function retrieveSelectedAttribute( blockAttributes ) {
	return findKey(
		blockAttributes,
		( v ) =>
			typeof v === 'string' && v.indexOf( START_OF_SELECTED_AREA ) !== -1
	);
}
