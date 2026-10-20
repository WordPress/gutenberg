import { createContext, useMemo } from '@wordpress/element';
import { observableMap } from '@wordpress/compose';
import type { BlockRefsContextValue, BlockRefsProviderProps } from './types';

// `eventHandlers` maps a block's client ID to a ref holding its `wrapperProps`
// event handlers, so the writing flow host can call them for a block that
// supports `editableRoot` (see `useEditableRootEventHandlers`). It rides in this
// context, next to `refsMap`, as another per-block registry keyed by client ID.
export const BlockRefs = createContext< BlockRefsContextValue >( {
	refsMap: observableMap(),
	eventHandlers: new Map(),
} );
BlockRefs.displayName = 'BlockRefsContext';

export function BlockRefsProvider( { children }: BlockRefsProviderProps ) {
	const value = useMemo< BlockRefsContextValue >(
		() => ( { refsMap: observableMap(), eventHandlers: new Map() } ),
		[]
	);
	return (
		<BlockRefs.Provider value={ value }>{ children }</BlockRefs.Provider>
	);
}
