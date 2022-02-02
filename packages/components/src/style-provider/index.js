//@ts-nocheck

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * External dependencies
 */
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import memoize from 'memize';
import * as uuid from 'uuid';

const uuidCache = new Set();

const memoizedCreateCacheWithContainer = memoize( ( container ) => {
	// emotion only accepts alphabetical and hyphenated keys so we just strip the numbers from the UUID. It _should_ be fine.
	let key = uuid.v4().replace( /[0-9]/g, '' );
	while ( uuidCache.has( key ) ) {
		key = uuid.v4().replace( /[0-9]/g, '' );
	}
	uuidCache.add( key );
	container.dataset.emotionCacheKey = key;
	return createCache( { container, key } );
} );

const heads = [];
window._heads = heads;

const DocumentHeadContext = createContext( {
	docHead: null,
} );
DocumentHeadContext.displayName = 'DocumentHeadContext';

export default function StyleProvider( { children, document, whichOne } ) {
	const { docHead: contextHead } = useContext( DocumentHeadContext );

	const head = document?.head ?? contextHead ?? null;

	if ( ! head ) return null;

	if ( ! heads.includes( head ) ) heads.push( head );

	console.log( { whichOne, document, contextHead, head, heads } );

	if ( head === contextHead ) {
		// If using same head as in context no need to insert a new cache provider
		return children;
	}

	const cache = memoizedCreateCacheWithContainer( head );

	return (
		<DocumentHeadContext.Provider value={ 'ciao' }>
			<CacheProvider value={ cache }>{ children }</CacheProvider>
		</DocumentHeadContext.Provider>
	);
}
