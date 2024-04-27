/**
 * WordPress dependencies
 */
import { useContext, useMemo, useRef } from '@wordpress/element';
import { useRefEffect, useObservableValue } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { BlockRefs } from '../../provider/block-refs-provider';

/** @typedef {import('@wordpress/element').RefCallback} RefCallback */
/** @typedef {import('@wordpress/element').RefObject} RefObject */

/**
 * Provides a ref to the BlockRefs context.
 *
 * @param {string} clientId The client ID of the element ref.
 *
 * @return {RefCallback} Ref callback.
 */
export function useBlockRefProvider( clientId ) {
	const { refsMap } = useContext( BlockRefs );
	return useRefEffect(
		( element ) => {
			refsMap.set( clientId, element );
			return () => refsMap.delete( clientId );
		},
		[ clientId ]
	);
}

/**
 * Gets a ref pointing to the current block element. Continues to return the same
 * stable ref object even if the `clientId` argument changes. This hook is not
 * reactive, i.e., it won't trigger a rerender of the calling component if the
 * ref value changes. For reactive use cases there is the `useBlockElement` hook.
 *
 * @param {string} clientId The client ID to get a ref for.
 *
 * @return {RefObject} A ref containing the element.
 */
function useBlockRef( clientId ) {
	const { refsMap } = useContext( BlockRefs );
	const latestClientId = useRef();
	latestClientId.current = clientId;

	// Always return an object, even if no ref exists for a given client ID, so
	// that `current` works at a later point.
	return useMemo(
		() => ( {
			get current() {
				return refsMap.get( latestClientId.current ) ?? null;
			},
		} ),
		[ refsMap ]
	);
}

/**
 * Return the element for a given client ID. Updates whenever the element
 * changes, becomes available, or disappears.
 *
 * @param {string} clientId The client ID to an element for.
 *
 * @return {Element|null} The block's wrapper element.
 */
function useBlockElement( clientId ) {
	const { refsMap } = useContext( BlockRefs );
	return useObservableValue( refsMap, clientId ) ?? null;
}

export { useBlockRef as __unstableUseBlockRef };
export { useBlockElement as __unstableUseBlockElement };
