/**
 * WordPress dependencies
 */
import {
	useContext,
	useState,
	useLayoutEffect,
	useCallback,
} from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { BlockRefs } from '../../provider/block-refs-provider';

/** @typedef {import('@wordpress/element').RefCallback} RefCallback */
/** @typedef {import('@wordpress/element').Ref} Ref */

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
 * Tracks the DOM element for the block identified by `clientId` and assigns it to the `ref`
 * whenever it changes.
 *
 * @param {string} clientId The client ID to track.
 * @param {Ref}    ref      The ref object/callback to assign to.
 */
export function useBlockElementRef( clientId, ref ) {
	const { refsMap } = useContext( BlockRefs );
	const setRef = useCallback(
		( el ) => {
			if ( typeof ref === 'function' ) {
				ref( el );
			} else if ( ref ) {
				ref.current = el;
			}
		},
		[ ref ]
	);

	useLayoutEffect( () => {
		setRef( refsMap.get( clientId ) );
		const unsubscribe = refsMap.subscribe( clientId, () =>
			setRef( refsMap.get( clientId ) )
		);
		return () => {
			unsubscribe();
			setRef( null );
		};
	}, [ refsMap, clientId, setRef ] );
}

/**
 * Return the element for a given client ID. Updates whenever the element
 * changes, becomes available, or disappears.
 *
 * @param {string} clientId The client ID to an element for.
 *
 * @return {Element|null} The block's wrapper element.
 */
export function useBlockElement( clientId ) {
	const [ blockElement, setBlockElement ] = useState( null );
	useBlockElementRef( clientId, setBlockElement );
	return blockElement;
}
