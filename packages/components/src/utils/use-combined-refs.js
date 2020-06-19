/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

export function useCombinedRefs( ...refs ) {
	const targetRef = useRef();

	useEffect( () => {
		refs.forEach( ( ref ) => {
			if ( ! ref ) return;

			if ( typeof ref === 'function' ) {
				ref( targetRef.current );
			} else {
				ref.current = targetRef.current;
			}
		} );
	}, [] );

	return targetRef;
}
