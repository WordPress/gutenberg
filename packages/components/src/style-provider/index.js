/**
 * External dependencies
 */
import { CacheProvider } from '@emotion/core';
import createCache from '@emotion/cache';
import memoize from 'memize';

const memoizedCreateCacheWithContainer = memoize( ( container ) => {
	return createCache( { container } );
} );

export default function StyleProvider( { children, iframeDocument } ) {
	if ( ! iframeDocument ) {
		return null;
	}

	const cache = memoizedCreateCacheWithContainer( iframeDocument.head );

	return <CacheProvider value={ cache }>{ children }</CacheProvider>;
}
