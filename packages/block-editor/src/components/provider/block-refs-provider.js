/**
 * WordPress dependencies
 */
import { createContext, useMemo } from '@wordpress/element';

export const BlockRefs = createContext( {
	refs: new Map(),
	callbacks: new Map(),
} );

export function BlockRefsProvider( { children } ) {
	const value = useMemo(
		() => ( { refs: new Map(), callbacks: new Map() } ),
		[]
	);
	return (
		<BlockRefs.Provider value={ value }>{ children }</BlockRefs.Provider>
	);
}
