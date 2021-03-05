/**
 * WordPress dependencies
 */
import { useLayoutEffect, useReducer } from '@wordpress/element';

const store = {
	add( clientId, ref ) {
		store[ clientId ] = store[ clientId ] || new Set();
		store[ clientId ].add( ref );

		if ( listeners[ clientId ] ) {
			listeners[ clientId ]();
		}
	},
	remove( clientId, ref ) {
		store[ clientId ].delete( ref );

		if ( listeners[ clientId ] ) {
			listeners[ clientId ]();
		}
	},
};

const listeners = {
	add( clientId, fn ) {
		listeners[ clientId ] = fn;
	},
	remove( clientId ) {
		delete listeners[ clientId ];
	},
};

function useUpdate( object, key, value ) {
	useLayoutEffect( () => {
		if ( ! key ) {
			return;
		}

		object.add( key, value );
		return () => {
			object.remove( key, value );
		};
	}, [ key, value ] );
}

export function useRegisteredBlockRefs( clientId ) {
	const [ , forceRender ] = useReducer( ( s ) => ! s );
	useUpdate( listeners, clientId, forceRender );
	return store[ clientId ] ? Array.from( store[ clientId ] ) : [];
}

export function useBlockRef( clientId, ref ) {
	useUpdate( store, clientId, ref );
}
