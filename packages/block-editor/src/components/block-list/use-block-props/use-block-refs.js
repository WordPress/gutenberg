/**
 * WordPress dependencies
 */
import { useContext, useLayoutEffect, useReducer } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BlockRefs } from '../../provider/block-refs-provider';

export function useRegisteredBlockRefs( clientId ) {
	const { listeners, store } = useContext( BlockRefs );
	const [ , forceRender ] = useReducer( ( s ) => ! s );
	useLayoutEffect( () => {
		listeners.add( clientId, forceRender );
		return () => {
			listeners.remove( clientId, forceRender );
		};
	}, [ listeners, clientId, forceRender ] );
	return store[ clientId ] ? Array.from( store[ clientId ] ) : [];
}

export function useBlockRef( clientId, ref ) {
	const { listeners, store } = useContext( BlockRefs );
	const [ , forceRender ] = useReducer( ( s ) => ! s );
	useLayoutEffect( () => {
		store.add( clientId, ref );
		listeners.add( clientId, forceRender );
		return () => {
			store.remove( clientId, ref );
			listeners.remove( clientId, forceRender );
		};
	}, [ listeners, store, clientId, ref, forceRender ] );
}
