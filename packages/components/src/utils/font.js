/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import FONT from './font-values';

export function font( value ) {
	return get( FONT, value, '' );
}
