/**
 * External dependencies
 */
import { isPlainObject } from 'lodash';

/**
 * Module constants
 */
const DEFAULT_ID = '[[default]]';

/**
 * Generates a unique identifier based on an object/scalar query arg.
 *
 * @param  {*}      query
 *
 * @return {string}       Request ID.
 */
export function getRequestId( query = DEFAULT_ID ) {
	return isPlainObject( query ) ? JSON.stringify( query ) : query;
}
