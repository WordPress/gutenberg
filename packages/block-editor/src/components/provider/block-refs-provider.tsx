import { createContext, useMemo } from '@wordpress/element';
import { observableMap } from '@wordpress/compose';
import type { Block } from '@wordpress/blocks';
import type {
	AttributesForCopy,
	BlockRefsContextValue,
	BlockRefsProviderProps,
} from './types';

// `eventHandlers` maps a block's client ID to a ref holding its `wrapperProps`
// event handlers, so the writing flow host can call them for a block that
// supports `editableRoot` (see `useEditableRootEventHandlers`). It rides in this
// context, next to `refsMap`, as another per-block registry keyed by client ID.
export const BlockRefs = createContext< BlockRefsContextValue >( {
	refsMap: observableMap(),
	eventHandlers: new Map(),
	attributesForCopy: new Map(),
} );
BlockRefs.displayName = 'BlockRefsContext';

export function getBoundAttributesForCopy(
	block: Pick< Block, 'clientId' | 'attributes' >,
	attributesForCopy?: AttributesForCopy
) {
	const instances = attributesForCopy?.get( block.clientId );
	if ( instances?.size !== 1 ) {
		return;
	}
	const { attributes, computedAttributes, boundAttributeNames } = instances
		.values()
		.next().value!;
	if (
		attributes !== block.attributes ||
		! boundAttributeNames.length ||
		boundAttributeNames.some(
			( attributeName ) =>
				! Object.hasOwn( computedAttributes, attributeName )
		)
	) {
		return;
	}
	return Object.fromEntries(
		boundAttributeNames.map( ( attributeName ) => [
			attributeName,
			computedAttributes[ attributeName ],
		] )
	);
}

export function BlockRefsProvider( { children }: BlockRefsProviderProps ) {
	const value = useMemo< BlockRefsContextValue >(
		() => ( {
			refsMap: observableMap(),
			eventHandlers: new Map(),
			attributesForCopy: new Map(),
		} ),
		[]
	);
	return (
		<BlockRefs.Provider value={ value }>{ children }</BlockRefs.Provider>
	);
}
