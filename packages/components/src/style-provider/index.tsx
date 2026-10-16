import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import * as uuid from 'uuid';
import { useLayoutEffect } from '@wordpress/element';
import { registerDocument } from '@wordpress/style-runtime';
import { contextConnectWithoutRef, useContextSystem } from '../context';
import type { StyleProviderProps } from './types';

const uuidCache = new Set();
// Use a weak map so that when the container is detached it's automatically
// dereferenced to avoid memory leak. Each container keeps one cache per nonce.
const containerCacheMap = new WeakMap<
	HTMLElement,
	Map< string | undefined, ReturnType< typeof createCache > >
>();

const memoizedCreateCacheWithContainer = (
	container: HTMLElement,
	nonce?: string
) => {
	let nonceCacheMap = containerCacheMap.get( container );
	if ( ! nonceCacheMap ) {
		nonceCacheMap = new Map();
		containerCacheMap.set( container, nonceCacheMap );
	}

	const existingCache = nonceCacheMap.get( nonce );
	if ( existingCache ) {
		return existingCache;
	}

	// Emotion only accepts alphabetical and hyphenated keys so we just
	// strip the numbers from the UUID. It _should_ be fine.
	let key = uuid.v4().replace( /[0-9]/g, '' );
	while ( uuidCache.has( key ) ) {
		key = uuid.v4().replace( /[0-9]/g, '' );
	}
	uuidCache.add( key );

	const cache = createCache( { container, key, nonce } );
	nonceCacheMap.set( nonce, cache );
	return cache;
};

function UnconnectedStyleProvider( props: StyleProviderProps ) {
	const { children, document, nonce } = useContextSystem<
		StyleProviderProps & { className?: string }
	>( props, 'StyleProvider' );

	useLayoutEffect( () => {
		if ( ! document ) {
			return;
		}

		return registerDocument( document );
	}, [ document ] );

	if ( ! document ) {
		return null;
	}

	const cache = memoizedCreateCacheWithContainer( document.head, nonce );

	return <CacheProvider value={ cache }>{ children }</CacheProvider>;
}

export const StyleProvider = contextConnectWithoutRef(
	UnconnectedStyleProvider,
	'StyleProvider'
);

export default StyleProvider;
