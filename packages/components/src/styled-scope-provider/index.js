/**
 * External dependencies
 */
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/core';
import memoize from 'memize';
import stylisPluginExtraScope from 'stylis-plugin-extra-scope';

/*
 * This creates a custom cache, which emotion uses internally to handle
 * CSS namespacing.
 *
 * This technique was suggested by a couple of the main emotion maintainers.
 *
 * https://github.com/emotion-js/emotion/issues/760#issuecomment-404353706
 */
const memoizedCreateCacheWithScope = memoize( ( scope ) => {
	return createCache( {
		stylisPlugins: [ stylisPluginExtraScope( scope ) ],
	} );
} );

/*
 * Provides Emotion with a scope to prefix before generated classNames.
 * Adding scope increases specificity.
 */
export default function StyledScopeProvider( { children, scope, ...props } ) {
	if ( ! scope ) return children;

	return (
		<CacheProvider
			{ ...props }
			value={ memoizedCreateCacheWithScope( scope ) }
		>
			{ children }
		</CacheProvider>
	);
}
