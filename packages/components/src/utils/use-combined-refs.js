/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

export function useCombinedRefs( ...refs ) {
	const targetRef = useRef();

	useEffect( () => {
		refs.forEach( ( ref ) => {
			if ( ! ref ) return;

			/*
			 * Wrapping in try/catch as this causes issues in Jest.
			 * Cannot add property current, object is not extensible
			 */
			try {
				if ( typeof ref === 'function' ) {
					ref( targetRef.current );
				} else {
					ref.current = targetRef.current;
				}
			} catch {}
		} );
	}, [] );

	return targetRef;
}
