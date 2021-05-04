/**
 * External dependencies
 */
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

const memoizedCreateCacheWithContainer = memoize( ( container ) => {
	const key = useInstanceId( container, 'wp-css' );
	return createCache( { container, key } );
} );

export default function StyleProvider( { children, document } ) {
	if ( ! document ) {
		return null;
	}

	const cache = memoizedCreateCacheWithContainer( document.head );

	return <CacheProvider value={ cache }>{ children }</CacheProvider>;
}
