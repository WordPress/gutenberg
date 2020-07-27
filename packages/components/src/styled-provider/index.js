/**
 * External dependencies
 */
import createEmotionCache from '@emotion/cache';
import { CacheProvider } from '@emotion/core';
import stylisPluginCssVariables from 'stylis-plugin-css-variables';
import memoize from 'memize';

const createCustomCache = memoize( () => {
	return createEmotionCache( {
		stylisPlugins: [ stylisPluginCssVariables() ],
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
