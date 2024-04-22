/**
 * WordPress dependencies
 */
import {
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BlockRefs } from '../../provider/block-refs-provider';

/** @typedef {import('@wordpress/element').RefCallback} RefCallback */
/** @typedef {import('@wordpress/element').RefObject} RefObject */

function addToMap( map, id, value ) {
	let setForId = map.get( id );
	if ( ! setForId ) {
		setForId = new Set();
		map.set( id, setForId );
	}
	setForId.add( value );
}

function deleteFromMap( map, id, value ) {
	const setForId = map.get( id );
	if ( ! setForId ) {
		return;
	}
	setForId.delete( value );
	if ( setForId.size === 0 ) {
		map.delete( id );
	}
}

function getRefElement( refs, clientId ) {
	// Multiple refs may be created for a single block. Find the
	// first that has an element set.
	const refsForId = refs.get( clientId );
	if ( refsForId ) {
		for ( const ref of refsForId ) {
			if ( ref.current ) {
				return ref.current;
			}
		}
	}
	return null;
}

function callListeners( callbacks, clientId ) {
	const list = callbacks.get( clientId );
	if ( ! list ) {
		return;
	}
	for ( const listener of list ) {
		listener();
	}
}

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
		addToMap( refs, clientId, ref );
		return () => deleteFromMap( refs, clientId, ref );
	}, [ refs, clientId ] );

	return useCallback(
		( element ) => {
			if ( ! element ) {
				return;
			}

			// Update the ref in the provider.
			ref.current = element;

			// Notify the `useBlockElement` hooks that are observing this `clientId`
			callListeners( callbacks, clientId );
		},
		[ callbacks, clientId ]
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
	const { refs } = useContext( BlockRefs );
	const latestClientId = useRef();
	latestClientId.current = clientId;

	// Always return an object, even if no ref exists for a given client ID, so
	// that `current` works at a later point.
	return useMemo(
		() => ( {
			get current() {
				return getRefElement( refs, latestClientId.current );
			},
		} ),
		[ refs ]
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
	const { refs, callbacks } = useContext( BlockRefs );
	const [ subscribe, getValue ] = useMemo(
		() => [
			( listener ) => {
				addToMap( callbacks, clientId, listener );
				return () => {
					deleteFromMap( callbacks, clientId, listener );
				};
			},
			() => getRefElement( refs, clientId ),
		],
		[ refs, callbacks, clientId ]
	);

	return useSyncExternalStore( subscribe, getValue, getValue );
}

export { useBlockRef as __unstableUseBlockRef };
export { useBlockElement as __unstableUseBlockElement };
