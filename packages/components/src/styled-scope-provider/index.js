/**
 * External dependencies
 */
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/core';
import memoize from 'memize';
import stylisPluginExtraScope from 'stylis-plugin-extra-scope';

const memoizedCreateCacheWithScope = memoize( ( scope ) => {
	return createCache( {
		stylisPlugins: [ stylisPluginExtraScope( scope ) ],
	} );
} );

/*
 * Provides Emotion with a scope to prefix before generated classNames.
 * Adding scope increases specificity.
 */
export default function StyledScopeProvider( {
	children = null,
	scope = '',
	...props
} ) {
	return (
		<CacheProvider
			{ ...props }
			value={ memoizedCreateCacheWithScope( scope ) }
		>
			{ children }
		</CacheProvider>
	);
}
