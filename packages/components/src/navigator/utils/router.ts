/**
 * External dependencies
 */
import { match } from 'path-to-regexp';

/**
 * Internal dependencies
 */
import type { NavigatorScreen } from '../types';

export function patternMatch( path: string, screens: NavigatorScreen[] ) {
	for ( const screen of screens ) {
		const matchingFunction = match( screen.path, {
			decode: decodeURIComponent,
		} );
		const matched = matchingFunction( path );
		if ( matched ) {
			return { params: matched.params, id: screen.id };
		}
	}

	return false;
}
