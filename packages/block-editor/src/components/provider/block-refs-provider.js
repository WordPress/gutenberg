/**
 * WordPress dependencies
 */
import { createContext, useMemo } from '@wordpress/element';

export const BlockRefs = createContext();

function createStore() {
	const listeners = {
		add( clientId, fn ) {
			listeners[ clientId ] = fn;
		},
		remove( clientId ) {
			delete listeners[ clientId ];
		},
	};
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
	return { listeners, store };
}

export function BlockRefsProvider( { children } ) {
	const value = useMemo( () => createStore(), [] );
	return (
		<BlockRefs.Provider value={ value }>{ children }</BlockRefs.Provider>
	);
}
