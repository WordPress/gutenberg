/**
 * External dependencies
 */
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import memoize from 'memize';
import * as uuid from 'uuid';

/**
 * Internal dependencies
 */
import type { StyleProviderProps } from './types';

const uuidCache = new Set();

const memoizedCreateCacheWithContainer = memoize(
	( container: HTMLElement ) => {
		// Emotion only accepts alphabetical and hyphenated keys so we just
		// strip the numbers from the UUID. It _should_ be fine.
		let key = uuid.v4().replace( /[0-9]/g, '' );
		while ( uuidCache.has( key ) ) {
			key = uuid.v4().replace( /[0-9]/g, '' );
		}
		uuidCache.add( key );
		return createCache( { container, key } );
	}
);

export function StyleProvider( props: StyleProviderProps ) {
	const { children, document } = props;

	if ( ! document ) {
		return null;
	}

	const cache = memoizedCreateCacheWithContainer( document.head );

	return <CacheProvider value={ cache }>{ children }</CacheProvider>;
}

export default StyleProvider;
