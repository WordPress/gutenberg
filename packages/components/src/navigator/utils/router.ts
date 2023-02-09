/**
 * External dependencies
 */
import { match } from 'path-to-regexp';

/**
 * Internal dependencies
 */
import type { Screen, MatchParams } from '../types';

export function patternMatch( path: string, screens: Screen[] ) {
	for ( const screen of screens ) {
		const matchingFunction = match< MatchParams >( screen.path, {
			decode: decodeURIComponent,
		} );
		const matched = matchingFunction( path );
		if ( matched ) {
			return { params: matched.params, id: screen.id };
		}
	}

	return undefined;
}

export function findParent( path: string, screens: Screen[] ) {
	if ( path[ 0 ] !== '/' ) {
		return undefined;
	}
	const pathParts = path.split( '/' );
	let parentPath;
	while ( pathParts.length > 1 && ! parentPath ) {
		pathParts.pop();
		const potentialParentPath =
			pathParts.join( '/' ) === '' ? '/' : pathParts.join( '/' );
		if (
			screens.find( ( screen ) => {
				const matchingFunction = match( screen.path, {
					decode: decodeURIComponent,
				} );
				return matchingFunction( potentialParentPath ) !== false;
			} )
		) {
			parentPath = potentialParentPath;
		}
	}

	return parentPath;
}
