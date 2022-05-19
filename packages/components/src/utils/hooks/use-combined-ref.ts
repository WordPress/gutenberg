/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
/**
 * External dependencies
 */
import type { MutableRefObject, RefCallback } from 'react';

type Ref< T > = MutableRefObject< T | null > | RefCallback< T | null >;

export function useCombinedRef< T extends HTMLElement >( ...refs: Ref< T >[] ) {
	const targetRef = useRef( null );

	useEffect( () => {
		refs.forEach( ( ref ) => {
			if ( ! ref ) return;

			if ( typeof ref === 'function' ) {
				ref( targetRef.current );
			} else {
				ref.current = targetRef.current;
			}
		} );
	}, [ refs ] );

	return targetRef;
}
