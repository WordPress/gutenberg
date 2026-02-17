/**
 * WordPress dependencies
 */
import { useEffect, useReducer, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { checkGravatar } from './gravatar-check';

/**
 * Initiates Gravatar default-detection for a list of URLs and re-renders the
 * component when any check completes. Returns a version counter suitable for
 * inclusion in hook dependency arrays.
 *
 * After this hook fires, use `resolveGravatarUrl(url)` from `gravatar-check.ts`
 * to get the URL for confirmed custom Gravatars (or `undefined` for defaults,
 * which lets the Avatar component show its initials fallback).
 *
 * @param urls - Array of Gravatar URLs to check.
 * @return A version counter that increments when results change.
 */
export function useResolveGravatars( urls: ( string | undefined )[] ): number {
	const [ version, bumpVersion ] = useReducer( ( n: number ) => n + 1, 0 );
	const checked = useRef( new Set< string >() );

	useEffect( () => {
		urls.forEach( ( url ) => {
			if ( url && ! checked.current.has( url ) ) {
				checked.current.add( url );
				checkGravatar( url, bumpVersion );
			}
		} );
	}, [ urls, bumpVersion ] );

	return version;
}
