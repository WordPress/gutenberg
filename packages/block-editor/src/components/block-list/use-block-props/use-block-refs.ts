import type { Ref, RefCallback } from 'react';
import { useContext, useState, useLayoutEffect } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { BlockRefs } from '../../provider/block-refs-provider';

/**
 * Provides a ref to the BlockRefs context.
 *
 * @param clientId The client ID of the element ref.
 *
 * @return Ref callback.
 */
export function useBlockRefProvider(
	clientId: string
): RefCallback< Element > {
	const { refsMap } = useContext( BlockRefs );
	return useRefEffect(
		( element ) => {
			refsMap.set( clientId, element );
			return () => refsMap.delete( clientId );
		},
		[ clientId ]
	);
}

function assignRef( ref: Ref< Element | null >, value: Element | null ) {
	if ( typeof ref === 'function' ) {
		ref( value );
	} else if ( ref ) {
		ref.current = value;
	}
}

/**
 * Tracks the DOM element for the block identified by `clientId` and assigns it to the `ref`
 * whenever it changes.
 *
 * @param clientId The client ID to track.
 * @param ref      The ref object/callback to assign to.
 */
export function useBlockElementRef(
	clientId: string,
	ref: Ref< Element | null >
) {
	const { refsMap } = useContext( BlockRefs );
	useLayoutEffect( () => {
		assignRef( ref, refsMap.get( clientId ) );
		const unsubscribe = refsMap.subscribe( clientId, () =>
			assignRef( ref, refsMap.get( clientId ) )
		);
		return () => {
			unsubscribe();
			assignRef( ref, null );
		};
	}, [ refsMap, clientId, ref ] );
}

/**
 * Return the element for a given client ID. Updates whenever the element
 * changes, becomes available, or disappears.
 *
 * @param clientId The client ID to an element for.
 *
 * @return The block's wrapper element.
 */
export function useBlockElement( clientId: string ) {
	const [ blockElement, setBlockElement ] = useState< Element | null >(
		null
	);
	useBlockElementRef( clientId, setBlockElement );
	return blockElement;
}
