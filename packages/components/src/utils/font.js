/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import FONT from './font-values';

/**
 *
 * @param {keyof FONT} value Path of value from `FONT`
 * @return {string} Font rule value
 */
export function font( value ) {
	return get( FONT, value, '' );
}
