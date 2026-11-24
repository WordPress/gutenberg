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
	const { attributes, boundAttributeNames, getAttributesForCopy } = instances
		.values()
		.next().value!;
	if ( attributes !== block.attributes ) {
		return;
	}
	// A copy request can omit attributes that only have display placeholders.
	const boundAttributes = getAttributesForCopy();
	const availableAttributeNames = boundAttributeNames.filter(
		( attributeName ) =>
			Object.hasOwn( boundAttributes, attributeName ) &&
			boundAttributes[ attributeName ] !== undefined
	);
	if ( ! availableAttributeNames.length ) {
		return;
	}
	return Object.fromEntries(
		availableAttributeNames.map( ( attributeName ) => [
			attributeName,
			boundAttributes[ attributeName ],
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
