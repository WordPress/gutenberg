/**
 * Internal dependencies
 */
import { useRef, useLayoutEffect, useCallback } from './react';

export default function useSafeDispatch( dispatch ) {
	const mounted = useRef( false );
	// @ts-ignore
	useLayoutEffect( () => {
		mounted.current = true;
		return () => ( mounted.current = false );
	}, [] );
	return useCallback(
		( ...args ) => ( mounted.current ? dispatch( ...args ) : void 0 ),
		[ dispatch ]
	);
}
