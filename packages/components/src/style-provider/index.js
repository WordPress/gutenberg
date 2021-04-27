/**
 * External dependencies
 */
import { CacheProvider } from '@emotion/core';
import createCache from '@emotion/cache';
import memoize from 'memize';

const memoizedCreateCacheWithContainer = memoize( ( container ) => {
	return createCache( { container } );
} );

export default function StyleProvider( { children, document } ) {
	if ( ! document ) {
		return null;
	}

	const cache = memoizedCreateCacheWithContainer( document.head );

	return <CacheProvider value={ cache }>{ children }</CacheProvider>;
}
