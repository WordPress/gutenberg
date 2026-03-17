/**
 * WordPress dependencies
 */
import { createContext, useMemo } from '@wordpress/element';
import { observableMap } from '@wordpress/compose';

export const BlockRefs = createContext( { refsMap: observableMap() } );
BlockRefs.displayName = 'BlockRefsContext';

export function BlockRefsProvider( { children } ) {
	const value = useMemo( () => ( { refsMap: observableMap() } ), [] );
	return (
		<BlockRefs.Provider value={ value }>{ children }</BlockRefs.Provider>
	);
}
