/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import Z_INDEX from './z-index-values';

export const zIndex = ( key ) => get( Z_INDEX, key, 0 );
