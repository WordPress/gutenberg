/**
 * External dependencies
 */
import createEmotionCache from '@emotion/cache';
import { CacheProvider } from '@emotion/core';
import memoize from 'memize';

/**
 * Internal dependencies
 */
import { stylisPluginCssCustomProperties } from './plugins';

const createCustomCache = memoize( () => {
	return createEmotionCache( {
		stylisPlugins: [ stylisPluginCssCustomProperties() ],
	} );
} );

function StyledProvider( { children, ...props } ) {
	return (
		<CacheProvider { ...props } value={ createCustomCache() }>
			{ children }
		</CacheProvider>
	);
}

export default StyledProvider;
