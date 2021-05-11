/**
 * WordPress dependencies
 */
import {
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';

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
	const { refs, callbacks } = useContext( BlockRefs );
	const ref = useRef();
	useLayoutEffect( () => {
		refs.set( clientId, ref );
		return () => {
			refs.delete( clientId );
		};
	}, [] );
	return useCallback( ( element ) => {
		// Update the ref in the provider.
		ref.current = element;
		// Call any update functions.
		callbacks.forEach( ( id, setElement ) => {
			if ( clientId === id ) {
				setElement( element );
			}
		} );
	}, [] );
}

/**
 * Gets a ref pointing to the current block element. Continues to return a
 * stable ref even if the block client ID changes.
 *
 * @param {string} clientId The client ID to get a ref for.
 *
 * @return {RefObject} A ref containing the element.
 */
function useBlockRef( clientId ) {
	const { refs } = useContext( BlockRefs );
	const freshClientId = useRef();
	freshClientId.current = clientId;
	// Always return an object, even if no ref exists for a given client ID, so
	// that `current` works at a later point.
	return useMemo(
		() => ( {
			get current() {
				return refs.get( freshClientId.current )?.current || null;
			},
		} ),
		[]
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
	const { callbacks } = useContext( BlockRefs );
	const ref = useBlockRef( clientId );
	const [ element, setElement ] = useState( null );

	useLayoutEffect( () => {
		if ( ! clientId ) {
			return;
		}

		callbacks.set( setElement, clientId );
		return () => {
			callbacks.delete( setElement );
		};
	}, [ clientId ] );

	return ref.current || element;
}

export { useBlockRef as __unstableUseBlockRef };
export { useBlockElement as __unstableUseBlockElement };
